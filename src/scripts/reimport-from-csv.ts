/**
 * Re-import 524 clinics from CSV files to populate missing data
 * (images, reviews, hours, etc.) that the WordPress REST API didn't provide.
 *
 * Run: POSTGRES_URL="postgresql://..." pnpm tsx src/scripts/reimport-from-csv.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";
import {
  type RawClinicCSVRow,
  parseReviewKeywords,
  parseClinicHours,
  parseFeaturedReviews,
  parsePopularTimes,
  parseReviewsPerScore,
  parseAmenities,
  parseImageUrls,
  parseCheckboxFeatures,
  parseQuestions,
  getFirstImageUrl,
} from "@/lib/clinic-transformer";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";

const CSV_DIR = path.join(
  process.cwd(),
  "specs/pain-clinic-directory/data/clinics"
);

/**
 * Extract slug from CSV permalink
 * @example "https://www.painclinics.com/pain-management/clinic-name-al-35243/" => "clinic-name-al-35243"
 */
function extractSlug(permalink: string): string | null {
  const match = permalink.match(/\/pain-management\/([^/]+)\/?$/);
  return match?.[1] || null;
}

/**
 * Load and parse all CSV files, building a slug-to-row mapping
 */
async function loadAllCSVData(): Promise<Map<string, RawClinicCSVRow>> {
  const slugToRow = new Map<string, RawClinicCSVRow>();

  // Find all CSV files in the directory
  const csvFiles = fs
    .readdirSync(CSV_DIR)
    .filter((f) => f.endsWith(".csv"))
    .sort();

  console.log(`Found ${csvFiles.length} CSV files to process`);

  for (const file of csvFiles) {
    const filePath = path.join(CSV_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");

    const rows: RawClinicCSVRow[] = parse(content, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      bom: true,
    });

    let fileMatches = 0;
    for (const row of rows) {
      const permalink = row.Permalink;
      if (!permalink) continue;

      const slug = extractSlug(permalink);
      if (slug) {
        slugToRow.set(slug, row);
        fileMatches++;
      }
    }

    console.log(`  ${file}: ${rows.length} rows, ${fileMatches} with valid slugs`);
  }

  console.log(`Total CSV records indexed: ${slugToRow.size}`);
  return slugToRow;
}

/**
 * Get all minimal-data clinics (imported from WordPress API without full data)
 */
async function getMinimalClinics(): Promise<
  { id: string; permalink: string }[]
> {
  const results = await db
    .select({ id: clinics.id, permalink: clinics.permalink })
    .from(clinics)
    .where(eq(clinics.mapLatitude, 0));

  return results;
}

/**
 * Extract slug from database permalink
 * @example "pain-management/clinic-name-al-35243" => "clinic-name-al-35243"
 */
function extractDbSlug(permalink: string): string | null {
  const match = permalink.match(/pain-management\/([^/]+)$/);
  return match?.[1] || null;
}

/**
 * Update a clinic with full CSV data
 */
async function updateClinicFromCSV(
  clinicId: string,
  csvRow: RawClinicCSVRow
): Promise<boolean> {
  try {
    // Parse coordinates
    const mapLatitude = parseFloat(csvRow["Map Latitude"] || "0");
    const mapLongitude = parseFloat(csvRow["Map Longitude"] || "0");

    // Skip if CSV has no valid coordinates either
    if (isNaN(mapLatitude) || mapLatitude === 0) {
      console.log(`  ⚠️ CSV row has no valid coordinates, skipping`);
      return false;
    }

    await db
      .update(clinics)
      .set({
        // Location
        city: csvRow.City || undefined,
        state: csvRow.State || undefined,
        stateAbbreviation: csvRow["State Abbreviation"] || undefined,
        postalCode: csvRow["Postal Code"] || undefined,
        streetAddress: csvRow["Street Address"] || undefined,
        mapLatitude,
        mapLongitude,
        detailedAddress: csvRow["Detailed Address"] || undefined,

        // Images
        imageFeatured:
          getFirstImageUrl(csvRow["Image Featured"]) ||
          getFirstImageUrl(csvRow["Feat Image"]) ||
          undefined,
        clinicImageUrls:
          parseImageUrls(csvRow["Clinic Image URLS"]) || undefined,
        clinicImageMedia:
          parseImageUrls(csvRow["Clinic Image Media"]) || undefined,
        imageUrl: getFirstImageUrl(csvRow["Image URL"]) || undefined,

        // Reviews
        reviewCount: parseInt(csvRow.Reviews || "0") || 0,
        rating: parseFloat(csvRow.Rating || "0") || null,
        reviewsPerScore: parseReviewsPerScore(csvRow),
        featuredReviews: parseFeaturedReviews(
          csvRow["Featured Reviews_username"] ||
            csvRow["Featured Reviews_Google review user profile username"],
          csvRow["Featured Reviews_profile_url"] ||
            csvRow["Featured Reviews_Google review user profile URL"],
          csvRow["Featured Reviews_review"] ||
            csvRow["Featured Reviews_Google Review"],
          csvRow["Featured Reviews_date_review_left"] ||
            csvRow["Featured Reviews_Google review publish date"],
          csvRow["Featured Reviews_rating"] ||
            csvRow["Featured Reviews_Google review star rating"]
        ),
        reviewKeywords: parseReviewKeywords(
          csvRow["Review Keywords_keyword"] || csvRow["Review Keywords_Keyword"],
          csvRow["Review Keywords_keyword_count"] ||
            csvRow["Review Keywords_Count"]
        ),

        // Hours
        clinicHours: parseClinicHours(
          csvRow["Clinic Hours_day"] || csvRow["Clinic Hours_Days"],
          csvRow["Clinic Hours_hours"] || csvRow["Clinic Hours_Hours"]
        ),
        closedOn: csvRow["Closed On"] || undefined,
        popularTimes: parsePopularTimes(
          csvRow["Popular times_hour_of_day"] || csvRow["Popular times_Hours"],
          csvRow["Popular times_average_popularity"] ||
            csvRow["Popular times_Popularity"]
        ),

        // Features
        amenities: parseAmenities(csvRow.Amenities),
        checkboxFeatures: parseCheckboxFeatures(csvRow["Checkbox Features"]),
        questions: parseQuestions(csvRow.Question, csvRow.Answer),

        // Contact
        phone: csvRow.Phone || undefined,
        website: csvRow.Website || undefined,

        // Content
        content: csvRow.Content || undefined,
        newPostContent: csvRow["New Post Content"] || undefined,

        // Other metadata (skip placeId to avoid unique constraint violations)
        wpId: parseInt(csvRow.ID || "0") || undefined,
        googleListingLink: csvRow["Google Listing Link"] || undefined,
        qrCode: csvRow["QR Code"] || undefined,

        // Social Media
        facebook: csvRow.facebook || csvRow.Facebook || undefined,
        instagram: csvRow.instagram || csvRow.Instagram || undefined,
        twitter: csvRow.twitter || csvRow.Twitter || undefined,
        youtube: csvRow.youtube || csvRow.YouTube || undefined,
        linkedin: csvRow.linkedin || csvRow.LinkedIn || undefined,
        tiktok: csvRow.tiktok || csvRow.TikTok || undefined,
        pinterest: csvRow.pinterest || csvRow.Pinterest || undefined,
      })
      .where(eq(clinics.id, clinicId));

    return true;
  } catch (error) {
    console.error(`  ❌ Error updating clinic ${clinicId}:`, error);
    return false;
  }
}

async function main() {
  console.log("===========================================");
  console.log("  Re-Import Clinics from CSV Data");
  console.log("===========================================\n");

  // Step 1: Load all CSV data
  console.log("Step 1: Loading CSV data...\n");
  const csvData = await loadAllCSVData();
  console.log("");

  // Step 2: Get minimal clinics from database
  console.log("Step 2: Finding minimal-data clinics in database...\n");
  const minimalClinics = await getMinimalClinics();
  console.log(`Found ${minimalClinics.length} clinics with mapLatitude = 0\n`);

  // Step 3: Match and update
  console.log("Step 3: Matching and updating clinics...\n");

  let matched = 0;
  let updated = 0;
  let notFound = 0;
  let failed = 0;

  for (const clinic of minimalClinics) {
    const slug = extractDbSlug(clinic.permalink);

    if (!slug) {
      console.log(`  ⚠️ Could not extract slug from: ${clinic.permalink}`);
      notFound++;
      continue;
    }

    const csvRow = csvData.get(slug);

    if (!csvRow) {
      console.log(`  ⚠️ No CSV match for slug: ${slug}`);
      notFound++;
      continue;
    }

    matched++;
    console.log(`  📝 Updating: ${slug}`);

    const success = await updateClinicFromCSV(clinic.id, csvRow);
    if (success) {
      updated++;
    } else {
      failed++;
    }
  }

  // Summary
  console.log("\n===========================================");
  console.log("  Summary");
  console.log("===========================================");
  console.log(`Total minimal clinics found:  ${minimalClinics.length}`);
  console.log(`Matched to CSV:               ${matched}`);
  console.log(`Successfully updated:         ${updated}`);
  console.log(`Not found in CSV:             ${notFound}`);
  console.log(`Failed to update:             ${failed}`);
  console.log("===========================================\n");

  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
