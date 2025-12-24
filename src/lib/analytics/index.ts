/**
 * Analytics module - Privacy-first analytics for the application
 */

export { isBot } from "./bot-filter";
export { categorizeReferrer, getReferrerLabel } from "./referrer-utils";
export { generateSessionHash, getEventDate } from "./session-hash";
export {
  getOverviewStats,
  getReferrerStats,
  getTopPages,
  getViewsOverTime,
  getClinicAnalytics,
  insertAnalyticsEvent,
  type DateRange,
} from "./queries";
