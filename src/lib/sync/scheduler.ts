/**
 * Scheduling utilities for sync schedules
 */

import type { SyncSchedule } from "./sync-queries";

// ============================================
// Frequency Types
// ============================================

export type SyncFrequency = "manual" | "daily" | "weekly" | "monthly";

// ============================================
// Date Calculation Utilities
// ============================================

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add weeks to a date
 */
function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

/**
 * Add months to a date
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Set time to a specific hour (for scheduling at consistent times)
 */
function setHour(date: Date, hour: number): Date {
  const result = new Date(date);
  result.setHours(hour, 0, 0, 0);
  return result;
}

// ============================================
// Next Run Calculation
// ============================================

/**
 * Calculate the next run time based on frequency
 * @param frequency - The schedule frequency
 * @param lastRun - Optional last run timestamp
 * @param preferredHour - Hour of day to run (0-23), defaults to 3 AM
 * @returns Next run date or null for manual schedules
 */
export function calculateNextRun(
  frequency: SyncFrequency,
  lastRun?: Date | null,
  preferredHour: number = 3
): Date | null {
  // Manual schedules don't have automatic next runs
  if (frequency === "manual") {
    return null;
  }

  const now = new Date();
  const baseDate = lastRun ? new Date(lastRun) : now;

  let nextRun: Date;

  switch (frequency) {
    case "daily":
      nextRun = addDays(baseDate, 1);
      break;

    case "weekly":
      nextRun = addWeeks(baseDate, 1);
      break;

    case "monthly":
      nextRun = addMonths(baseDate, 1);
      break;

    default:
      return null;
  }

  // Set to preferred hour
  nextRun = setHour(nextRun, preferredHour);

  // If the calculated next run is in the past, calculate from now
  if (nextRun <= now) {
    return calculateNextRun(frequency, now, preferredHour);
  }

  return nextRun;
}

/**
 * Calculate the next run time for a schedule
 */
export function calculateNextRunForSchedule(
  schedule: Pick<SyncSchedule, "frequency" | "lastRunAt">
): Date | null {
  return calculateNextRun(
    schedule.frequency as SyncFrequency,
    schedule.lastRunAt
  );
}

// ============================================
// Schedule Validation
// ============================================

/**
 * Check if a schedule is due to run
 */
export function isScheduleDue(
  schedule: Pick<SyncSchedule, "isActive" | "frequency" | "nextRunAt">
): boolean {
  // Inactive schedules are never due
  if (!schedule.isActive) {
    return false;
  }

  // Manual schedules are never due (must be triggered explicitly)
  if (schedule.frequency === "manual") {
    return false;
  }

  // If no next run time is set, it's due
  if (!schedule.nextRunAt) {
    return true;
  }

  // Check if current time is past the next run time
  return new Date() >= new Date(schedule.nextRunAt);
}

/**
 * Check if a schedule can be executed
 */
export function canExecuteSchedule(
  schedule: Pick<SyncSchedule, "isActive">
): boolean {
  return schedule.isActive;
}

// ============================================
// Schedule Description Helpers
// ============================================

/**
 * Get a human-readable description of the schedule frequency
 */
export function getFrequencyDescription(frequency: SyncFrequency): string {
  switch (frequency) {
    case "manual":
      return "Manual (on-demand only)";
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    default:
      return "Unknown";
  }
}

/**
 * Get a human-readable description of when the next run will occur
 */
export function getNextRunDescription(nextRunAt: Date | null): string {
  if (!nextRunAt) {
    return "Not scheduled";
  }

  const now = new Date();
  const next = new Date(nextRunAt);
  const diffMs = next.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Due now";
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `In ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"}`;
  }

  if (diffHours < 24) {
    return `In ${diffHours} hour${diffHours === 1 ? "" : "s"}`;
  }

  if (diffDays < 7) {
    return `In ${diffDays} day${diffDays === 1 ? "" : "s"}`;
  }

  // Format as date for longer periods
  return next.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: next.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Get a human-readable description of the last run
 */
export function getLastRunDescription(lastRunAt: Date | null): string {
  if (!lastRunAt) {
    return "Never";
  }

  const now = new Date();
  const last = new Date(lastRunAt);
  const diffMs = now.getTime() - last.getTime();

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  // Format as date for longer periods
  return last.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: last.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

// ============================================
// Cron Expression Helpers
// ============================================

/**
 * Get the cron expression for a given frequency
 * Note: These are used for documentation/display only
 * The actual cron is configured in vercel.json
 */
export function getCronExpression(frequency: SyncFrequency): string | null {
  switch (frequency) {
    case "daily":
      return "0 3 * * *"; // 3 AM daily
    case "weekly":
      return "0 3 * * 0"; // 3 AM every Sunday
    case "monthly":
      return "0 3 1 * *"; // 3 AM on the 1st of each month
    case "manual":
    default:
      return null;
  }
}

/**
 * Parse a cron schedule description
 */
export function describeCronSchedule(frequency: SyncFrequency): string {
  switch (frequency) {
    case "daily":
      return "Runs every day at 3:00 AM UTC";
    case "weekly":
      return "Runs every Sunday at 3:00 AM UTC";
    case "monthly":
      return "Runs on the 1st of each month at 3:00 AM UTC";
    case "manual":
      return "Triggered manually only";
    default:
      return "Unknown schedule";
  }
}

// ============================================
// Schedule Execution Helpers
// ============================================

/**
 * Prepare a schedule for execution
 * Returns the fields to sync based on schedule configuration
 */
export function getScheduleSyncFields(
  schedule: Pick<
    SyncSchedule,
    "syncReviews" | "syncHours" | "syncPhotos" | "syncContact" | "syncLocation"
  >
): Array<"reviews" | "hours" | "photos" | "contact" | "location"> {
  const fields: Array<"reviews" | "hours" | "photos" | "contact" | "location"> =
    [];

  if (schedule.syncReviews) fields.push("reviews");
  if (schedule.syncHours) fields.push("hours");
  if (schedule.syncPhotos) fields.push("photos");
  if (schedule.syncContact) fields.push("contact");
  if (schedule.syncLocation) fields.push("location");

  return fields;
}

/**
 * Estimate the duration of a sync operation
 * Based on average time per clinic and rate limits
 */
export function estimateSyncDuration(
  clinicCount: number,
  options: {
    requestsPerSecond?: number;
    overheadPerClinic?: number;
  } = {}
): {
  estimatedSeconds: number;
  estimatedMinutes: number;
  description: string;
} {
  const { requestsPerSecond = 10, overheadPerClinic = 0.2 } = options;

  // Time per request based on rate limit
  const secondsPerRequest = 1 / requestsPerSecond;

  // Total time including overhead
  const estimatedSeconds = clinicCount * (secondsPerRequest + overheadPerClinic);
  const estimatedMinutes = Math.ceil(estimatedSeconds / 60);

  let description: string;
  if (estimatedSeconds < 60) {
    description = `~${Math.ceil(estimatedSeconds)} seconds`;
  } else if (estimatedMinutes < 60) {
    description = `~${estimatedMinutes} minute${estimatedMinutes === 1 ? "" : "s"}`;
  } else {
    const hours = Math.floor(estimatedMinutes / 60);
    const minutes = estimatedMinutes % 60;
    description = `~${hours} hour${hours === 1 ? "" : "s"}${
      minutes > 0 ? ` ${minutes} min` : ""
    }`;
  }

  return {
    estimatedSeconds,
    estimatedMinutes,
    description,
  };
}
