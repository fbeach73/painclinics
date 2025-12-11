/**
 * Script to seed the services table with predefined pain management services
 * Run with: pnpm tsx src/scripts/seed-services.ts
 */

import { createId } from "@paralleldrive/cuid2";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { servicesSeedData } from "../data/services-seed";
import { services } from "../lib/schema";
import "dotenv/config";

async function main() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_URL environment variable is required");
  }

  console.log("Connecting to database...");
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log(`\nSeeding ${servicesSeedData.length} services...\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const serviceData of servicesSeedData) {
    try {
      // Use ON CONFLICT DO NOTHING to skip duplicates
      const result = await db
        .insert(services)
        .values({
          id: createId(),
          name: serviceData.name,
          slug: serviceData.slug,
          iconName: serviceData.iconName,
          description: serviceData.description ?? null,
          category: serviceData.category,
          isActive: serviceData.isActive ?? true,
          displayOrder: serviceData.displayOrder ?? 0,
        })
        .onConflictDoNothing({ target: services.slug })
        .returning({ id: services.id });

      if (result.length > 0) {
        console.log(`  + Created: ${serviceData.name} (${serviceData.category})`);
        successCount++;
      } else {
        console.log(`  - Skipped (exists): ${serviceData.name}`);
        skipCount++;
      }
    } catch (error) {
      console.error(`  ! Error creating ${serviceData.name}:`, error);
      errorCount++;
    }
  }

  console.log("\n========================================");
  console.log("Seed Results:");
  console.log(`  Created: ${successCount}`);
  console.log(`  Skipped: ${skipCount}`);
  console.log(`  Errors:  ${errorCount}`);
  console.log("========================================\n");

  // Close the connection
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
