/**
 * Find a broadcast by name/subject, then remove all failed emails from clinics.
 * Run: env $(grep -v '^#' .env.local | xargs) npx tsx scripts/find-and-clean-broadcast.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/schema";
import { eq, or, sql, desc } from "drizzle-orm";

const url = process.env.POSTGRES_URL;
if (!url) throw new Error("POSTGRES_URL not set");

const client = postgres(url, { max: 1 });
const db = drizzle(client, { schema });

async function main() {
  // Step 1: Find the broadcast
  const broadcasts = await db
    .select({
      id: schema.emailBroadcasts.id,
      name: schema.emailBroadcasts.name,
      subject: schema.emailBroadcasts.subject,
      sentCount: schema.emailBroadcasts.sentCount,
      failedCount: schema.emailBroadcasts.failedCount,
      createdAt: schema.emailBroadcasts.createdAt,
    })
    .from(schema.emailBroadcasts)
    .where(
      or(
        sql`${schema.emailBroadcasts.name} ILIKE '%lead%'`,
        sql`${schema.emailBroadcasts.subject} ILIKE '%lead%'`
      )
    )
    .orderBy(desc(schema.emailBroadcasts.createdAt));

  console.log("Matching broadcasts:");
  for (const b of broadcasts) {
    console.log(`  ${b.createdAt?.toISOString().slice(0, 10)} | ${b.name} | sent: ${b.sentCount} failed: ${b.failedCount} | id: ${b.id}`);
  }

  // Step 2: Get ALL failed/bounced emails across ALL broadcasts (comprehensive clean)
  const failed = await db
    .select({
      recipientEmail: schema.emailLogs.recipientEmail,
      metadata: schema.emailLogs.metadata,
      status: schema.emailLogs.status,
    })
    .from(schema.emailLogs)
    .where(
      or(
        eq(schema.emailLogs.status, "failed"),
        eq(schema.emailLogs.status, "bounced")
      )
    );

  console.log(`\nTotal failed/bounced email log entries: ${failed.length}`);

  // Deduplicate by clinicId -> email
  const toRemove = new Map<string, string>();
  for (const f of failed) {
    const meta = f.metadata as { clinicId?: string } | null;
    if (meta?.clinicId) {
      toRemove.set(meta.clinicId, f.recipientEmail);
    }
  }

  console.log(`Unique clinic/email pairs to clean: ${toRemove.size}\n`);

  let removed = 0;
  for (const [clinicId, email] of toRemove) {
    const clinic = await db
      .select({ id: schema.clinics.id, title: schema.clinics.title, emails: schema.clinics.emails })
      .from(schema.clinics)
      .where(eq(schema.clinics.id, clinicId))
      .limit(1);

    const c = clinic[0];
    if (!c || !c.emails) continue;

    const newEmails = c.emails.filter((e) => e?.toLowerCase() !== email.toLowerCase());

    if (newEmails.length !== c.emails.length) {
      await db
        .update(schema.clinics)
        .set({ emails: newEmails.length > 0 ? newEmails : null })
        .where(eq(schema.clinics.id, clinicId));

      removed++;
      console.log(`  Removed: ${email} from "${c.title}" | remaining: ${newEmails.length}`);
    }
  }

  console.log(`\nDone. Removed ${removed} bad emails from clinics.`);
  await client.end();
}

main().catch(async (err) => {
  console.error("Error:", err);
  await client.end();
  process.exit(1);
});
