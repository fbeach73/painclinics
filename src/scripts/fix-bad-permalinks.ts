/**
 * Fix clinics imported with wrong permalink format
 * Deletes clinics with /unknown/ in permalink so they can be re-imported
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";
import { sql, eq } from "drizzle-orm";

async function main() {
  // Find clinics with the wrong permalink format (contains /unknown/)
  const badClinics = await db
    .select({ id: clinics.id, permalink: clinics.permalink, wpId: clinics.wpId })
    .from(clinics)
    .where(sql`permalink LIKE '%/unknown/%'`);

  console.log("Found", badClinics.length, "clinics with /unknown/ in permalink");

  // Delete them so we can re-import with correct permalinks
  if (badClinics.length > 0) {
    for (const clinic of badClinics) {
      await db.delete(clinics).where(eq(clinics.id, clinic.id));
      console.log("  Deleted:", clinic.permalink);
    }
    console.log("\nDeleted", badClinics.length, "clinics. Run import again to re-import with correct permalinks.");
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
