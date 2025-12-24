/**
 * Analytics module - Privacy-first analytics for the application
 */

// Utilities
export { isBot } from "./bot-filter";
export { categorizeReferrer, getReferrerLabel } from "./referrer-utils";
export { generateSessionHash, getEventDate } from "./session-hash";

// Constants
export { REFERRER_COLORS, REFERRER_BADGE_COLORS } from "./constants";

// Queries
export {
  getOverviewStats,
  getReferrerStats,
  getTopPages,
  getViewsOverTime,
  getClinicAnalytics,
  insertAnalyticsEvent,
} from "./queries";

// Hooks (client-side)
export {
  useTrafficAnalytics,
  useClinicAnalytics,
  useKeywordsAnalytics,
  type KeywordsResponse,
} from "./hooks";

// Types - re-export from types file for convenience
export type {
  OverviewStats,
  ReferrerStats,
  PageStats,
  TimeSeriesData,
  ClinicAnalytics,
  AnalyticsData,
  DateRange,
} from "@/types/analytics";
