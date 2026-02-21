import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { adCampaigns, adCreatives, adCampaignPlacements, adPlacements } from "@/lib/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { id } = await params;

  const campaign = await db.query.adCampaigns.findFirst({
    where: eq(adCampaigns.id, id),
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const creatives = await db
    .select()
    .from(adCreatives)
    .where(eq(adCreatives.campaignId, id));

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
      assignmentId: adCampaignPlacements.id,
      assignmentWeight: adCampaignPlacements.weight,
    })
    .from(adCampaignPlacements)
    .innerJoin(adPlacements, eq(adCampaignPlacements.placementId, adPlacements.id))
    .where(eq(adCampaignPlacements.campaignId, id));

  return NextResponse.json({ campaign, creatives, placements });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { id } = await params;

  const existing = await db.query.adCampaigns.findFirst({
    where: eq(adCampaigns.id, id),
  });

  if (!existing) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updateData: Partial<typeof adCampaigns.$inferInsert> = {};

  if (typeof body.name === "string" && body.name.trim() !== "") {
    updateData.name = body.name.trim();
  }
  if (typeof body.advertiserName === "string" && body.advertiserName.trim() !== "") {
    updateData.advertiserName = body.advertiserName.trim();
  }
  if ("advertiserEmail" in body) {
    updateData.advertiserEmail =
      typeof body.advertiserEmail === "string" ? body.advertiserEmail : undefined;
  }
  if ("advertiserUrl" in body) {
    updateData.advertiserUrl =
      typeof body.advertiserUrl === "string" ? body.advertiserUrl : undefined;
  }
  if (
    body.status === "active" ||
    body.status === "paused" ||
    body.status === "ended"
  ) {
    updateData.status = body.status;
  }
  if ("startDate" in body) {
    updateData.startDate = body.startDate ? new Date(body.startDate as string) : undefined;
  }
  if ("endDate" in body) {
    updateData.endDate = body.endDate ? new Date(body.endDate as string) : undefined;
  }
  if ("dailyBudgetCents" in body) {
    updateData.dailyBudgetCents =
      typeof body.dailyBudgetCents === "number" ? body.dailyBudgetCents : undefined;
  }
  if ("totalBudgetCents" in body) {
    updateData.totalBudgetCents =
      typeof body.totalBudgetCents === "number" ? body.totalBudgetCents : undefined;
  }
  if ("notes" in body) {
    updateData.notes = typeof body.notes === "string" ? body.notes : undefined;
  }

  const [campaign] = await db
    .update(adCampaigns)
    .set(updateData)
    .where(eq(adCampaigns.id, id))
    .returning();

  return NextResponse.json({ campaign });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { id } = await params;

  const existing = await db.query.adCampaigns.findFirst({
    where: eq(adCampaigns.id, id),
  });

  if (!existing) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Cascade deletes creatives and campaign placements via FK constraints
  await db.delete(adCampaigns).where(eq(adCampaigns.id, id));

  return NextResponse.json({ success: true });
}
