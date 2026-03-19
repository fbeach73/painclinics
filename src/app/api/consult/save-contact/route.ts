import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contacts } from "@/lib/schema";
import { sql } from "drizzle-orm";

interface SaveContactBody {
  email?: string;
  firstName?: string;
  lastName?: string;
  zipCode?: string;
  condition?: string;
  age?: string;
  consultSummary?: string;
}

export async function POST(request: Request) {
  let body: SaveContactBody;
  try {
    body = await request.json() as SaveContactBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, firstName, lastName, zipCode, condition, age, consultSummary } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json({ error: "First and last name are required" }, { status: 400 });
  }

  const name = `${firstName.trim()} ${lastName.trim()}`;
  const newTags = ["consult-user", "pain-consult"];
  const metadata = {
    zipCode: zipCode ?? null,
    condition: condition ?? null,
    age: age ?? null,
    consultSource: "painconsult-ai",
    consultDate: new Date().toISOString(),
    ...(consultSummary ? { consultSummary } : {}),
  };

  // Upsert on email — merge tags, update metadata
  const result = await db
    .insert(contacts)
    .values({
      email: email.toLowerCase().trim(),
      name,
      tags: newTags,
      metadata,
    })
    .onConflictDoUpdate({
      target: contacts.email,
      set: {
        name,
        // Merge tags using PostgreSQL array union
        tags: sql`(
          SELECT ARRAY(
            SELECT DISTINCT unnest(${contacts.tags} || ARRAY['consult-user','pain-consult']::text[])
          )
        )`,
        metadata,
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: contacts.id });

  const contactId = result[0]?.id;
  if (!contactId) {
    return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
  }

  return NextResponse.json({ success: true, contactId });
}
