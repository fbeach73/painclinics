/**
 * Migration script: Fix pipe-separated image URLs in the database
 *
 * This script finds and fixes image_url, image_featured, feat_image, and
 * clinic_image_urls fields that contain pipe-separated URLs instead of
 * properly parsed single URLs or arrays.
 *
 * Run with: pnpm tsx src/scripts/fix-image-urls.ts
 *
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --verbose    Show detailed output for each clinic
 */

import { config } from "dotenv";
import postgres from "postgres";

// Load environment variables from .env.local file (Next.js convention)
config({ path: ".env.local" });

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const VERBOSE = args.includes("--verbose");

/**
 * Get the first URL from a pipe or comma-separated string
 */
function getFirstImageUrl(url: string | null): string | null {
  if (!url) return null;
  const urls = url.split(/[|,]/).map((u) => u.trim()).filter(Boolean);
  return urls.length > 0 ? (urls[0] ?? null) : null;
}

/**
 * Parse pipe or comma-separated image URLs into proper array
 */
function parseImageUrls(urls: string[] | null): string[] | null {
  if (!urls || urls.length === 0) return null;

  // If any URL contains a pipe, split it
  const result: string[] = [];
  for (const url of urls) {
    if (url.includes("|") || url.includes(",")) {
      const split = url.split(/[|,]/).map((u) => u.trim()).filter(Boolean);
      result.push(...split);
    } else {
      result.push(url);
    }
  }

  return result.length > 0 ? result : null;
}

async function migrate() {
  console.log("=".repeat(60));
  console.log("Fix Pipe-Separated Image URLs Migration");
  console.log("=".repeat(60));

  if (DRY_RUN) {
    console.log("\n*** DRY RUN MODE - No changes will be made ***\n");
  }

  // Connect to database
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error("ERROR: POSTGRES_URL environment variable is not set");
    process.exit(1);
  }

  const sql = postgres(connectionString);

  const stats = {
    total: 0,
    imageUrlFixed: 0,
    imageFeaturedFixed: 0,
    featImageFixed: 0,
    clinicImageUrlsFixed: 0,
    errors: 0,
  };

  try {
    // Find all clinics with pipe characters in their image fields
    console.log("\nSearching for clinics with broken image URLs...");

    const brokenClinics = await sql`
      SELECT id, title, image_url, image_featured, feat_image, clinic_image_urls
      FROM clinics
      WHERE
        image_url LIKE '%|%'
        OR image_featured LIKE '%|%'
        OR feat_image LIKE '%|%'
        OR EXISTS (
          SELECT 1 FROM unnest(clinic_image_urls) AS url WHERE url LIKE '%|%'
        )
    `;

    console.log(`Found ${brokenClinics.length} clinics with broken image URLs\n`);
    stats.total = brokenClinics.length;

    for (const clinic of brokenClinics) {
      const updates: {
        image_url?: string | null;
        image_featured?: string | null;
        feat_image?: string | null;
        clinic_image_urls?: string[] | null;
      } = {};

      // Fix image_url
      if (clinic.image_url && clinic.image_url.includes("|")) {
        const fixed = getFirstImageUrl(clinic.image_url);
        updates.image_url = fixed;
        stats.imageUrlFixed++;
        if (VERBOSE) {
          console.log(`  [${clinic.title}] image_url: "${clinic.image_url}" -> "${fixed}"`);
        }
      }

      // Fix image_featured
      if (clinic.image_featured && clinic.image_featured.includes("|")) {
        const fixed = getFirstImageUrl(clinic.image_featured);
        updates.image_featured = fixed;
        stats.imageFeaturedFixed++;
        if (VERBOSE) {
          console.log(`  [${clinic.title}] image_featured: "${clinic.image_featured}" -> "${fixed}"`);
        }
      }

      // Fix feat_image
      if (clinic.feat_image && clinic.feat_image.includes("|")) {
        const fixed = getFirstImageUrl(clinic.feat_image);
        updates.feat_image = fixed;
        stats.featImageFixed++;
        if (VERBOSE) {
          console.log(`  [${clinic.title}] feat_image: "${clinic.feat_image}" -> "${fixed}"`);
        }
      }

      // Fix clinic_image_urls array
      if (clinic.clinic_image_urls && Array.isArray(clinic.clinic_image_urls)) {
        const hasBroken = clinic.clinic_image_urls.some((url: string) => url.includes("|"));
        if (hasBroken) {
          const fixed = parseImageUrls(clinic.clinic_image_urls);
          updates.clinic_image_urls = fixed;
          stats.clinicImageUrlsFixed++;
          if (VERBOSE) {
            console.log(`  [${clinic.title}] clinic_image_urls: ${clinic.clinic_image_urls.length} -> ${fixed?.length || 0} items`);
          }
        }
      }

      if (Object.keys(updates).length === 0) {
        continue;
      }

      if (!DRY_RUN) {
        try {
          await sql`
            UPDATE clinics SET
              image_url = COALESCE(${updates.image_url !== undefined ? updates.image_url : sql`image_url`}),
              image_featured = COALESCE(${updates.image_featured !== undefined ? updates.image_featured : sql`image_featured`}),
              feat_image = COALESCE(${updates.feat_image !== undefined ? updates.feat_image : sql`feat_image`}),
              clinic_image_urls = ${updates.clinic_image_urls !== undefined ? updates.clinic_image_urls : sql`clinic_image_urls`},
              updated_at = NOW()
            WHERE id = ${clinic.id}
          `;
        } catch (error) {
          stats.errors++;
          console.error(`  Error updating ${clinic.title}:`, error);
        }
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("MIGRATION COMPLETE");
    console.log("=".repeat(60));

    console.log(`\nTotal clinics with broken URLs: ${stats.total}`);
    console.log(`image_url fixed: ${stats.imageUrlFixed}`);
    console.log(`image_featured fixed: ${stats.imageFeaturedFixed}`);
    console.log(`feat_image fixed: ${stats.featImageFixed}`);
    console.log(`clinic_image_urls fixed: ${stats.clinicImageUrlsFixed}`);
    console.log(`Errors: ${stats.errors}`);

    console.log("\n" + "=".repeat(60));
    if (DRY_RUN) {
      console.log("Dry run complete - no changes were made");
      console.log("Run without --dry-run to apply changes");
    } else {
      console.log("Migration complete!");
    }
    console.log("=".repeat(60));

  } finally {
    await sql.end();
  }
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
