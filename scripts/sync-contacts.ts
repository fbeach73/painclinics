/**
 * One-time sync script: imports existing users and leads into the contacts table.
 *
 * Usage: npx tsx scripts/sync-contacts.ts
 *
 * Safe to re-run — uses upsert with tag merging.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { createId } from "@paralleldrive/cuid2";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../src/lib/schema";

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client, { schema });

async function upsertContact({
  email,
  name,
  phone,
  tags,
  userId,
}: {
  email: string;
  name?: string | null;
  phone?: string | null;
  tags: string[];
  userId?: string | null;
}) {
  const normalizedEmail = email.toLowerCase().trim();
  const tagsArray = `ARRAY[${tags.map((t) => `'${t}'`).join(",")}]::text[]`;

  await db
    .insert(schema.contacts)
    .values({
      id: createId(),
      email: normalizedEmail,
      name: name || null,
      phone: phone || null,
      userId: userId || null,
      tags,
      unsubscribeToken: createId(),
    })
    .onConflictDoUpdate({
      target: schema.contacts.email,
      set: {
        tags: sql.raw(`(
          SELECT array_agg(DISTINCT t)
          FROM unnest(contacts.tags || ${tagsArray}) AS t
        )`),
        name: sql`COALESCE(contacts.name, ${name || null})`,
        phone: sql`COALESCE(contacts.phone, ${phone || null})`,
        userId: sql`COALESCE(contacts.user_id, ${userId || null})`,
        updatedAt: new Date(),
      },
    });
}

async function main() {
  console.log("Starting contacts sync...\n");

  // 1. Sync all users
  const users = await db
    .select({
      id: schema.user.id,
      email: schema.user.email,
      name: schema.user.name,
    })
    .from(schema.user);

  console.log(`Found ${users.length} users to sync`);

  let userCount = 0;
  for (const u of users) {
    await upsertContact({
      email: u.email,
      name: u.name,
      tags: ["user"],
      userId: u.id,
    });
    userCount++;
  }
  console.log(`Synced ${userCount} users\n`);

  // 2. Sync distinct lead emails
  const leads = await db
    .selectDistinctOn([schema.clinicLeads.patientEmail], {
      email: schema.clinicLeads.patientEmail,
      name: schema.clinicLeads.patientName,
      phone: schema.clinicLeads.patientPhone,
    })
    .from(schema.clinicLeads)
    .orderBy(schema.clinicLeads.patientEmail, sql`${schema.clinicLeads.createdAt} DESC`);

  console.log(`Found ${leads.length} distinct lead emails to sync`);

  let leadCount = 0;
  for (const lead of leads) {
    await upsertContact({
      email: lead.email,
      name: lead.name,
      phone: lead.phone,
      tags: ["lead"],
    });
    leadCount++;
  }
  console.log(`Synced ${leadCount} leads\n`);

  // 3. Print summary
  const totalResult = await db.execute(sql`SELECT count(*) as total FROM contacts`);
  const total = (totalResult[0] as { total: string } | undefined)?.total ?? "0";
  console.log(`Total contacts in table: ${total}`);
  console.log("Done!");

  await client.end();
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Sync failed:", err);
  await client.end();
  process.exit(1);
});
