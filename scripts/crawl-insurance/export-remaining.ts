/**
 * Export all published clinics with websites EXCLUDING the top 1200 by pageviews
 * (which were already crawled in previous batches).
 * Run: pnpm tsx scripts/crawl-insurance/export-remaining.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { writeFileSync } from "fs";

async function main() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) throw new Error("POSTGRES_URL required");

  const client = postgres(connectionString);
  const db = drizzle(client);

  // Get remaining clinics excluding top 1200 by pageviews (already crawled)
  const results = await db.execute(sql`
    SELECT
      id as clinic_id,
      title,
      website,
      state_abbreviation as state
    FROM clinics
    WHERE status = 'published'
      AND website IS NOT NULL
      AND website != ''
      AND id NOT IN (
        SELECT c.id
        FROM analytics_events ae
        JOIN clinics c ON c.id = ae.clinic_id
        WHERE ae.event_type = 'clinic_view'
          AND c.status = 'published'
          AND c.website IS NOT NULL
          AND c.website != ''
        GROUP BY c.id
        ORDER BY COUNT(*) DESC
        LIMIT 1200
      )
    ORDER BY title
  `);

  console.log(`Excluding top 1200 already-crawled clinics`);

  console.log(`Remaining clinics with websites: ${results.length}`);

  const clinicUrls = results.map((r) => ({
    id: r.clinic_id,
    title: r.title,
    website: r.website,
    state: r.state || "",
  }));

  writeFileSync(
    "scripts/crawl-insurance/clinic-urls-remaining.json",
    JSON.stringify(clinicUrls, null, 2)
  );
  console.log("Saved to scripts/crawl-insurance/clinic-urls-remaining.json");

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
