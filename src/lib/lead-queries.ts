import { eq, desc, sql, and, isNull, ne, count } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinicLeads, emailLogs, leadStatusEnum } from "@/lib/schema";
import { addBusinessDays, needsFollowUp } from "@/lib/lead-utils";

// Re-export utility functions from lead-utils (safe for client-side use)
export { addBusinessDays, needsFollowUp };

// ============================================
// Types
// ============================================

export type Lead = typeof clinicLeads.$inferSelect;
export type LeadStatus = (typeof leadStatusEnum.enumValues)[number];

export interface LeadWithDetails extends Lead {
  clinic: {
    id: string;
    title: string;
    city: string;
    stateAbbreviation: string | null;
    emails: string[] | null;
  };
  clinicEmailLog: typeof emailLogs.$inferSelect | null;
  patientEmailLog: typeof emailLogs.$inferSelect | null;
}

export interface CreateLeadData {
  clinicId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  preferredContactTime: string;
  additionalInfo?: string | null;
  painType: string;
  painDuration: string;
  previousTreatment: string;
  insurance: string;
  formData?: Record<string, unknown>;
  clinicEmailLogId?: string;
  patientEmailLogId?: string;
}

export interface GetLeadsOptions {
  status?: LeadStatus | "all" | "needs_followup";
  limit?: number;
  offset?: number;
}

// ============================================
// Create Functions
// ============================================

/**
 * Create a new lead record
 */
export async function createLead(data: CreateLeadData): Promise<Lead> {
  const result = await db
    .insert(clinicLeads)
    .values({
      clinicId: data.clinicId,
      patientName: data.patientName,
      patientEmail: data.patientEmail,
      patientPhone: data.patientPhone,
      preferredContactTime: data.preferredContactTime,
      additionalInfo: data.additionalInfo ?? null,
      painType: data.painType,
      painDuration: data.painDuration,
      previousTreatment: data.previousTreatment,
      insurance: data.insurance,
      formData: data.formData ?? null,
      clinicEmailLogId: data.clinicEmailLogId ?? null,
      patientEmailLogId: data.patientEmailLogId ?? null,
    })
    .returning();

  if (!result[0]) {
    throw new Error("Failed to create lead");
  }

  return result[0];
}

// ============================================
// Read Functions
// ============================================

/**
 * Get a single lead by ID with clinic and email log details
 */
export async function getLeadById(
  leadId: string
): Promise<LeadWithDetails | null> {
  const result = await db.query.clinicLeads.findFirst({
    where: eq(clinicLeads.id, leadId),
    with: {
      clinic: {
        columns: {
          id: true,
          title: true,
          city: true,
          stateAbbreviation: true,
          emails: true,
        },
      },
      clinicEmailLog: true,
      patientEmailLog: true,
    },
  });

  return result as LeadWithDetails | null;
}

/**
 * Get leads with filtering and pagination
 */
export async function getLeads(
  options: GetLeadsOptions = {}
): Promise<LeadWithDetails[]> {
  const { status = "all", limit = 50, offset = 0 } = options;

  // Build conditions
  const conditions = [];

  if (status === "needs_followup") {
    // Leads that need follow-up:
    // - Not followed up yet
    // - Not qualified or closed
    // - Created more than 2 business days ago
    // Note: Business day calculation is approximate in SQL; we filter more precisely in JS
    conditions.push(isNull(clinicLeads.followedUpAt));
    conditions.push(ne(clinicLeads.status, "qualified"));
    conditions.push(ne(clinicLeads.status, "closed"));
    // Approximate: 2 business days = ~4 calendar days to account for weekends
    conditions.push(
      sql`${clinicLeads.createdAt} < NOW() - INTERVAL '2 days'`
    );
  } else if (status !== "all") {
    conditions.push(eq(clinicLeads.status, status));
  }

  const leads = await db.query.clinicLeads.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: desc(clinicLeads.createdAt),
    limit,
    offset,
    with: {
      clinic: {
        columns: {
          id: true,
          title: true,
          city: true,
          stateAbbreviation: true,
          emails: true,
        },
      },
      clinicEmailLog: true,
      patientEmailLog: true,
    },
  });

  // For needs_followup, do precise business day filtering
  if (status === "needs_followup") {
    return (leads as LeadWithDetails[]).filter((lead) => needsFollowUp(lead));
  }

  return leads as LeadWithDetails[];
}

/**
 * Get total leads count with optional status filter
 */
export async function getLeadsCount(
  status?: LeadStatus | "all" | "needs_followup"
): Promise<number> {
  if (status === "needs_followup") {
    // Need to fetch and filter in JS for accurate business day calculation
    const leads = await getLeads({ status: "needs_followup", limit: 10000 });
    return leads.length;
  }

  const conditions =
    status && status !== "all" ? [eq(clinicLeads.status, status)] : [];

  const result = await db
    .select({ count: count() })
    .from(clinicLeads)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return Number(result[0]?.count || 0);
}

/**
 * Get leads count by status for filter tabs
 */
export async function getLeadsCountByStatus(): Promise<{
  all: number;
  new: number;
  contacted: number;
  qualified: number;
  closed: number;
  needs_followup: number;
}> {
  const results = await db
    .select({
      status: clinicLeads.status,
      count: count(),
    })
    .from(clinicLeads)
    .groupBy(clinicLeads.status);

  const counts = {
    all: 0,
    new: 0,
    contacted: 0,
    qualified: 0,
    closed: 0,
    needs_followup: 0,
  };

  for (const row of results) {
    const status = row.status as LeadStatus;
    counts[status] = Number(row.count);
    counts.all += Number(row.count);
  }

  // Calculate needs_followup count
  const needsFollowupLeads = await getLeads({
    status: "needs_followup",
    limit: 10000,
  });
  counts.needs_followup = needsFollowupLeads.length;

  return counts;
}

/**
 * Get leads that need follow-up (convenience function)
 */
export async function getLeadsNeedingFollowUp(
  limit = 50
): Promise<LeadWithDetails[]> {
  return getLeads({ status: "needs_followup", limit });
}

// ============================================
// Update Functions
// ============================================

/**
 * Update lead status
 */
export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus
): Promise<Lead | null> {
  const [updated] = await db
    .update(clinicLeads)
    .set({ status })
    .where(eq(clinicLeads.id, leadId))
    .returning();

  return updated ?? null;
}

/**
 * Update lead admin notes
 */
export async function updateLeadNotes(
  leadId: string,
  adminNotes: string
): Promise<Lead | null> {
  const [updated] = await db
    .update(clinicLeads)
    .set({ adminNotes })
    .where(eq(clinicLeads.id, leadId))
    .returning();

  return updated ?? null;
}

/**
 * Update lead follow-up date
 */
export async function updateLeadFollowUpDate(
  leadId: string,
  followUpDate: Date | null
): Promise<Lead | null> {
  const [updated] = await db
    .update(clinicLeads)
    .set({ followUpDate })
    .where(eq(clinicLeads.id, leadId))
    .returning();

  return updated ?? null;
}

/**
 * Mark lead as followed up
 */
export async function markLeadFollowedUp(
  leadId: string,
  _emailLogId?: string
): Promise<Lead | null> {
  const [updated] = await db
    .update(clinicLeads)
    .set({
      followedUpAt: new Date(),
      status: "contacted",
    })
    .where(eq(clinicLeads.id, leadId))
    .returning();

  return updated ?? null;
}

/**
 * Update multiple lead fields at once
 */
export async function updateLead(
  leadId: string,
  data: {
    status?: LeadStatus;
    adminNotes?: string;
    followUpDate?: Date | null;
    followedUpAt?: Date | null;
  }
): Promise<Lead | null> {
  const [updated] = await db
    .update(clinicLeads)
    .set(data)
    .where(eq(clinicLeads.id, leadId))
    .returning();

  return updated ?? null;
}
