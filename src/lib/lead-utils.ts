/**
 * Lead utility functions that can be used in both server and client components.
 * These functions don't import database code, making them safe for client-side use.
 */

export type LeadStatus = "new" | "contacted" | "qualified" | "closed";

export interface LeadForFollowUpCheck {
  createdAt: Date;
  followedUpAt: Date | null;
  status: LeadStatus;
}

/**
 * Add business days to a date (skips weekends)
 */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Skip Sat/Sun
      addedDays++;
    }
  }

  return result;
}

/**
 * Check if a lead needs follow-up (2+ business days old, not followed up, not qualified/closed)
 */
export function needsFollowUp(lead: LeadForFollowUpCheck): boolean {
  if (lead.followedUpAt) return false;
  if (lead.status === "qualified" || lead.status === "closed") return false;

  const followUpDueDate = addBusinessDays(new Date(lead.createdAt), 2);
  return new Date() > followUpDueDate;
}
