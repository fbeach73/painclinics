import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { adCampaigns } from "@/lib/schema";

export async function GET() {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const campaigns = await db
    .select({
      id: adCampaigns.id,
      name: adCampaigns.name,
      advertiserName: adCampaigns.advertiserName,
      advertiserEmail: adCampaigns.advertiserEmail,
      advertiserUrl: adCampaigns.advertiserUrl,
      status: adCampaigns.status,
      startDate: adCampaigns.startDate,
      endDate: adCampaigns.endDate,
      dailyBudgetCents: adCampaigns.dailyBudgetCents,
      totalBudgetCents: adCampaigns.totalBudgetCents,
      notes: adCampaigns.notes,
      createdAt: adCampaigns.createdAt,
      updatedAt: adCampaigns.updatedAt,
      impressionCount: sql<number>`
        COALESCE((
          SELECT COUNT(*)::int
          FROM ad_impressions
          WHERE ad_impressions.campaign_id = ad_campaigns.id
        ), 0)
      `,
      clickCount: sql<number>`
        COALESCE((
          SELECT COUNT(*)::int
          FROM ad_impressions i
          INNER JOIN ad_clicks k ON k.click_id = i.click_id
          WHERE i.campaign_id = ad_campaigns.id
        ), 0)
      `,
      conversionCount: sql<number>`
        COALESCE((
          SELECT COUNT(*)::int
          FROM ad_impressions i
          INNER JOIN ad_clicks k ON k.click_id = i.click_id
          INNER JOIN ad_conversions v ON v.click_id = k.click_id
          WHERE i.campaign_id = ad_campaigns.id
        ), 0)
      `,
      revenue: sql<string>`
        COALESCE((
          SELECT SUM(v.payout)
          FROM ad_impressions i
          INNER JOIN ad_clicks k ON k.click_id = i.click_id
          INNER JOIN ad_conversions v ON v.click_id = k.click_id
          WHERE i.campaign_id = ad_campaigns.id
        ), 0)
      `,
    })
    .from(adCampaigns)
    .orderBy(sql`${adCampaigns.createdAt} DESC`);

  return NextResponse.json({
    campaigns,
    totalCount: campaigns.length,
  });
}

export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  let body: {
    name?: unknown;
    advertiserName?: unknown;
    advertiserEmail?: unknown;
    advertiserUrl?: unknown;
    status?: unknown;
    startDate?: unknown;
    endDate?: unknown;
    dailyBudgetCents?: unknown;
    totalBudgetCents?: unknown;
    notes?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, advertiserName } = body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!advertiserName || typeof advertiserName !== "string" || advertiserName.trim() === "") {
    return NextResponse.json({ error: "advertiserName is required" }, { status: 400 });
  }

  const insertData: typeof adCampaigns.$inferInsert = {
    name: name.trim(),
    advertiserName: advertiserName.trim(),
    advertiserEmail: typeof body.advertiserEmail === "string" ? body.advertiserEmail : undefined,
    advertiserUrl: typeof body.advertiserUrl === "string" ? body.advertiserUrl : undefined,
    status:
      body.status === "active" || body.status === "paused" || body.status === "ended"
        ? body.status
        : undefined,
    startDate: body.startDate ? new Date(body.startDate as string) : undefined,
    endDate: body.endDate ? new Date(body.endDate as string) : undefined,
    dailyBudgetCents: typeof body.dailyBudgetCents === "number" ? body.dailyBudgetCents : undefined,
    totalBudgetCents: typeof body.totalBudgetCents === "number" ? body.totalBudgetCents : undefined,
    notes: typeof body.notes === "string" ? body.notes : undefined,
  };

  const [campaign] = await db.insert(adCampaigns).values(insertData).returning();

  return NextResponse.json({ campaign }, { status: 201 });
}
