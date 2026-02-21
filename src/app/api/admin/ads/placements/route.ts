import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { adPlacements } from "@/lib/schema";

export async function GET() {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const placements = await db
    .select({
      id: adPlacements.id,
      name: adPlacements.name,
      label: adPlacements.label,
      pageType: adPlacements.pageType,
      description: adPlacements.description,
      defaultWidth: adPlacements.defaultWidth,
      defaultHeight: adPlacements.defaultHeight,
      isActive: adPlacements.isActive,
      createdAt: adPlacements.createdAt,
      updatedAt: adPlacements.updatedAt,
      assignedCampaignCount: sql<number>`
        COALESCE((
          SELECT COUNT(*)::int
          FROM ad_campaign_placements
          WHERE ad_campaign_placements.placement_id = ad_placements.id
        ), 0)
      `,
    })
    .from(adPlacements);

  return NextResponse.json({ placements });
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

  const { id, isActive } = body;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  if (typeof isActive !== "boolean") {
    return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
  }

  const existing = await db.query.adPlacements.findFirst({
    where: eq(adPlacements.id, id),
  });

  if (!existing) {
    return NextResponse.json({ error: "Placement not found" }, { status: 404 });
  }

  const [placement] = await db
    .update(adPlacements)
    .set({ isActive })
    .where(eq(adPlacements.id, id))
    .returning();

  return NextResponse.json({ placement });
}
