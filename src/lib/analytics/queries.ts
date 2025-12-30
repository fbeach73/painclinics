/**
 * Analytics query functions for retrieving aggregated analytics data
 * Uses UTC-04 (AST - Atlantic Standard Time) for all date calculations
 */

import { and, count, countDistinct, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { analyticsEvents } from "@/lib/schema";
import type {
  DateRange,
  OverviewStats,
  ReferrerStats,
  PageStats,
  TimeSeriesData,
} from "@/types/analytics";

// Re-export types for backward compatibility
export type { DateRange } from "@/types/analytics";

/**
 * Gets today's date in YYYY-MM-DD format using AST (UTC-04)
 */
function getASTDate(date?: Date): string {
  const d = date || new Date();
  // Convert to UTC-04 (AST) - subtract 4 hours from UTC
  const AST_OFFSET_MS = -4 * 60 * 60 * 1000;
  const astDate = new Date(d.getTime() + AST_OFFSET_MS);

  const year = astDate.getUTCFullYear();
  const month = String(astDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(astDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Gets the start date string (YYYY-MM-DD) for a given date range in AST
 */
function getStartDateString(range: DateRange): string | null {
  const now = new Date();

  // Convert to AST first
  const AST_OFFSET_MS = -4 * 60 * 60 * 1000;
  const astNow = new Date(now.getTime() + AST_OFFSET_MS);

  switch (range) {
    case "today":
      return getASTDate(now);
    case "7d":
      astNow.setUTCDate(astNow.getUTCDate() - 7);
      return getASTDate(new Date(astNow.getTime() - AST_OFFSET_MS));
    case "30d":
      astNow.setUTCDate(astNow.getUTCDate() - 30);
      return getASTDate(new Date(astNow.getTime() - AST_OFFSET_MS));
    case "all":
      return null;
  }
}

/**
 * Gets overview statistics for the analytics dashboard
 */
export async function getOverviewStats(
  range: DateRange,
  clinicId?: string
): Promise<OverviewStats> {
  const startDateStr = getStartDateString(range);

  const conditions = [];
  if (startDateStr) {
    conditions.push(gte(analyticsEvents.eventDate, startDateStr));
  }
  if (clinicId) {
    conditions.push(eq(analyticsEvents.clinicId, clinicId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Total pageviews
  const [pageviewResult] = await db
    .select({ count: count() })
    .from(analyticsEvents)
    .where(whereClause);

  // Unique visitors (distinct session hashes)
  const [visitorResult] = await db
    .select({ count: countDistinct(analyticsEvents.sessionHash) })
    .from(analyticsEvents)
    .where(whereClause);

  // Clinic views (event_type = "clinic_view")
  const clinicViewConditions = [...conditions, eq(analyticsEvents.eventType, "clinic_view")];
  const [clinicViewResult] = await db
    .select({ count: count() })
    .from(analyticsEvents)
    .where(and(...clinicViewConditions));

  return {
    totalPageviews: pageviewResult?.count ?? 0,
    uniqueVisitors: visitorResult?.count ?? 0,
    clinicViews: clinicViewResult?.count ?? 0,
  };
}

/**
 * Gets referrer source breakdown
 */
export async function getReferrerStats(
  range: DateRange,
  limit: number = 10,
  clinicId?: string
): Promise<ReferrerStats[]> {
  const startDateStr = getStartDateString(range);

  const conditions = [];
  if (startDateStr) {
    conditions.push(gte(analyticsEvents.eventDate, startDateStr));
  }
  if (clinicId) {
    conditions.push(eq(analyticsEvents.clinicId, clinicId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select({
      source: analyticsEvents.referrerSource,
      count: count(),
    })
    .from(analyticsEvents)
    .where(whereClause)
    .groupBy(analyticsEvents.referrerSource)
    .orderBy(desc(count()))
    .limit(limit);

  return results.map((r) => ({
    source: r.source || "direct",
    count: r.count,
  }));
}

/**
 * Gets top pages by views
 */
export async function getTopPages(
  range: DateRange,
  limit: number = 10,
  clinicId?: string
): Promise<PageStats[]> {
  const startDateStr = getStartDateString(range);

  const conditions = [];
  if (startDateStr) {
    conditions.push(gte(analyticsEvents.eventDate, startDateStr));
  }
  if (clinicId) {
    conditions.push(eq(analyticsEvents.clinicId, clinicId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select({
      path: analyticsEvents.path,
      views: count(),
      uniqueVisitors: countDistinct(analyticsEvents.sessionHash),
    })
    .from(analyticsEvents)
    .where(whereClause)
    .groupBy(analyticsEvents.path)
    .orderBy(desc(count()))
    .limit(limit);

  return results;
}

/**
 * Gets views over time for charting
 */
export async function getViewsOverTime(
  range: DateRange,
  clinicId?: string
): Promise<TimeSeriesData[]> {
  const startDateStr = getStartDateString(range);

  const conditions = [];
  if (startDateStr) {
    conditions.push(gte(analyticsEvents.eventDate, startDateStr));
  }
  if (clinicId) {
    conditions.push(eq(analyticsEvents.clinicId, clinicId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const results = await db
    .select({
      date: analyticsEvents.eventDate,
      views: count(),
      uniqueVisitors: countDistinct(analyticsEvents.sessionHash),
    })
    .from(analyticsEvents)
    .where(whereClause)
    .groupBy(analyticsEvents.eventDate)
    .orderBy(analyticsEvents.eventDate);

  return results;
}

/**
 * Gets views for a specific clinic (for owner dashboard)
 */
export async function getClinicAnalytics(clinicId: string) {
  // Default to 30 days for clinic owner view
  return {
    overview: await getOverviewStats("30d", clinicId),
    referrers: await getReferrerStats("30d", 5, clinicId),
    viewsOverTime: await getViewsOverTime("30d", clinicId),
  };
}

/**
 * Inserts a new analytics event
 */
export async function insertAnalyticsEvent(event: {
  eventType: string;
  path: string;
  clinicId?: string;
  referrer?: string;
  referrerSource?: string;
  referrerDomain?: string;
  sessionHash: string;
  eventDate: string;
}): Promise<void> {
  await db.insert(analyticsEvents).values({
    eventType: event.eventType,
    path: event.path,
    clinicId: event.clinicId || null,
    referrer: event.referrer || null,
    referrerSource: event.referrerSource || null,
    referrerDomain: event.referrerDomain || null,
    sessionHash: event.sessionHash,
    eventDate: event.eventDate,
  });
}
