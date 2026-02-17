/**
 * Import NPPES match results into the database.
 * For matched clinics, inserts clinicInsurance rows for Medicare.
 * Optionally stores NPI on the clinic record.
 *
 * Run: pnpm tsx scripts/cms-medicare/import-matches.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, sql as dsql } from "drizzle-orm";
import {
  clinics,
  clinicInsurance,
  insuranceProviders as insuranceProvidersTable,
} from "../../src/lib/schema";
import { readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
config({ path: ".env.local" });

interface MatchResult {
  clinicId: string;
  npi: string;
  matchTier: "phone" | "name" | "address";
  matchScore: number;
  matchedOrgName: string;
  entityType: string;
  taxonomyCode: string;
}

async function main() {
  const pgClient = postgres(process.env.POSTGRES_URL!, { max: 1 });
  const db = drizzle(pgClient);

  // Load match results
  const matchesPath = resolve(__dirname, "matched-clinics.json");
  const matches: MatchResult[] = JSON.parse(
    readFileSync(matchesPath, "utf-8")
  );
  console.log(`Loaded ${matches.length} matched clinics`);

  // Look up the Medicare insurance provider ID
  const [medicareProvider] = await db
    .select({ id: insuranceProvidersTable.id })
    .from(insuranceProvidersTable)
    .where(eq(insuranceProvidersTable.slug, "medicare"));

  if (!medicareProvider) {
    console.error(
      "ERROR: Medicare insurance provider not found in DB. Run seed-insurance.ts first."
    );
    await pgClient.end();
    process.exit(1);
  }

  console.log(`Medicare provider ID: ${medicareProvider.id}`);

  // Get existing clinicInsurance rows to avoid re-counting them
  const existingRows = await db
    .select({ clinicId: clinicInsurance.clinicId })
    .from(clinicInsurance)
    .where(eq(clinicInsurance.insuranceId, medicareProvider.id));

  const existingClinicIds = new Set(existingRows.map((r) => r.clinicId));
  console.log(
    `Existing Medicare insurance rows: ${existingClinicIds.size}`
  );

  // Insert clinicInsurance rows in batches
  let inserted = 0;
  let errors = 0;
  const batchSize = 500;

  // All matched clinics get Medicare (they're in the NPPES registry)
  const toInsert = matches.filter((m) => !existingClinicIds.has(m.clinicId));
  console.log(
    `New clinics to add Medicare: ${toInsert.length} (skipping ${matches.length - toInsert.length} existing)`
  );

  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    try {
      await db
        .insert(clinicInsurance)
        .values(
          batch.map((m) => ({
            clinicId: m.clinicId,
            insuranceId: medicareProvider.id,
          }))
        )
        .onConflictDoNothing();

      inserted += batch.length;
    } catch (e) {
      // If batch fails, try one by one
      for (const m of batch) {
        try {
          await db
            .insert(clinicInsurance)
            .values({
              clinicId: m.clinicId,
              insuranceId: medicareProvider.id,
            })
            .onConflictDoNothing();
          inserted++;
        } catch {
          errors++;
        }
      }
    }

    if ((i + batchSize) % 1000 === 0 || i + batchSize >= toInsert.length) {
      console.log(
        `  Progress: ${Math.min(i + batchSize, toInsert.length)}/${toInsert.length}`
      );
    }
  }

  // Store NPI on clinic records
  console.log(`\nUpdating NPI on clinic records...`);
  let npiUpdated = 0;
  for (let i = 0; i < matches.length; i += batchSize) {
    const batch = matches.slice(i, i + batchSize);
    for (const m of batch) {
      try {
        await db
          .update(clinics)
          .set({ npi: m.npi })
          .where(eq(clinics.id, m.clinicId));
        npiUpdated++;
      } catch {
        // Silently skip — NPI storage is optional
      }
    }
    if ((i + batchSize) % 1000 === 0 || i + batchSize >= matches.length) {
      console.log(
        `  NPI progress: ${Math.min(i + batchSize, matches.length)}/${matches.length}`
      );
    }
  }
  console.log(`NPI updated on ${npiUpdated} clinics`);

  // Print stats
  const tierStats = matches.reduce(
    (acc, m) => {
      acc[m.matchTier] = (acc[m.matchTier] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log(`\n=== Import Results ===`);
  console.log(`Total matches:     ${matches.length}`);
  console.log(`New rows inserted: ${inserted}`);
  console.log(`Already existed:   ${matches.length - toInsert.length}`);
  console.log(`Errors:            ${errors}`);
  console.log(`\nMatch tier breakdown:`);
  for (const [tier, count] of Object.entries(tierStats)) {
    console.log(`  ${tier}: ${count}`);
  }

  // Final count
  const [result] = await db
    .select({
      total: dsql<number>`count(*)::int`,
    })
    .from(clinicInsurance);

  console.log(`\nTotal clinicInsurance rows in DB: ${result?.total ?? "unknown"}`);

  await pgClient.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
