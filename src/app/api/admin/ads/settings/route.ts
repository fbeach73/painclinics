import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { adSettings } from "@/lib/schema";

const SETTINGS_ID = 1;

export async function GET() {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  let settings = await db.query.adSettings.findFirst({
    where: eq(adSettings.id, SETTINGS_ID),
  });

  if (!settings) {
    // Initialize single-row settings if not yet seeded
    const [created] = await db
      .insert(adSettings)
      .values({ id: SETTINGS_ID, adServerPercentage: 0 })
      .onConflictDoNothing()
      .returning();
    settings = created ?? { id: SETTINGS_ID, adServerPercentage: 0, updatedAt: new Date() };
  }

  return NextResponse.json({ adServerPercentage: settings.adServerPercentage });
}

export async function PATCH(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { adServerPercentage } = body;

  if (typeof adServerPercentage !== "number") {
    return NextResponse.json(
      { error: "adServerPercentage must be a number" },
      { status: 400 }
    );
  }

  if (!Number.isInteger(adServerPercentage) || adServerPercentage < 0 || adServerPercentage > 100) {
    return NextResponse.json(
      { error: "adServerPercentage must be an integer between 0 and 100" },
      { status: 400 }
    );
  }

  // Upsert: insert if row doesn't exist, update if it does
  await db
    .insert(adSettings)
    .values({ id: SETTINGS_ID, adServerPercentage })
    .onConflictDoUpdate({
      target: adSettings.id,
      set: { adServerPercentage, updatedAt: sql`now()` },
    });

  return NextResponse.json({ adServerPercentage });
}
