import { createId } from "@paralleldrive/cuid2";
import { and, count, desc, ilike, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { contacts } from "@/lib/schema";

// ============================================
// Types
// ============================================

export type Contact = typeof contacts.$inferSelect;

export interface ContactEmail {
  contactId: string;
  email: string;
  name: string | null;
  phone: string | null;
  userId: string | null;
  tags: string[];
  unsubscribeToken: string | null;
}

// ============================================
// Upsert (insert or merge tags on conflict)
// ============================================

export async function upsertContact({
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
}): Promise<Contact> {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await db
    .insert(contacts)
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
      target: contacts.email,
      set: {
        // Merge tags (union)
        tags: sql`(
          SELECT array_agg(DISTINCT t)
          FROM unnest(${contacts.tags} || ${sql.raw(`ARRAY[${tags.map((t) => `'${t}'`).join(",")}]::text[]`)}) AS t
        )`,
        // Update name/phone only if not already set
        name: sql`COALESCE(${contacts.name}, ${name || null})`,
        phone: sql`COALESCE(${contacts.phone}, ${phone || null})`,
        // Link userId if not already linked
        userId: sql`COALESCE(${contacts.userId}, ${userId || null})`,
        updatedAt: new Date(),
      },
    })
    .returning();

  return result[0]!;
}

// ============================================
// Paginated List
// ============================================

export async function getContacts({
  tag,
  search,
  page = 1,
  pageSize = 25,
}: {
  tag?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  contacts: Contact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const conditions = [];

  if (tag) {
    conditions.push(sql`${tag} = ANY(${contacts.tags})`);
  }

  if (search) {
    conditions.push(
      or(
        ilike(contacts.email, `%${search}%`),
        ilike(contacts.name, `%${search}%`)
      )
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [contactsList, totalResult] = await Promise.all([
    db
      .select()
      .from(contacts)
      .where(where)
      .orderBy(desc(contacts.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ total: count() })
      .from(contacts)
      .where(where),
  ]);

  const total = totalResult[0]?.total ?? 0;

  return {
    contacts: contactsList,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ============================================
// Tag Counts
// ============================================

export async function getContactCountsByTag(): Promise<{
  user: number;
  lead: number;
  total: number;
}> {
  const result = await db
    .select({
      total: count(),
      users: sql<number>`count(*) FILTER (WHERE 'user' = ANY(${contacts.tags}))::int`,
      leads: sql<number>`count(*) FILTER (WHERE 'lead' = ANY(${contacts.tags}))::int`,
    })
    .from(contacts);

  return {
    user: result[0]?.users ?? 0,
    lead: result[0]?.leads ?? 0,
    total: result[0]?.total ?? 0,
  };
}

// ============================================
// Broadcast Targeting
// ============================================

export async function getContactsForBroadcast(
  audienceType: "contacts_all" | "contacts_users" | "contacts_leads",
  excludeUnsubscribed = true
): Promise<ContactEmail[]> {
  const conditions = [];

  // Filter by tag
  if (audienceType === "contacts_users") {
    conditions.push(sql`'user' = ANY(${contacts.tags})`);
  } else if (audienceType === "contacts_leads") {
    conditions.push(sql`'lead' = ANY(${contacts.tags})`);
  }

  // Exclude unsubscribed
  if (excludeUnsubscribed) {
    conditions.push(isNull(contacts.unsubscribedAt));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({
      contactId: contacts.id,
      email: contacts.email,
      name: contacts.name,
      phone: contacts.phone,
      userId: contacts.userId,
      tags: contacts.tags,
      unsubscribeToken: contacts.unsubscribeToken,
    })
    .from(contacts)
    .where(where);

  return result;
}
