/**
 * Script to seed the insurance_providers table from existing data/services.ts definitions.
 * Run with: pnpm tsx src/scripts/seed-insurance.ts
 */

import { createId } from "@paralleldrive/cuid2";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { insuranceProviders as insuranceProvidersTable } from "../lib/schema";
import { insuranceProviders } from "../data/services";
import "dotenv/config";

async function main() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_URL environment variable is required");
  }

  console.log("Connecting to database...");
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log(`\nSeeding ${insuranceProviders.length} insurance providers...\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < insuranceProviders.length; i++) {
    const provider = insuranceProviders[i]!;
    try {
      const result = await db
        .insert(insuranceProvidersTable)
        .values({
          id: createId(),
          name: provider.name,
          slug: provider.type,
          displayOrder: i,
          isActive: true,
        })
        .onConflictDoNothing({ target: insuranceProvidersTable.slug })
        .returning({ id: insuranceProvidersTable.id });

      if (result.length > 0) {
        console.log(`  + Created: ${provider.name} (${provider.type})`);
        successCount++;
      } else {
        console.log(`  - Skipped (exists): ${provider.name}`);
        skipCount++;
      }
    } catch (error) {
      console.error(`  ! Error creating ${provider.name}:`, error);
      errorCount++;
    }
  }

  console.log("\n========================================");
  console.log("Seed Results:");
  console.log(`  Created: ${successCount}`);
  console.log(`  Skipped: ${skipCount}`);
  console.log(`  Errors:  ${errorCount}`);
  console.log("========================================\n");

  await client.end();

  if (errorCount > 0) {
    process.exit(1);
  }

  console.log("Seeding complete!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
