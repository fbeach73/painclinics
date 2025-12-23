/**
 * Migration script: Update missing clinic data from CSV files
 *
 * This script reads CSV files containing clinic data and updates the database
 * with missing fields like clinic_hours, review_keywords, featured_reviews,
 * popular_times, google_listing_link, social links, and questions.
 *
 * Run with: pnpm tsx src/scripts/update-missing-clinic-data.ts
 *
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --limit=N    Process only N records (for testing)
 *   --verbose    Show detailed output for each clinic
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { parse } from "csv-parse/sync";
import postgres from "postgres";
import type {
  ClinicHour,
  FeaturedReview,
  PopularTime,
  ReviewKeyword,
} from "@/lib/clinic-transformer";

// Configuration
const CSV_DIR = "specs/pain-clinic-directory/data/clinics";

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const VERBOSE = args.includes("--verbose");
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1] ?? "0", 10) : Infinity;

// Type definitions (use shared types from clinic-transformer for: ClinicHour, ReviewKeyword, FeaturedReview, PopularTime)
interface ScoreCount {
  score: number;
  count: number;
}

interface Question {
  question: string;
  answer: string;
}

interface CSVRow {
  [key: string]: string | undefined;
}

interface UpdateData {
  clinic_hours: ClinicHour[] | null;
  review_keywords: ReviewKeyword[] | null;
  reviews_per_score: ScoreCount[] | null;
  featured_reviews: FeaturedReview[] | null;
  popular_times: PopularTime[] | null;
  google_listing_link: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  linkedin: string | null;
  youtube: string | null;
  tiktok: string | null;
  pinterest: string | null;
  questions: Question[] | null;
}

// Data transformation functions
function parseClinicHours(days: string, hours: string): ClinicHour[] | null {
  if (!days || !hours) return null;
  const dayArr = days.split("|").map((d) => d.trim());
  const hourArr = hours.split("|").map((h) => h.trim());
  if (dayArr.length === 0) return null;

  const result = dayArr.map((day, i) => ({
    day,
    hours: hourArr[i] || "Closed",
  }));

  // Check if all hours are empty or "Closed"
  const hasRealHours = result.some(
    (r) => r.hours && r.hours.toLowerCase() !== "closed" && r.hours !== ""
  );
  return hasRealHours ? result : null;
}

function parseReviewKeywords(
  keywords: string,
  counts: string
): ReviewKeyword[] | null {
  if (!keywords || !counts) return null;
  const keywordArr = keywords.split("|").map((k) => k.trim());
  const countArr = counts.split("|").map((c) => parseInt(c.trim(), 10));
  if (keywordArr.length === 0 || keywordArr[0] === "") return null;

  return keywordArr
    .map((keyword, i) => {
      const count = countArr[i];
      return {
        keyword,
        count: count !== undefined && !isNaN(count) ? count : 0,
      };
    })
    .filter((k) => k.keyword && k.count > 0);
}

function parseReviewsPerScore(
  scores: string,
  counts: string
): ScoreCount[] | null {
  if (!scores || !counts) return null;
  const scoreArr = scores.split("|").map((s) => parseInt(s.trim(), 10));
  const countArr = counts.split("|").map((c) => parseInt(c.trim(), 10));
  const firstScore = scoreArr[0];
  if (scoreArr.length === 0 || firstScore === undefined || isNaN(firstScore))
    return null;

  return scoreArr
    .map((score, i) => {
      const count = countArr[i];
      return {
        score,
        count: count !== undefined && !isNaN(count) ? count : 0,
      };
    })
    .filter((s) => !isNaN(s.score));
}

function parseFeaturedReviews(row: CSVRow): FeaturedReview[] | null {
  const usernames = row["Featured Reviews_username"]?.split("|") || [];
  const reviews = row["Featured Reviews_review"]?.split("|") || [];
  const ratings = row["Featured Reviews_rating"]?.split("|") || [];
  const dates = row["Featured Reviews_date_review_left"]?.split("|") || [];
  const profileUrls = row["Featured Reviews_profile_url"]?.split("|") || [];

  if (usernames.length === 0 || !usernames[0]?.trim()) return null;

  const result = usernames
    .map((username, i) => ({
      username: username.trim(),
      review: reviews[i]?.trim() || "",
      rating: parseInt(ratings[i]?.trim() || "0", 10) || 0,
      date: dates[i]?.trim() || "",
      url: profileUrls[i]?.trim() || "",
    }))
    .filter((r) => r.username && r.review);

  return result.length > 0 ? result : null;
}

function parsePopularTimes(
  hours: string,
  popularity: string
): PopularTime[] | null {
  if (!hours || !popularity) return null;
  const hourArr = hours.split("|").map((h) => h.trim());
  const popArr = popularity.split("|").map((p) => parseFloat(p.trim()));
  if (hourArr.length === 0 || !hourArr[0]) return null;

  const result = hourArr
    .map((hour, i) => {
      const pop = popArr[i];
      return {
        hour,
        popularity: pop !== undefined && !isNaN(pop) ? Math.round(pop) : 0,
      };
    })
    .filter((p) => p.hour);

  return result.length > 0 ? result : null;
}

function parseQuestions(questions: string, answers: string): Question[] | null {
  if (!questions || !answers) return null;
  const qArr = questions.split("|").map((q) => q.trim());
  const aArr = answers.split("|").map((a) => a.trim());
  if (qArr.length === 0 || !qArr[0]) return null;

  const result = qArr
    .map((question, i) => ({
      question,
      answer: aArr[i] || "",
    }))
    .filter((qa) => qa.question && qa.answer);

  return result.length > 0 ? result : null;
}

function extractPermalink(fullUrl: string): string | null {
  if (!fullUrl) return null;
  // Extract path from full URL like https://painclinics.com/pain-management/clinic-name/
  if (fullUrl.includes("painclinics.com/")) {
    const path = fullUrl.split("painclinics.com/")[1]?.replace(/\/$/, "");
    return path || null;
  }
  // If it's already just a path
  return fullUrl.replace(/^\//, "").replace(/\/$/, "") || null;
}

function cleanUrl(url: string | undefined): string | null {
  if (!url || url.trim() === "") return null;
  const cleaned = url.trim();
  // Basic URL validation
  if (
    cleaned.startsWith("http://") ||
    cleaned.startsWith("https://") ||
    cleaned.startsWith("www.")
  ) {
    return cleaned;
  }
  return null;
}

function buildUpdates(row: CSVRow): UpdateData {
  return {
    clinic_hours: parseClinicHours(
      row["Clinic Hours_day"] || "",
      row["Clinic Hours_hours"] || ""
    ),
    review_keywords: parseReviewKeywords(
      row["Review Keywords_keyword"] || "",
      row["Review Keywords_keyword_count"] || ""
    ),
    reviews_per_score: parseReviewsPerScore(
      row["Reviews Per Score Rating_review_score_number"] || "",
      row["Reviews Per Score Rating_review_score_count"] || ""
    ),
    featured_reviews: parseFeaturedReviews(row),
    popular_times: parsePopularTimes(
      row["Popular times_hour_of_day"] || "",
      row["Popular times_average_popularity"] || ""
    ),
    google_listing_link: cleanUrl(row["Google Listing Link"]),
    facebook: cleanUrl(row["facebook"]),
    instagram: cleanUrl(row["instagram"]),
    twitter: cleanUrl(row["twitter"]),
    linkedin: cleanUrl(row["linkedin"]),
    youtube: cleanUrl(row["youtube"]),
    tiktok: cleanUrl(row["tiktok"]),
    pinterest: cleanUrl(row["pinterest"]),
    questions: parseQuestions(row["Question"] || "", row["Answer"] || ""),
  };
}

async function migrate() {
  console.log("=".repeat(60));
  console.log("Update Missing Clinic Data Migration");
  console.log("=".repeat(60));

  if (DRY_RUN) {
    console.log("\n*** DRY RUN MODE - No changes will be made ***\n");
  }

  if (LIMIT !== Infinity) {
    console.log(`*** LIMITED RUN - Processing only ${LIMIT} records ***\n`);
  }

  // Connect to database
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error("ERROR: POSTGRES_URL environment variable is not set");
    process.exit(1);
  }

  const sql = postgres(connectionString);

  // Get all CSV files
  const csvFiles = readdirSync(CSV_DIR)
    .filter((f) => f.endsWith(".csv"))
    .sort();

  console.log(`\nFound ${csvFiles.length} CSV files to process`);

  const stats = {
    processed: 0,
    updated: 0,
    notFound: 0,
    errors: 0,
    skipped: 0,
    fieldUpdates: {
      clinic_hours: 0,
      review_keywords: 0,
      reviews_per_score: 0,
      featured_reviews: 0,
      popular_times: 0,
      google_listing_link: 0,
      facebook: 0,
      instagram: 0,
      twitter: 0,
      linkedin: 0,
      youtube: 0,
      tiktok: 0,
      pinterest: 0,
      questions: 0,
    } as Record<string, number>,
  };

  const notFoundPermalinks: string[] = [];

  for (const file of csvFiles) {
    if (stats.processed >= LIMIT) break;

    console.log(`\nProcessing ${file}...`);
    const content = readFileSync(join(CSV_DIR, file), "utf-8");

    let rows: CSVRow[];
    try {
      rows = parse(content, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true,
      });
    } catch (parseError) {
      console.error(`  Error parsing ${file}:`, parseError);
      continue;
    }

    console.log(`  Found ${rows.length} rows`);

    for (const row of rows) {
      if (stats.processed >= LIMIT) break;

      stats.processed++;

      // Extract permalink from full URL
      const fullPermalink = row["Permalink"];
      const permalink = extractPermalink(fullPermalink || "");

      if (!permalink) {
        stats.skipped++;
        continue;
      }

      // Build update object
      const updates = buildUpdates(row);

      // Check if we have any data to update
      const hasUpdates = Object.values(updates).some((v) => v !== null);
      if (!hasUpdates) {
        stats.skipped++;
        continue;
      }

      if (VERBOSE) {
        console.log(`  Processing: ${permalink}`);
      }

      if (!DRY_RUN) {
        try {
          // Update the clinic - only set fields that have new data
          // Use sql.json() to properly serialize JSONB values
           
          const jsonify = (val: unknown) => (val ? sql.json(val as any) : null);
          const result = await sql`
            UPDATE clinics SET
              clinic_hours = COALESCE(${jsonify(updates.clinic_hours)}, clinic_hours),
              review_keywords = COALESCE(${jsonify(updates.review_keywords)}, review_keywords),
              reviews_per_score = COALESCE(${jsonify(updates.reviews_per_score)}, reviews_per_score),
              featured_reviews = COALESCE(${jsonify(updates.featured_reviews)}, featured_reviews),
              popular_times = COALESCE(${jsonify(updates.popular_times)}, popular_times),
              google_listing_link = COALESCE(${updates.google_listing_link}, google_listing_link),
              facebook = COALESCE(${updates.facebook}, facebook),
              instagram = COALESCE(${updates.instagram}, instagram),
              twitter = COALESCE(${updates.twitter}, twitter),
              linkedin = COALESCE(${updates.linkedin}, linkedin),
              youtube = COALESCE(${updates.youtube}, youtube),
              tiktok = COALESCE(${updates.tiktok}, tiktok),
              pinterest = COALESCE(${updates.pinterest}, pinterest),
              questions = COALESCE(${jsonify(updates.questions)}, questions),
              updated_at = NOW()
            WHERE LOWER(permalink) = LOWER(${permalink})
          `;

          if (result.count > 0) {
            stats.updated++;

            // Track field-level updates
            for (const [field, value] of Object.entries(updates)) {
              if (value !== null && stats.fieldUpdates[field] !== undefined) {
                stats.fieldUpdates[field]++;
              }
            }
          } else {
            stats.notFound++;
            if (notFoundPermalinks.length < 10) {
              notFoundPermalinks.push(permalink);
            }
          }
        } catch (error) {
          stats.errors++;
          if (VERBOSE) {
            console.error(`  Error updating ${permalink}:`, error);
          }
        }
      } else {
        // Dry run - just count what we would update
        stats.updated++;
        for (const [field, value] of Object.entries(updates)) {
          if (value !== null && stats.fieldUpdates[field] !== undefined) {
            stats.fieldUpdates[field]++;
          }
        }
      }

      // Progress logging
      if (stats.processed % 500 === 0) {
        console.log(
          `  Processed ${stats.processed} rows, updated ${stats.updated}...`
        );
      }
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("MIGRATION COMPLETE");
  console.log("=".repeat(60));

  console.log(`\nProcessed: ${stats.processed}`);
  console.log(`Updated: ${stats.updated}`);
  console.log(`Not Found: ${stats.notFound}`);
  console.log(`Skipped (no data): ${stats.skipped}`);
  console.log(`Errors: ${stats.errors}`);

  console.log("\nField Updates:");
  for (const [field, count] of Object.entries(stats.fieldUpdates)) {
    if (count > 0) {
      console.log(`  ${field}: ${count}`);
    }
  }

  if (notFoundPermalinks.length > 0) {
    console.log("\nSample permalinks not found in database:");
    for (const p of notFoundPermalinks) {
      console.log(`  - ${p}`);
    }
  }

  // Close database connection
  await sql.end();

  console.log("\n" + "=".repeat(60));
  if (DRY_RUN) {
    console.log("Dry run complete - no changes were made");
    console.log("Run without --dry-run to apply changes");
  } else {
    console.log("Migration complete!");
  }
  console.log("=".repeat(60));
}

// Run the migration
migrate()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nMigration failed:", error);
    process.exit(1);
  });
