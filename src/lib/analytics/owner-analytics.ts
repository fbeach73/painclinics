/**
 * Analytics functions for clinic owners (Premium feature)
 * Provides detailed analytics with period comparison and extended history
 */

import { and, count, countDistinct, desc, eq, gte, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import { analyticsEvents } from "@/lib/schema";
import type { ReferrerStats, TimeSeriesData } from "@/types/analytics";

/**
 * Owner analytics data structure
 */
export interface OwnerAnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  viewsByDay: TimeSeriesData[];
  topReferrers: ReferrerStats[];
  previousPeriodViews: number;
  percentChange: number;
}

/**
 * Gets a date string in YYYY-MM-DD format, offset by days from today (AST timezone)
 */
function getDateOffset(daysAgo: number): string {
  const now = new Date();
  const AST_OFFSET_MS = -4 * 60 * 60 * 1000;
  const astNow = new Date(now.getTime() + AST_OFFSET_MS);
  astNow.setUTCDate(astNow.getUTCDate() - daysAgo);

  const year = astNow.getUTCFullYear();
  const month = String(astNow.getUTCMonth() + 1).padStart(2, "0");
  const day = String(astNow.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Gets detailed analytics for a clinic owner (Premium feature)
 * Includes period comparison and extended data
 */
export async function getOwnerClinicAnalytics(
  clinicId: string,
  days: number = 30
): Promise<OwnerAnalyticsData> {
  const currentPeriodStart = getDateOffset(days);
  const previousPeriodStart = getDateOffset(days * 2);
  const previousPeriodEnd = getDateOffset(days);

  // Current period: total views
  const [currentViewsResult] = await db
    .select({ count: count() })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.clinicId, clinicId),
        gte(analyticsEvents.eventDate, currentPeriodStart)
      )
    );

  // Current period: unique visitors
  const [currentVisitorsResult] = await db
    .select({ count: countDistinct(analyticsEvents.sessionHash) })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.clinicId, clinicId),
        gte(analyticsEvents.eventDate, currentPeriodStart)
      )
    );

  // Previous period: total views (for comparison)
  const [previousViewsResult] = await db
    .select({ count: count() })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.clinicId, clinicId),
        gte(analyticsEvents.eventDate, previousPeriodStart),
        lt(analyticsEvents.eventDate, previousPeriodEnd)
      )
    );

  // Views by day
  const viewsByDay = await db
    .select({
      date: analyticsEvents.eventDate,
      views: count(),
      uniqueVisitors: countDistinct(analyticsEvents.sessionHash),
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.clinicId, clinicId),
        gte(analyticsEvents.eventDate, currentPeriodStart)
      )
    )
    .groupBy(analyticsEvents.eventDate)
    .orderBy(analyticsEvents.eventDate);

  // Top referrers
  const topReferrers = await db
    .select({
      source: analyticsEvents.referrerSource,
      count: count(),
    })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.clinicId, clinicId),
        gte(analyticsEvents.eventDate, currentPeriodStart)
      )
    )
    .groupBy(analyticsEvents.referrerSource)
    .orderBy(desc(count()))
    .limit(10);

  const totalViews = currentViewsResult?.count ?? 0;
  const previousPeriodViews = previousViewsResult?.count ?? 0;

  // Calculate percent change
  let percentChange = 0;
  if (previousPeriodViews > 0) {
    percentChange = Math.round(
      ((totalViews - previousPeriodViews) / previousPeriodViews) * 100
    );
  } else if (totalViews > 0) {
    percentChange = 100; // All growth from zero
  }

  return {
    totalViews,
    uniqueVisitors: currentVisitorsResult?.count ?? 0,
    viewsByDay,
    topReferrers: topReferrers.map((r) => ({
      source: r.source || "direct",
      count: r.count,
    })),
    previousPeriodViews,
    percentChange,
  };
}
