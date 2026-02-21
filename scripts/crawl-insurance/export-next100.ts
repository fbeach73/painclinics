/**
 * Export clinics ranked 101-200 by pageviews for crawl testing.
 * Run: pnpm tsx scripts/crawl-insurance/export-next100.ts
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

  const results = await db.execute(sql`
    SELECT
      COUNT(*) as views,
      c.id as clinic_id,
      c.title,
      c.website,
      c.state_abbreviation as state
    FROM analytics_events ae
    JOIN clinics c ON c.id = ae.clinic_id
    WHERE ae.event_type = 'clinic_view'
      AND c.status = 'published'
      AND c.website IS NOT NULL
      AND c.website != ''
    GROUP BY c.id, c.title, c.website, c.state_abbreviation
    ORDER BY views DESC
    LIMIT 200
  `);

  const next100 = results.slice(100, 200);
  console.log(`Next 100 clinics (ranked 101-200 by views)`);
  console.log(`Count: ${next100.length}`);

  const clinicUrls = next100.map((r) => ({
    id: r.clinic_id,
    title: r.title,
    website: r.website,
    state: r.state || "",
  }));

  writeFileSync(
    "scripts/crawl-insurance/clinic-urls-next100.json",
    JSON.stringify(clinicUrls, null, 2)
  );
  console.log("Saved to scripts/crawl-insurance/clinic-urls-next100.json");

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
