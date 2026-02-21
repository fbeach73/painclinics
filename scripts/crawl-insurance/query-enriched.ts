/**
 * Query clinics that have insurance data in the DB.
 * Run: pnpm tsx scripts/crawl-insurance/query-enriched.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

async function main() {
  const client = postgres(process.env.POSTGRES_URL!);
  const db = drizzle(client);

  const results = await db.execute(sql`
    SELECT
      c.permalink,
      c.title,
      c.state_abbreviation as state,
      array_agg(ip.slug ORDER BY ip.display_order) as insurance_slugs,
      c.payment_methods
    FROM clinic_insurance ci
    JOIN clinics c ON c.id = ci.clinic_id
    JOIN insurance_providers ip ON ip.id = ci.insurance_id
    GROUP BY c.id, c.permalink, c.title, c.state_abbreviation, c.payment_methods
    ORDER BY c.title
  `);

  console.log(`\n${results.length} clinics with insurance data:\n`);
  for (const r of results) {
    console.log(`${r.title} (${r.state})`);
    console.log(`  URL: https://painclinics.com/${r.permalink}`);
    console.log(`  Insurance: ${(r.insurance_slugs as string[]).join(", ")}`);
    if (r.payment_methods)
      console.log(`  Payment: ${(r.payment_methods as string[]).join(", ")}`);
    console.log();
  }

  await client.end();
}
main();
