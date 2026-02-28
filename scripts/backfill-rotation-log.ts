/**
 * Backfill current featured clinics into rotation log.
 * Run once to track the current batch so they don't get re-featured/re-emailed.
 *
 * Usage: npx tsx scripts/backfill-rotation-log.ts
 */

import { createId } from "@paralleldrive/cuid2";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics, featuredSubscriptions, featuredRotationLog } from "@/lib/schema";

async function main() {
  // Get active subscriber IDs to exclude
  const subs = await db
    .select({ clinicId: featuredSubscriptions.clinicId })
    .from(featuredSubscriptions)
    .where(eq(featuredSubscriptions.status, "active"));
  const subscriberIds = new Set(subs.map((s) => s.clinicId));

  // Get currently featured non-subscriber clinics
  const featured = await db
    .select({
      id: clinics.id,
      title: clinics.title,
      stateAbbreviation: clinics.stateAbbreviation,
    })
    .from(clinics)
    .where(
      and(
        eq(clinics.isFeatured, true),
        eq(clinics.status, "published"),
        sql`array_length(${clinics.emails}, 1) > 0`
      )
    );

  const freeFeatured = featured.filter((c) => !subscriberIds.has(c.id));

  if (freeFeatured.length === 0) {
    console.log("No free featured clinics to backfill.");
    return;
  }

  const batchId = createId();
  const now = new Date();

  console.log(`Backfilling ${freeFeatured.length} clinics with batchId: ${batchId}`);

  const entries = freeFeatured.map((clinic) => ({
    id: createId(),
    clinicId: clinic.id,
    featuredAt: now,
    batchId,
    createdAt: now,
  }));

  await db.insert(featuredRotationLog).values(entries);

  console.log(`Done. ${entries.length} clinics logged in rotation batch ${batchId}`);
  console.log("These clinics will be unfeatured on the next rotation.");
}

main().catch(console.error).finally(() => process.exit(0));
