/**
 * Migration script: Download images from Cloudways and upload to Vercel Blob
 *
 * This script:
 * 1. Finds all clinic image URLs pointing to WordPress uploads
 * 2. Downloads them from the Cloudways server
 * 3. Uploads them to Vercel Blob
 * 4. Updates the database with the new Blob URLs
 *
 * Run with: pnpm tsx src/scripts/migrate-images-to-blob.ts
 *
 * Options:
 *   --dry-run    Show what would be migrated without making changes
 *   --verbose    Show detailed output for each image
 *   --limit=N    Process only N clinics (for testing)
 */

import { config } from "dotenv";
import { put } from "@vercel/blob";
import postgres from "postgres";

// Load environment variables from .env.local file
config({ path: ".env.local" });

// Configuration
const CLOUDWAYS_BASE = "https://wordpress-1356334-4988742.cloudwaysapps.com";
const OLD_DOMAIN = "painclinics.com";

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const VERBOSE = args.includes("--verbose");
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1] ?? "0", 10) : Infinity;

// Stats tracking
const stats = {
  clinicsProcessed: 0,
  imagesDownloaded: 0,
  imagesUploaded: 0,
  imagesFailed: 0,
  urlsUpdated: 0,
  errors: [] as string[],
};

// Cache to avoid re-uploading the same image
const urlCache = new Map<string, string>();

/**
 * Convert a painclinics.com URL to the Cloudways URL
 */
function toCloudwaysUrl(url: string): string {
  return url.replace(`https://${OLD_DOMAIN}`, CLOUDWAYS_BASE)
            .replace(`http://${OLD_DOMAIN}`, CLOUDWAYS_BASE);
}

/**
 * Extract filename from URL
 */
function getFilenameFromUrl(url: string): string {
  const urlPath = new URL(url).pathname;
  const filename = urlPath.split("/").pop() || "image.jpg";
  return filename;
}

/**
 * Get the first URL from a pipe or comma-separated string
 */
function getFirstUrl(url: string): string {
  return url.split(/[|,]/)[0]?.trim() || url;
}

/**
 * Download an image and upload to Vercel Blob
 */
async function migrateImage(originalUrl: string): Promise<string | null> {
  // Clean the URL (get first if pipe-separated)
  const cleanUrl = getFirstUrl(originalUrl);

  // Check cache first
  if (urlCache.has(cleanUrl)) {
    return urlCache.get(cleanUrl) || null;
  }

  // Skip if not a WordPress upload URL
  if (!cleanUrl.includes("/wp-content/uploads/")) {
    return cleanUrl; // Return as-is if not a WP URL
  }

  // Convert to Cloudways URL
  const cloudwaysUrl = toCloudwaysUrl(cleanUrl);
  const filename = getFilenameFromUrl(cleanUrl);

  if (VERBOSE) {
    console.log(`    Downloading: ${cloudwaysUrl}`);
  }

  try {
    // Download the image
    const response = await fetch(cloudwaysUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    stats.imagesDownloaded++;

    if (DRY_RUN) {
      // In dry run, just return a placeholder
      const placeholderUrl = `[BLOB]/clinic-images/${filename}`;
      urlCache.set(cleanUrl, placeholderUrl);
      return placeholderUrl;
    }

    // Upload to Vercel Blob
    const blob = await put(`clinic-images/${filename}`, buffer, {
      access: "public",
    });

    stats.imagesUploaded++;
    urlCache.set(cleanUrl, blob.url);

    if (VERBOSE) {
      console.log(`    Uploaded: ${blob.url}`);
    }

    return blob.url;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    stats.imagesFailed++;
    stats.errors.push(`${cloudwaysUrl}: ${errorMsg}`);

    if (VERBOSE) {
      console.log(`    FAILED: ${errorMsg}`);
    }

    return null;
  }
}

/**
 * Migrate an array of image URLs
 */
async function migrateImageArray(urls: string[] | null): Promise<string[] | null> {
  if (!urls || urls.length === 0) return null;

  const migratedUrls: string[] = [];

  for (const url of urls) {
    // Handle pipe-separated URLs within array elements
    const individualUrls = url.split(/[|,]/).map(u => u.trim()).filter(Boolean);

    for (const individualUrl of individualUrls) {
      const newUrl = await migrateImage(individualUrl);
      if (newUrl) {
        migratedUrls.push(newUrl);
      }
    }
  }

  return migratedUrls.length > 0 ? migratedUrls : null;
}

async function migrate() {
  console.log("=".repeat(60));
  console.log("Migrate Clinic Images to Vercel Blob");
  console.log("=".repeat(60));

  if (DRY_RUN) {
    console.log("\n*** DRY RUN MODE - No changes will be made ***\n");
  }

  if (LIMIT !== Infinity) {
    console.log(`*** LIMITED RUN - Processing only ${LIMIT} clinics ***\n`);
  }

  // Check environment variables
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error("ERROR: POSTGRES_URL environment variable is not set");
    process.exit(1);
  }

  if (!DRY_RUN && !process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("ERROR: BLOB_READ_WRITE_TOKEN environment variable is not set");
    console.error("This is required to upload images to Vercel Blob.");
    process.exit(1);
  }

  const sql = postgres(connectionString);

  try {
    // Find all clinics with WordPress image URLs
    console.log("\nSearching for clinics with WordPress image URLs...");

    const clinics = await sql`
      SELECT id, title, image_url, image_featured, feat_image, clinic_image_urls
      FROM clinics
      WHERE
        image_url LIKE '%/wp-content/uploads/%'
        OR image_featured LIKE '%/wp-content/uploads/%'
        OR feat_image LIKE '%/wp-content/uploads/%'
        OR EXISTS (
          SELECT 1 FROM unnest(clinic_image_urls) AS url
          WHERE url LIKE '%/wp-content/uploads/%'
        )
      ORDER BY id
      ${LIMIT !== Infinity ? sql`LIMIT ${LIMIT}` : sql``}
    `;

    console.log(`Found ${clinics.length} clinics with WordPress image URLs\n`);

    for (const clinic of clinics) {
      stats.clinicsProcessed++;

      if (VERBOSE) {
        console.log(`\n[${stats.clinicsProcessed}/${clinics.length}] ${clinic.title}`);
      } else if (stats.clinicsProcessed % 100 === 0) {
        console.log(`Processed ${stats.clinicsProcessed}/${clinics.length} clinics...`);
      }

      const updates: {
        image_url?: string | null;
        image_featured?: string | null;
        feat_image?: string | null;
        clinic_image_urls?: string[] | null;
      } = {};

      // Migrate image_url
      if (clinic.image_url && clinic.image_url.includes("/wp-content/uploads/")) {
        const newUrl = await migrateImage(clinic.image_url);
        if (newUrl) {
          updates.image_url = newUrl;
          stats.urlsUpdated++;
        }
      }

      // Migrate image_featured
      if (clinic.image_featured && clinic.image_featured.includes("/wp-content/uploads/")) {
        const newUrl = await migrateImage(clinic.image_featured);
        if (newUrl) {
          updates.image_featured = newUrl;
          stats.urlsUpdated++;
        }
      }

      // Migrate feat_image
      if (clinic.feat_image && clinic.feat_image.includes("/wp-content/uploads/")) {
        const newUrl = await migrateImage(clinic.feat_image);
        if (newUrl) {
          updates.feat_image = newUrl;
          stats.urlsUpdated++;
        }
      }

      // Migrate clinic_image_urls array
      if (clinic.clinic_image_urls && Array.isArray(clinic.clinic_image_urls)) {
        const hasWpUrls = clinic.clinic_image_urls.some((url: string) =>
          url.includes("/wp-content/uploads/")
        );
        if (hasWpUrls) {
          const newUrls = await migrateImageArray(clinic.clinic_image_urls);
          if (newUrls) {
            updates.clinic_image_urls = newUrls;
            stats.urlsUpdated++;
          }
        }
      }

      // Update database if we have changes
      if (Object.keys(updates).length > 0 && !DRY_RUN) {
        try {
          await sql`
            UPDATE clinics SET
              image_url = ${updates.image_url !== undefined ? updates.image_url : sql`image_url`},
              image_featured = ${updates.image_featured !== undefined ? updates.image_featured : sql`image_featured`},
              feat_image = ${updates.feat_image !== undefined ? updates.feat_image : sql`feat_image`},
              clinic_image_urls = ${updates.clinic_image_urls !== undefined ? updates.clinic_image_urls : sql`clinic_image_urls`},
              updated_at = NOW()
            WHERE id = ${clinic.id}
          `;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          stats.errors.push(`DB update for ${clinic.title}: ${errorMsg}`);
        }
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("MIGRATION COMPLETE");
    console.log("=".repeat(60));

    console.log(`\nClinics processed: ${stats.clinicsProcessed}`);
    console.log(`Images downloaded: ${stats.imagesDownloaded}`);
    console.log(`Images uploaded: ${stats.imagesUploaded}`);
    console.log(`Images failed: ${stats.imagesFailed}`);
    console.log(`Database URLs updated: ${stats.urlsUpdated}`);
    console.log(`Unique images cached: ${urlCache.size}`);

    if (stats.errors.length > 0) {
      console.log(`\nErrors (${stats.errors.length}):`);
      // Show first 20 errors
      stats.errors.slice(0, 20).forEach((err) => {
        console.log(`  - ${err}`);
      });
      if (stats.errors.length > 20) {
        console.log(`  ... and ${stats.errors.length - 20} more`);
      }
    }

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
