import { NextRequest, NextResponse } from "next/server";
import { inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { contacts } from "@/lib/schema";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";

export async function PATCH(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) return adminErrorResponse(adminCheck);

  const body = await request.json();
  const { contactIds, action, tag } = body as {
    contactIds: string[];
    action: "add" | "remove";
    tag: string;
  };

  if (!Array.isArray(contactIds) || contactIds.length === 0) {
    return NextResponse.json({ error: "contactIds required" }, { status: 400 });
  }

  if (contactIds.length > 500) {
    return NextResponse.json(
      { error: "Maximum 500 contacts per request" },
      { status: 400 }
    );
  }

  if (!tag || typeof tag !== "string" || !["add", "remove"].includes(action)) {
    return NextResponse.json(
      { error: "Valid action (add|remove) and tag required" },
      { status: 400 }
    );
  }

  const sanitizedTag = tag.trim().toLowerCase();

  let result;

  if (action === "add") {
    // Add tag using array_cat + array_agg(DISTINCT) to union
    result = await db
      .update(contacts)
      .set({
        tags: sql`(
          SELECT COALESCE(array_agg(DISTINCT t), '{}'::text[])
          FROM unnest(array_cat(${contacts.tags}, ARRAY[${sanitizedTag}]::text[])) AS t
        )`,
        updatedAt: new Date(),
      })
      .where(inArray(contacts.id, contactIds))
      .returning({ id: contacts.id });
  } else {
    // Remove tag
    result = await db
      .update(contacts)
      .set({
        tags: sql`array_remove(${contacts.tags}, ${sanitizedTag})`,
        updatedAt: new Date(),
      })
      .where(inArray(contacts.id, contactIds))
      .returning({ id: contacts.id });
  }

  return NextResponse.json({ updatedCount: result.length });
}
