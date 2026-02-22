import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { adPlacements } from "@/lib/schema";

// ============================================
// Types
// ============================================

export type DateRange = "today" | "7d" | "30d" | "all";

export interface OverviewStats {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  revenue: number;
  ecpm: number;
}

export interface StatsOverTimeRow {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

export interface CreativeStats {
  creativeId: string;
  creativeName: string;
  campaignName: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  revenue: number;
}

export interface RecentConversion {
  id: string;
  clickId: string;
  conversionType: string | null;
  payout: string | null;
  metadata: unknown;
  createdAt: Date;
  campaignName: string;
  creativeName: string;
}

// ============================================
// Helpers
// ============================================

// AST = UTC-04. Use Puerto Rico (same offset, widely supported in both JS and PG).
const AST_TZ = "America/Puerto_Rico";

export function getDateRange(
  range: DateRange
): { start: string; end: string } | null {
  if (range === "all") return null;

  const now = new Date();

  // Compute "start of today" in AST by formatting and re-parsing.
  const todayAstStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: AST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  // todayAstStr is "YYYY-MM-DD". Parse with explicit -04:00 offset for AST start-of-day.
  const todayAstMidnightUtc = new Date(`${todayAstStr}T00:00:00-04:00`);

  if (range === "today") {
    return { start: todayAstMidnightUtc.toISOString(), end: now.toISOString() };
  }

  const days = range === "7d" ? 7 : 30;
  const start = new Date(todayAstMidnightUtc);
  start.setDate(start.getDate() - (days - 1));
  return { start: start.toISOString(), end: now.toISOString() };
}

// ============================================
// getAdOverviewStats
// ============================================

export async function getAdOverviewStats(range: DateRange): Promise<OverviewStats> {
  const dateRange = getDateRange(range);

  const dateWhere = dateRange
    ? sql`WHERE i.created_at >= ${dateRange.start} AND i.created_at <= ${dateRange.end}`
    : sql``;

  type OverviewRow = {
    impressions: string;
    clicks: string;
    conversions: string;
    revenue: string;
  };

  const result = await db.execute<OverviewRow>(sql`
    SELECT
      COUNT(DISTINCT i.id)                              AS impressions,
      COUNT(DISTINCT cl.id)                             AS clicks,
      COUNT(DISTINCT cv.id)                             AS conversions,
      COALESCE(SUM(cv.payout::numeric), 0)              AS revenue
    FROM ad_impressions i
    LEFT JOIN ad_clicks cl ON cl.click_id = i.click_id
    LEFT JOIN ad_conversions cv ON cv.click_id = cl.click_id
    ${dateWhere}
  `);

  const rows = Array.from(result);
  const row = rows[0] ?? {
    impressions: "0",
    clicks: "0",
    conversions: "0",
    revenue: "0",
  };

  const impressions = Number(row.impressions);
  const clicks = Number(row.clicks);
  const conversions = Number(row.conversions);
  const revenue = Number(row.revenue);
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const ecpm = impressions > 0 ? (revenue / impressions) * 1000 : 0;

  return { impressions, clicks, ctr, conversions, revenue, ecpm };
}

// ============================================
// getAdStatsOverTime
// ============================================

export async function getAdStatsOverTime(
  range: DateRange
): Promise<StatsOverTimeRow[]> {
  const dateRange = getDateRange(range);

  const dateWhere = dateRange
    ? sql`WHERE i.created_at >= ${dateRange.start} AND i.created_at <= ${dateRange.end}`
    : sql``;

  type TimeRow = {
    date: string;
    impressions: string;
    clicks: string;
    conversions: string;
    revenue: string;
  };

  const result = await db.execute<TimeRow>(sql`
    SELECT
      to_char(i.created_at - INTERVAL '4 hours', 'YYYY-MM-DD') AS date,
      COUNT(DISTINCT i.id)                                                        AS impressions,
      COUNT(DISTINCT cl.id)                                                       AS clicks,
      COUNT(DISTINCT cv.id)                                                       AS conversions,
      COALESCE(SUM(cv.payout::numeric), 0)                                        AS revenue
    FROM ad_impressions i
    LEFT JOIN ad_clicks cl ON cl.click_id = i.click_id
    LEFT JOIN ad_conversions cv ON cv.click_id = cl.click_id
    ${dateWhere}
    GROUP BY to_char(i.created_at - INTERVAL '4 hours', 'YYYY-MM-DD')
    ORDER BY date ASC
  `);

  return Array.from(result).map((row) => ({
    date: row.date,
    impressions: Number(row.impressions),
    clicks: Number(row.clicks),
    conversions: Number(row.conversions),
    revenue: Number(row.revenue),
  }));
}

// ============================================
// getTopCreatives
// ============================================

export async function getTopCreatives(
  range: DateRange,
  limit = 10
): Promise<CreativeStats[]> {
  const dateRange = getDateRange(range);

  const dateWhere = dateRange
    ? sql`WHERE i.created_at >= ${dateRange.start} AND i.created_at <= ${dateRange.end}`
    : sql``;

  type CreativeRow = {
    creative_id: string;
    creative_name: string;
    campaign_name: string;
    impressions: string;
    clicks: string;
    conversions: string;
    revenue: string;
  };

  const result = await db.execute<CreativeRow>(sql`
    SELECT
      i.creative_id,
      cr.name                              AS creative_name,
      ca.name                              AS campaign_name,
      COUNT(DISTINCT i.id)                 AS impressions,
      COUNT(DISTINCT cl.id)                AS clicks,
      COUNT(DISTINCT cv.id)                AS conversions,
      COALESCE(SUM(cv.payout::numeric), 0) AS revenue
    FROM ad_impressions i
    LEFT JOIN ad_clicks cl ON cl.click_id = i.click_id
    LEFT JOIN ad_conversions cv ON cv.click_id = cl.click_id
    JOIN ad_creatives cr ON cr.id = i.creative_id
    JOIN ad_campaigns ca ON ca.id = i.campaign_id
    ${dateWhere}
    GROUP BY i.creative_id, cr.name, ca.name
    ORDER BY COUNT(DISTINCT cl.id) DESC, SUM(cv.payout::numeric) DESC NULLS LAST
    LIMIT ${limit}
  `);

  return Array.from(result).map((row) => {
    const impressions = Number(row.impressions);
    const clicks = Number(row.clicks);
    return {
      creativeId: row.creative_id,
      creativeName: row.creative_name,
      campaignName: row.campaign_name,
      impressions,
      clicks,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      conversions: Number(row.conversions),
      revenue: Number(row.revenue),
    };
  });
}

// ============================================
// getCampaignStats
// ============================================

export async function getCampaignStats(
  campaignId: string,
  range: DateRange
): Promise<OverviewStats> {
  const dateRange = getDateRange(range);

  const dateClause = dateRange
    ? sql`AND i.created_at >= ${dateRange.start} AND i.created_at <= ${dateRange.end}`
    : sql``;

  type OverviewRow = {
    impressions: string;
    clicks: string;
    conversions: string;
    revenue: string;
  };

  const result = await db.execute<OverviewRow>(sql`
    SELECT
      COUNT(DISTINCT i.id)                              AS impressions,
      COUNT(DISTINCT cl.id)                             AS clicks,
      COUNT(DISTINCT cv.id)                             AS conversions,
      COALESCE(SUM(cv.payout::numeric), 0)              AS revenue
    FROM ad_impressions i
    LEFT JOIN ad_clicks cl ON cl.click_id = i.click_id
    LEFT JOIN ad_conversions cv ON cv.click_id = cl.click_id
    WHERE i.campaign_id = ${campaignId}
    ${dateClause}
  `);

  const rows = Array.from(result);
  const row = rows[0] ?? {
    impressions: "0",
    clicks: "0",
    conversions: "0",
    revenue: "0",
  };

  const impressions = Number(row.impressions);
  const clicks = Number(row.clicks);
  const conversions = Number(row.conversions);
  const revenue = Number(row.revenue);
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const ecpm = impressions > 0 ? (revenue / impressions) * 1000 : 0;

  return { impressions, clicks, ctr, conversions, revenue, ecpm };
}

// ============================================
// getRecentConversions
// ============================================

export async function getRecentConversions(
  limit = 50
): Promise<RecentConversion[]> {
  type ConversionRow = {
    id: string;
    click_id: string;
    conversion_type: string | null;
    payout: string | null;
    metadata: unknown;
    created_at: Date;
    campaign_name: string;
    creative_name: string;
  };

  const result = await db.execute<ConversionRow>(sql`
    SELECT
      cv.id,
      cv.click_id,
      cv.conversion_type,
      cv.payout,
      cv.metadata,
      cv.created_at,
      ca.name AS campaign_name,
      cr.name AS creative_name
    FROM ad_conversions cv
    JOIN ad_clicks cl ON cl.click_id = cv.click_id
    JOIN ad_impressions i ON i.click_id = cl.click_id
    JOIN ad_creatives cr ON cr.id = i.creative_id
    JOIN ad_campaigns ca ON ca.id = i.campaign_id
    ORDER BY cv.created_at DESC
    LIMIT ${limit}
  `);

  return Array.from(result).map((row) => ({
    id: row.id,
    clickId: row.click_id,
    conversionType: row.conversion_type,
    payout: row.payout,
    metadata: row.metadata,
    createdAt: new Date(row.created_at),
    campaignName: row.campaign_name,
    creativeName: row.creative_name,
  }));
}

// ============================================
// getPlacementsWithCounts
// ============================================

export interface PlacementWithCampaignCount {
  id: string;
  name: string;
  label: string;
  pageType: "clinic" | "directory" | "blog" | "homepage";
  description: string | null;
  defaultWidth: number | null;
  defaultHeight: number | null;
  isActive: boolean;
  assignedCampaignCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function getPlacementsWithCounts(): Promise<PlacementWithCampaignCount[]> {
  const rows = await db
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
    .from(adPlacements)
    .orderBy(adPlacements.name);

  return rows;
}
