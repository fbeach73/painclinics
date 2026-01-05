/**
 * One-time script to backfill timezone data for all clinics
 * Uses geo-tz to derive IANA timezone from lat/lng coordinates
 *
 * Run with: POSTGRES_URL="..." npx tsx scripts/backfill-timezones.ts
 * Add --dry-run to preview without making changes
 */

import postgres from "postgres";
import { find as findTimezone } from "geo-tz";

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error("POSTGRES_URL environment variable is required");
    process.exit(1);
  }

  const sql = postgres(connectionString);

  console.log(isDryRun ? "🔍 DRY RUN MODE - No changes will be made\n" : "");

  // Get all clinics with lat/lng but no timezone
  const clinicsToUpdate = await sql`
    SELECT id, title, map_latitude, map_longitude, state_abbreviation
    FROM clinics
    WHERE map_latitude IS NOT NULL
      AND map_longitude IS NOT NULL
      AND timezone IS NULL
  `;

  console.log(`Found ${clinicsToUpdate.length} clinics without timezone data\n`);

  if (clinicsToUpdate.length === 0) {
    console.log("All clinics already have timezone data!");
    await sql.end();
    return;
  }

  // Group by timezone for summary
  const timezoneCounts: Record<string, number> = {};
  const updates: { id: string; timezone: string }[] = [];
  let errors = 0;

  for (const clinic of clinicsToUpdate) {
    try {
      const lat = Number(clinic.map_latitude);
      const lng = Number(clinic.map_longitude);

      if (isNaN(lat) || isNaN(lng)) {
        console.error(`  ⚠ Invalid coordinates for ${clinic.title}: ${clinic.map_latitude}, ${clinic.map_longitude}`);
        errors++;
        continue;
      }

      const timezones = findTimezone(lat, lng);
      const timezone = timezones[0];

      if (!timezone) {
        console.error(`  ⚠ Could not determine timezone for ${clinic.title} at ${lat}, ${lng}`);
        errors++;
        continue;
      }

      updates.push({ id: clinic.id as string, timezone });
      timezoneCounts[timezone] = (timezoneCounts[timezone] || 0) + 1;
    } catch (error) {
      console.error(`  ⚠ Error processing ${clinic.title}:`, error);
      errors++;
    }
  }

  // Print timezone distribution
  console.log("Timezone distribution:");
  const sortedTimezones = Object.entries(timezoneCounts).sort((a, b) => b[1] - a[1]);
  for (const [tz, count] of sortedTimezones) {
    console.log(`  ${tz}: ${count} clinics`);
  }

  console.log(`\nTotal: ${updates.length} clinics to update, ${errors} errors\n`);

  if (!isDryRun && updates.length > 0) {
    console.log("Updating database...");

    // Update in batches
    const batchSize = 100;
    let updated = 0;

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);

      // Use a transaction for each batch
      await sql.begin(async (tx) => {
        for (const { id, timezone } of batch) {
          await tx`UPDATE clinics SET timezone = ${timezone} WHERE id = ${id}`;
        }
      });

      updated += batch.length;
      process.stdout.write(`\r  Updated ${updated}/${updates.length} clinics...`);
    }

    console.log(`\n✅ Done! Updated ${updates.length} clinics with timezone data.`);
  } else if (isDryRun) {
    console.log(`🔍 DRY RUN: Would update ${updates.length} clinics.`);
    console.log("Run without --dry-run to apply changes.");
  }

  await sql.end();
}

main().catch(console.error);
