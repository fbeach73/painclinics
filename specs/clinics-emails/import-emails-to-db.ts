/**
 * Import scraped emails and social media into the clinics database
 *
 * Usage:
 *   POSTGRES_URL="your-connection-string" pnpm tsx specs/clinics-emails/import-emails-to-db.ts
 *
 * Options:
 *   --dry-run    Preview changes without updating database
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, isNotNull, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  doublePrecision,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// Define minimal clinics schema for this script
const clinics = pgTable(
  "clinics",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    website: text("website"),
    emails: text("emails").array(),
    facebook: text("facebook"),
    instagram: text("instagram"),
    twitter: text("twitter"),
    youtube: text("youtube"),
    linkedin: text("linkedin"),
  }
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CSV_PATH = path.join(__dirname, "scraped-emails-results.csv");
const DRY_RUN = process.argv.includes("--dry-run");

interface ScrapedData {
  domain: string;
  emails: string; // JSON array string
  facebook: string;
  twitter: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  error: string;
}

interface ClinicUpdate {
  clinicId: string;
  clinicName: string;
  domain: string;
  emails: string[];
  primaryEmail: string | null;
  facebook: string | null;
  twitter: string | null;
  instagram: string | null;
  youtube: string | null;
  linkedin: string | null;
}

/**
 * Extract domain from a URL
 */
function extractDomain(url: string): string | null {
  if (!url) return null;
  try {
    // Add protocol if missing
    let fullUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      fullUrl = "https://" + url;
    }
    const parsed = new URL(fullUrl);
    // Remove www. prefix
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Parse emails from JSON array string
 */
function parseEmails(emailsJson: string): string[] {
  if (!emailsJson || emailsJson === "[]") return [];
  try {
    const parsed = JSON.parse(emailsJson);
    if (Array.isArray(parsed)) {
      return parsed.filter((e) => typeof e === "string" && e.includes("@"));
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Score an email address (higher = better for clinic contact)
 */
function scoreEmail(email: string): number {
  const lower = email.toLowerCase();
  let score = 0;

  // Prefer clinic-specific emails
  if (lower.startsWith("info@")) score += 100;
  if (lower.startsWith("contact@")) score += 90;
  if (lower.startsWith("appointments@")) score += 85;
  if (lower.startsWith("office@")) score += 80;
  if (lower.startsWith("reception@")) score += 75;
  if (lower.startsWith("admin@")) score += 70;
  if (lower.startsWith("hello@")) score += 65;
  if (lower.startsWith("support@")) score += 60;
  if (lower.startsWith("inbox@")) score += 55;
  if (lower.startsWith("team@")) score += 50;

  // Penalize generic/unwanted emails
  if (lower.includes("example.com")) score -= 1000;
  if (lower.includes("@gmail.com") && !lower.includes("clinic")) score -= 20;
  if (lower.includes("@hotmail.com")) score -= 30;
  if (lower.includes("@yahoo.com")) score -= 30;
  if (lower.includes("noreply")) score -= 100;
  if (lower.includes("donotreply")) score -= 100;
  if (lower.includes("@cms.hhs")) score -= 100;
  if (lower.includes("marketing@")) score -= 10;
  if (lower.includes("billing@")) score -= 5;
  if (lower.includes("medtronic.com")) score -= 100; // Generic medical vendor

  // Penalize long lists of random emails
  if (lower.length > 50) score -= 20;

  return score;
}

/**
 * Pick the best email from a list
 */
function pickBestEmail(emails: string[]): string | null {
  if (!emails.length) return null;

  // Filter out obvious junk
  const filtered = emails.filter((e) => {
    const lower = e.toLowerCase();
    return (
      !lower.includes("example.com") &&
      !lower.includes("noreply") &&
      !lower.includes("donotreply") &&
      !lower.includes("@cms.hhs") &&
      scoreEmail(e) > -100
    );
  });

  if (!filtered.length) return null;

  // Sort by score and return best
  filtered.sort((a, b) => scoreEmail(b) - scoreEmail(a));
  return filtered[0];
}

/**
 * Clean social media URL (ensure it's a valid URL)
 */
function cleanSocialUrl(url: string): string | null {
  if (!url || url.trim() === "") return null;
  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("www.")
  ) {
    return trimmed;
  }
  return null;
}

async function main() {
  console.log("=".repeat(60));
  console.log("Email & Social Media Import Script");
  console.log("=".repeat(60));
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE UPDATE"}`);
  console.log(`CSV: ${CSV_PATH}`);
  console.log("");

  // Connect to database
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL environment variable required");
  }
  const sql_conn = postgres(process.env.POSTGRES_URL);
  const db = drizzle(sql_conn);

  // Load CSV data
  console.log("Loading CSV data...");
  const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
  const records: ScrapedData[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });
  console.log(`  Loaded ${records.length} scraped domains`);

  // Build domain lookup map
  const domainMap = new Map<string, ScrapedData>();
  for (const record of records) {
    if (record.domain) {
      domainMap.set(record.domain.toLowerCase(), record);
    }
  }
  console.log(`  Built lookup map with ${domainMap.size} domains`);

  // Fetch all clinics with websites
  console.log("\nFetching clinics from database...");
  const allClinics = await db
    .select({
      id: clinics.id,
      title: clinics.title,
      website: clinics.website,
      emails: clinics.emails,
      facebook: clinics.facebook,
      instagram: clinics.instagram,
      twitter: clinics.twitter,
      youtube: clinics.youtube,
      linkedin: clinics.linkedin,
    })
    .from(clinics)
    .where(isNotNull(clinics.website));

  console.log(`  Found ${allClinics.length} clinics with websites`);

  // Match clinics to scraped data
  console.log("\nMatching clinics to scraped data...");
  const updates: ClinicUpdate[] = [];
  let matchCount = 0;
  let noMatchCount = 0;
  let alreadyHasEmailCount = 0;

  for (const clinic of allClinics) {
    const domain = extractDomain(clinic.website!);
    if (!domain) continue;

    const scraped = domainMap.get(domain);
    if (!scraped) {
      noMatchCount++;
      continue;
    }

    matchCount++;

    // Parse emails from scraped data
    const scrapedEmails = parseEmails(scraped.emails);
    const bestEmail = pickBestEmail(scrapedEmails);

    // Check if clinic already has email
    if (clinic.emails && clinic.emails.length > 0) {
      alreadyHasEmailCount++;
    }

    // Prepare update
    const update: ClinicUpdate = {
      clinicId: clinic.id,
      clinicName: clinic.title,
      domain,
      emails: scrapedEmails,
      primaryEmail: bestEmail,
      facebook: cleanSocialUrl(scraped.facebook),
      twitter: cleanSocialUrl(scraped.twitter),
      instagram: cleanSocialUrl(scraped.instagram),
      youtube: cleanSocialUrl(scraped.youtube),
      linkedin: cleanSocialUrl(scraped.linkedin),
    };

    // Only add if there's something to update
    if (
      bestEmail ||
      update.facebook ||
      update.instagram ||
      update.twitter ||
      update.youtube ||
      update.linkedin
    ) {
      updates.push(update);
    }
  }

  console.log(`  Matched: ${matchCount} clinics`);
  console.log(`  No match: ${noMatchCount} clinics`);
  console.log(`  Already have email: ${alreadyHasEmailCount} clinics`);
  console.log(`  Updates to apply: ${updates.length}`);

  // Statistics
  const stats = {
    withEmail: updates.filter((u) => u.primaryEmail).length,
    withFacebook: updates.filter((u) => u.facebook).length,
    withInstagram: updates.filter((u) => u.instagram).length,
    withTwitter: updates.filter((u) => u.twitter).length,
    withYoutube: updates.filter((u) => u.youtube).length,
    withLinkedin: updates.filter((u) => u.linkedin).length,
  };

  console.log("\nUpdate Statistics:");
  console.log(`  With email: ${stats.withEmail}`);
  console.log(`  With Facebook: ${stats.withFacebook}`);
  console.log(`  With Instagram: ${stats.withInstagram}`);
  console.log(`  With Twitter: ${stats.withTwitter}`);
  console.log(`  With YouTube: ${stats.withYoutube}`);
  console.log(`  With LinkedIn: ${stats.withLinkedin}`);

  // Sample output
  console.log("\nSample Updates (first 10):");
  for (const update of updates.slice(0, 10)) {
    console.log(`  ${update.clinicName.slice(0, 40).padEnd(40)} | ${update.primaryEmail || "(no email)"}`);
    if (update.facebook) console.log(`    FB: ${update.facebook.slice(0, 50)}`);
    if (update.instagram)
      console.log(`    IG: ${update.instagram.slice(0, 50)}`);
  }

  if (DRY_RUN) {
    console.log("\n[DRY RUN] No database changes made.");
    console.log("Run without --dry-run to apply updates.");
    return;
  }

  // Apply updates
  console.log("\nApplying updates to database...");
  let successCount = 0;
  let errorCount = 0;

  for (const update of updates) {
    try {
      const updateData: {
        emails?: string[];
        facebook?: string;
        instagram?: string;
        twitter?: string;
        youtube?: string;
        linkedin?: string;
      } = {};

      // Store up to 3 valid emails (sorted by score, best first)
      // Prefer emails that match the clinic's domain
      const existingClinic = allClinics.find((c) => c.id === update.clinicId);
      if (update.emails.length > 0) {
        // Filter out junk emails
        let validEmails = update.emails.filter((e) => scoreEmail(e) > -100);

        // Prefer emails matching the clinic's domain
        const domainEmails = validEmails.filter((e) => {
          const emailDomain = e.split("@")[1]?.toLowerCase();
          return emailDomain && update.domain.toLowerCase().includes(emailDomain.replace("www.", ""));
        });

        // If we have domain-matching emails, prioritize them
        if (domainEmails.length > 0) {
          validEmails = [
            ...domainEmails,
            ...validEmails.filter((e) => !domainEmails.includes(e)),
          ];
        }

        // Sort by score and cap at 3
        validEmails = validEmails
          .sort((a, b) => scoreEmail(b) - scoreEmail(a))
          .slice(0, 3);

        if (validEmails.length > 0) {
          updateData.emails = validEmails;
        }
      }

      // Update social media if we have it and clinic doesn't
      if (update.facebook && !existingClinic?.facebook) {
        updateData.facebook = update.facebook;
      }
      if (update.instagram && !existingClinic?.instagram) {
        updateData.instagram = update.instagram;
      }
      if (update.twitter && !existingClinic?.twitter) {
        updateData.twitter = update.twitter;
      }
      if (update.youtube && !existingClinic?.youtube) {
        updateData.youtube = update.youtube;
      }
      if (update.linkedin && !existingClinic?.linkedin) {
        updateData.linkedin = update.linkedin;
      }

      // Skip if nothing to update
      if (Object.keys(updateData).length === 0) {
        continue;
      }

      await db
        .update(clinics)
        .set(updateData)
        .where(eq(clinics.id, update.clinicId));

      successCount++;
      if (successCount % 100 === 0) {
        console.log(`  Progress: ${successCount}/${updates.length}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`  Error updating ${update.clinicName}:`, error);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Import Complete!");
  console.log("=".repeat(60));
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
}

main().catch(console.error);
