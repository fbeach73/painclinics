/**
 * One-time migration script to populate normalizedAmenities from existing amenities column.
 * Run with: pnpm tsx src/scripts/normalize-amenities.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { eq, isNotNull, sql } from "drizzle-orm";
import postgres from "postgres";
import { clinics } from "../lib/schema";
import { normalizeAmenities } from "../lib/directory/amenity-map";
import "dotenv/config";

async function main() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_URL environment variable is required");
  }

  console.log("Connecting to database...");
  const client = postgres(connectionString);
  const db = drizzle(client);

  // Fetch all clinics with amenities
  const clinicsWithAmenities = await db
    .select({
      id: clinics.id,
      title: clinics.title,
      amenities: clinics.amenities,
    })
    .from(clinics)
    .where(isNotNull(clinics.amenities));

  console.log(`\nFound ${clinicsWithAmenities.length} clinics with amenities.\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  let emptyCount = 0;

  for (const clinic of clinicsWithAmenities) {
    if (!clinic.amenities || clinic.amenities.length === 0) {
      skippedCount++;
      continue;
    }

    const normalized = normalizeAmenities(clinic.amenities);

    if (normalized.length === 0) {
      emptyCount++;
      continue;
    }

    await db
      .update(clinics)
      .set({ normalizedAmenities: normalized })
      .where(eq(clinics.id, clinic.id));

    console.log(`  + ${clinic.title}: ${normalized.join(", ")}`);
    updatedCount++;
  }

  // Also create the GIN index via raw SQL (Drizzle doesn't support GIN indexes declaratively)
  console.log("\nCreating GIN index on normalized_amenities...");
  try {
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS clinics_normalized_amenities_gin_idx
      ON clinics USING GIN (normalized_amenities)
    `);
    console.log("  + GIN index created.");
  } catch (error) {
    console.log("  - GIN index may already exist:", error);
  }

  console.log("\n========================================");
  console.log("Normalization Results:");
  console.log(`  Updated:  ${updatedCount}`);
  console.log(`  Skipped:  ${skippedCount} (null/empty amenities)`);
  console.log(`  No match: ${emptyCount} (no mapping matches)`);
  console.log("========================================\n");

  await client.end();
  console.log("Normalization complete!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
