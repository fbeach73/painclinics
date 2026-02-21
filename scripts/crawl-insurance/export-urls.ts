/**
 * Export clinic URLs for crawl4ai insurance extraction.
 * Run: pnpm tsx scripts/crawl-insurance/export-urls.ts
 *
 * Outputs: scripts/crawl-insurance/clinic-urls.json
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, isNotNull, sql } from "drizzle-orm";
import { clinics } from "../../src/lib/schema";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
config({ path: ".env.local" });

interface ClinicUrl {
  id: string;
  title: string;
  website: string;
  state: string;
}

async function main() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_URL environment variable is required");
  }

  console.log("Connecting to database...");
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("Querying published clinics with websites...");
  const results = await db
    .select({
      id: clinics.id,
      title: clinics.title,
      website: clinics.website,
      state: clinics.stateAbbreviation,
    })
    .from(clinics)
    .where(
      and(
        eq(clinics.status, "published"),
        isNotNull(clinics.website),
        sql`${clinics.website} != ''`
      )
    );

  const clinicUrls: ClinicUrl[] = results
    .filter((r): r is typeof r & { website: string; state: string } =>
      Boolean(r.website && r.state)
    )
    .map((r) => ({
      id: r.id,
      title: r.title,
      website: r.website,
      state: r.state,
    }));

  const outputPath = resolve(__dirname, "clinic-urls.json");
  writeFileSync(outputPath, JSON.stringify(clinicUrls, null, 2));

  console.log(`\nExported ${clinicUrls.length} clinic URLs to ${outputPath}`);

  await client.end();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
