import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contacts, consultLeadMatches } from "@/lib/schema";

export async function POST(request: Request) {
  let body: { token?: string };
  try {
    body = (await request.json()) as { token?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { token } = body;
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const contact = await db.query.contacts.findFirst({
    where: eq(contacts.unsubscribeToken, token),
  });

  if (!contact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Already anonymized — idempotent
  if (contact.name === "Anonymous User") {
    return NextResponse.json({ success: true });
  }

  // Strip PII from metadata, keep non-PII fields
  const existingMeta = (contact.metadata ?? {}) as Record<string, unknown>;
  const { zipCode: _z, age: _a, ...safeMeta } = existingMeta;
  const anonymizedMeta: Record<string, unknown> = {
    ...safeMeta,
    anonymizedAt: new Date().toISOString(),
  };

  await db
    .update(contacts)
    .set({
      name: "Anonymous User",
      email: `deleted-${contact.id}@anonymized.painclinics.com`,
      phone: null,
      metadata: anonymizedMeta,
      unsubscribedAt: new Date(),
    })
    .where(eq(contacts.id, contact.id));

  // Delete clinic match records
  await db
    .delete(consultLeadMatches)
    .where(eq(consultLeadMatches.contactId, contact.id));

  return NextResponse.json({ success: true });
}
