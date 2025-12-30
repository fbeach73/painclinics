/**
 * Test import script for scraper CSV format
 * Run: POSTGRES_URL="..." pnpm tsx src/scripts/test-scraper-import.ts
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";
import {
  type RawClinicCSVRow,
  transformClinicRow,
  transformClinicRows,
} from "@/lib/clinic-transformer";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";

const CSV_PATH = path.join(process.cwd(), "public/updatedcClinics.csv");

async function main() {
  console.log("===========================================");
  console.log("  Test Scraper CSV Import");
  console.log("===========================================\n");

  // Read and parse CSV
  console.log(`Reading CSV from: ${CSV_PATH}\n`);
  const content = fs.readFileSync(CSV_PATH, "utf-8");

  const rows: RawClinicCSVRow[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true,
  });

  console.log(`Parsed ${rows.length} rows from CSV\n`);

  // Test single row transformation
  console.log("--- Testing Single Row Transformation ---\n");
  const firstRow = rows[0];
  if (firstRow) {
    console.log("First row columns:", Object.keys(firstRow).join(", "));
    console.log("\nKey values from first row:");
    console.log(`  name: ${firstRow.name}`);
    console.log(`  place_id: ${firstRow.place_id}`);
    console.log(`  main_category: ${firstRow.main_category}`);
    console.log(`  address: ${firstRow.address}`);
    console.log(`  workday_timing: ${firstRow.workday_timing}`);
    console.log(`  closed_on: ${firstRow.closed_on}`);
    console.log(`  review_keywords: ${firstRow.review_keywords}`);
    console.log(`  featured_image: ${firstRow.featured_image}`);

    const transformed = transformClinicRow(firstRow);
    if (transformed) {
      console.log("\n--- Transformed Result ---\n");
      console.log(`  title: ${transformed.title}`);
      console.log(`  placeId: ${transformed.placeId}`);
      console.log(`  clinicType: ${transformed.clinicType}`);
      console.log(`  streetAddress: ${transformed.streetAddress}`);
      console.log(`  city: ${transformed.city}`);
      console.log(`  state: ${transformed.state}`);
      console.log(`  stateAbbreviation: ${transformed.stateAbbreviation}`);
      console.log(`  postalCode: ${transformed.postalCode}`);
      console.log(`  permalink: ${transformed.permalink}`);
      console.log(`  imageFeatured: ${transformed.imageFeatured}`);
      console.log(`  clinicHours: ${JSON.stringify(transformed.clinicHours, null, 2)}`);
      console.log(`  reviewKeywords: ${JSON.stringify(transformed.reviewKeywords, null, 2)}`);
    } else {
      console.log("\n  ERROR: Transform returned null");
    }
  }

  // Transform all rows
  console.log("\n--- Transforming All Rows ---\n");
  const { clinics: transformed, skipped } = transformClinicRows(rows);
  console.log(`Successfully transformed: ${transformed.length}`);
  console.log(`Skipped (missing data): ${skipped.length}`);

  if (transformed.length === 0) {
    console.log("\nNo clinics to import. Check transformation logic.");
    process.exit(1);
  }

  // Import first 3 clinics as a test
  console.log("\n--- Importing First 3 Clinics to Database ---\n");
  const testClinics = transformed.slice(0, 3);
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const clinic of testClinics) {
    try {
      // Check if exists by place_id
      const existing = clinic.placeId
        ? await db.query.clinics.findFirst({
            where: eq(clinics.placeId, clinic.placeId),
          })
        : null;

      if (existing) {
        // Update existing
        await db
          .update(clinics)
          .set({
            ...clinic,
            updatedAt: new Date(),
          })
          .where(eq(clinics.id, existing.id));
        console.log(`  Updated: ${clinic.title}`);
        updated++;
      } else {
        // Insert new
        await db.insert(clinics).values(clinic);
        console.log(`  Inserted: ${clinic.title}`);
        inserted++;
      }
    } catch (err) {
      console.error(`  ERROR importing "${clinic.title}":`, err);
      errors++;
    }
  }

  console.log(`\nImport complete: ${inserted} inserted, ${updated} updated, ${errors} errors`);

  // Verify the first clinic in database
  console.log("\n--- Verifying First Clinic in Database ---\n");
  const firstClinic = testClinics[0];
  if (firstClinic?.placeId) {
    const dbRecord = await db.query.clinics.findFirst({
      where: eq(clinics.placeId, firstClinic.placeId),
    });

    if (dbRecord) {
      console.log(`Database record for "${dbRecord.title}":`);
      console.log(`  clinic_type: ${dbRecord.clinicType}`);
      console.log(`  street_address: ${dbRecord.streetAddress}`);
      console.log(`  city: ${dbRecord.city}`);
      console.log(`  state: ${dbRecord.state}`);
      console.log(`  postal_code: ${dbRecord.postalCode}`);
      console.log(`  image_featured: ${dbRecord.imageFeatured}`);
      console.log(`  clinic_hours: ${JSON.stringify(dbRecord.clinicHours, null, 2)}`);
      console.log(`  review_keywords: ${JSON.stringify(dbRecord.reviewKeywords, null, 2)}`);
    } else {
      console.log("  Could not find record in database");
    }
  }

  console.log("\n===========================================");
  console.log("  Test Complete");
  console.log("===========================================\n");

  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
