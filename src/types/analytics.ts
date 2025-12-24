/**
 * Shared type definitions for analytics
 */

/**
 * Overview statistics for the analytics dashboard
 */
export interface OverviewStats {
  totalPageviews: number;
  uniqueVisitors: number;
  clinicViews: number;
}

/**
 * Referrer source breakdown
 */
export interface ReferrerStats {
  source: string;
  count: number;
}

/**
 * Page statistics with view counts
 */
export interface PageStats {
  path: string;
  views: number;
  uniqueVisitors: number;
}

/**
 * Time series data point for charts
 */
export interface TimeSeriesData {
  date: string;
  views: number;
  uniqueVisitors?: number;
}

/**
 * Complete analytics data for a specific clinic
 */
export interface ClinicAnalytics {
  totalViews: number;
  uniqueVisitors: number;
  referrers: ReferrerStats[];
  viewsOverTime: TimeSeriesData[];
}

/**
 * Complete analytics data for admin dashboard
 */
export interface AnalyticsData {
  overview: OverviewStats;
  referrers: ReferrerStats[];
  topPages: PageStats[];
  viewsOverTime: TimeSeriesData[];
}

/**
 * Date range options for analytics queries
 */
export type DateRange = "today" | "7d" | "30d" | "all";
