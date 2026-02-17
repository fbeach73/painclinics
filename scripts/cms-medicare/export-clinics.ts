/**
 * Export clinic data (id, title, phone, address) for NPPES matching.
 *
 * Run: pnpm tsx scripts/cms-medicare/export-clinics.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { clinics } from "../../src/lib/schema";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const sql = postgres(process.env.POSTGRES_URL!, { max: 1 });
  const db = drizzle(sql);

  console.log("Querying published clinics...");

  const rows = await db
    .select({
      id: clinics.id,
      title: clinics.title,
      phone: clinics.phone,
      phones: clinics.phones,
      streetAddress: clinics.streetAddress,
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
      postalCode: clinics.postalCode,
    })
    .from(clinics)
    .where(eq(clinics.status, "published"));

  console.log(`Found ${rows.length} published clinics`);

  // Flatten phones: use primary phone + any extras from phones array
  const exported = rows.map((r) => ({
    id: r.id,
    title: r.title,
    phones: Array.from(
      new Set(
        [r.phone, ...(r.phones ?? [])].filter(Boolean).map((p) => p!.replace(/\D/g, "").slice(-10))
      )
    ),
    streetAddress: r.streetAddress ?? "",
    city: r.city,
    stateAbbreviation: r.stateAbbreviation ?? "",
    postalCode: (r.postalCode ?? "").replace(/\s+/g, "").slice(0, 5),
  }));

  const outPath = resolve(__dirname, "clinics-for-matching.json");
  writeFileSync(outPath, JSON.stringify(exported, null, 2));
  console.log(`Wrote ${exported.length} clinics to ${outPath}`);

  // Stats
  const withPhone = exported.filter((c) => c.phones.length > 0).length;
  const withAddress = exported.filter((c) => c.streetAddress.length > 0).length;
  console.log(`  With phone: ${withPhone}`);
  console.log(`  With address: ${withAddress}`);

  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
