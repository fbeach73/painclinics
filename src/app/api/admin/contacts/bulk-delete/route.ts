import { NextRequest, NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { contacts } from "@/lib/schema";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";

export async function DELETE(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) return adminErrorResponse(adminCheck);

  const body = await request.json();
  const { contactIds } = body as { contactIds: string[] };

  if (!Array.isArray(contactIds) || contactIds.length === 0) {
    return NextResponse.json({ error: "contactIds required" }, { status: 400 });
  }

  if (contactIds.length > 500) {
    return NextResponse.json(
      { error: "Maximum 500 contacts per request" },
      { status: 400 }
    );
  }

  const result = await db
    .delete(contacts)
    .where(inArray(contacts.id, contactIds))
    .returning({ id: contacts.id });

  return NextResponse.json({ deletedCount: result.length });
}
