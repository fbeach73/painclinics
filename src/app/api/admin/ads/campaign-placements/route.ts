import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { adCampaignPlacements, adCampaigns, adPlacements } from "@/lib/schema";

export async function POST(request: NextRequest) {
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

  const { campaignId, placementId } = body;

  if (!campaignId || typeof campaignId !== "string") {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }
  if (!placementId || typeof placementId !== "string") {
    return NextResponse.json({ error: "placementId is required" }, { status: 400 });
  }

  const campaign = await db.query.adCampaigns.findFirst({
    where: eq(adCampaigns.id, campaignId),
  });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const placement = await db.query.adPlacements.findFirst({
    where: eq(adPlacements.id, placementId),
  });
  if (!placement) {
    return NextResponse.json({ error: "Placement not found" }, { status: 404 });
  }

  const existing = await db.query.adCampaignPlacements.findFirst({
    where: and(
      eq(adCampaignPlacements.campaignId, campaignId),
      eq(adCampaignPlacements.placementId, placementId)
    ),
  });
  if (existing) {
    return NextResponse.json(
      { error: "Campaign is already assigned to this placement" },
      { status: 409 }
    );
  }

  const insertData: typeof adCampaignPlacements.$inferInsert = {
    campaignId,
    placementId,
    weight: typeof body.weight === "number" ? body.weight : undefined,
  };

  const [assignment] = await db
    .insert(adCampaignPlacements)
    .values(insertData)
    .returning();

  return NextResponse.json({ assignment }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
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

  const { campaignId, placementId } = body;

  if (!campaignId || typeof campaignId !== "string") {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }
  if (!placementId || typeof placementId !== "string") {
    return NextResponse.json({ error: "placementId is required" }, { status: 400 });
  }

  const existing = await db.query.adCampaignPlacements.findFirst({
    where: and(
      eq(adCampaignPlacements.campaignId, campaignId),
      eq(adCampaignPlacements.placementId, placementId)
    ),
  });

  if (!existing) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  await db
    .delete(adCampaignPlacements)
    .where(
      and(
        eq(adCampaignPlacements.campaignId, campaignId),
        eq(adCampaignPlacements.placementId, placementId)
      )
    );

  return NextResponse.json({ success: true });
}
