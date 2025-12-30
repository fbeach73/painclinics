import { and, eq, isNotNull, inArray, sql, SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics, user } from "@/lib/schema";
import type { TargetAudience, TargetFilters } from "./broadcast-queries";

// ============================================
// Types
// ============================================

export interface ClinicEmail {
  clinicId: string;
  clinicName: string;
  email: string;
  ownerUserId: string | null;
}

export interface TargetingOptions {
  audience: TargetAudience;
  filters?: TargetFilters | undefined;
}

// ============================================
// Targeting Functions
// ============================================

/**
 * Get clinics with emails based on targeting options
 */
export async function getTargetClinics(options: TargetingOptions): Promise<ClinicEmail[]> {
  const { audience, filters } = options;
  const conditions: SQL[] = [];

  // Base condition: published clinics with at least one email
  conditions.push(eq(clinics.status, "published"));
  conditions.push(isNotNull(clinics.emails));
  // Check that emails array has at least one element
  conditions.push(sql`array_length(${clinics.emails}, 1) > 0`);

  // Apply audience-specific filters
  switch (audience) {
    case "all_with_email":
      // No additional filters
      break;

    case "featured_only":
      conditions.push(eq(clinics.isFeatured, true));
      break;

    case "by_state":
      if (filters?.states && filters.states.length > 0) {
        conditions.push(inArray(clinics.stateAbbreviation, filters.states));
      }
      break;

    case "by_tier":
      if (filters?.tiers && filters.tiers.length > 0) {
        // Cast tiers to the enum type
        const tierValues = filters.tiers as ("none" | "basic" | "premium")[];
        conditions.push(inArray(clinics.featuredTier, tierValues));
      }
      break;

    case "custom":
      // Apply both state and tier filters if present
      if (filters?.states && filters.states.length > 0) {
        conditions.push(inArray(clinics.stateAbbreviation, filters.states));
      }
      if (filters?.tiers && filters.tiers.length > 0) {
        const tierValues = filters.tiers as ("none" | "basic" | "premium")[];
        conditions.push(inArray(clinics.featuredTier, tierValues));
      }
      break;
  }

  // Query clinics
  const result = await db
    .select({
      clinicId: clinics.id,
      clinicName: clinics.title,
      emails: clinics.emails,
      ownerUserId: clinics.ownerUserId,
    })
    .from(clinics)
    .where(and(...conditions));

  // Process results to get single email per clinic
  let targetClinics: ClinicEmail[] = result
    .filter((c) => c.emails && c.emails.length > 0 && c.emails[0])
    .map((c) => ({
      clinicId: c.clinicId,
      clinicName: c.clinicName,
      email: c.emails![0] as string,
      ownerUserId: c.ownerUserId,
    }));

  // Exclude unsubscribed users if requested
  if (filters?.excludeUnsubscribed) {
    // Get unsubscribed user IDs
    const unsubscribedUsers = await db
      .select({ id: user.id })
      .from(user)
      .where(isNotNull(user.emailUnsubscribedAt));

    const unsubscribedIds = new Set(unsubscribedUsers.map((u) => u.id));

    // Filter out clinics owned by unsubscribed users
    targetClinics = targetClinics.filter(
      (c) => !c.ownerUserId || !unsubscribedIds.has(c.ownerUserId)
    );
  }

  return targetClinics;
}

/**
 * Get count of target clinics for preview
 */
export async function getTargetClinicCount(options: TargetingOptions): Promise<number> {
  const clinics = await getTargetClinics(options);
  return clinics.length;
}

/**
 * Get distinct states that have clinics with emails
 */
export async function getStatesWithClinics(): Promise<string[]> {
  const result = await db
    .selectDistinct({ state: clinics.stateAbbreviation })
    .from(clinics)
    .where(
      and(
        eq(clinics.status, "published"),
        isNotNull(clinics.emails),
        isNotNull(clinics.stateAbbreviation),
        sql`array_length(${clinics.emails}, 1) > 0`
      )
    )
    .orderBy(clinics.stateAbbreviation);

  return result.map((r) => r.state).filter((s): s is string => s !== null);
}

/**
 * Get clinic counts by state
 */
export async function getClinicCountsByState(): Promise<Record<string, number>> {
  const result = await db
    .select({
      state: clinics.stateAbbreviation,
      count: sql<number>`count(*)::int`,
    })
    .from(clinics)
    .where(
      and(
        eq(clinics.status, "published"),
        isNotNull(clinics.emails),
        isNotNull(clinics.stateAbbreviation),
        sql`array_length(${clinics.emails}, 1) > 0`
      )
    )
    .groupBy(clinics.stateAbbreviation);

  const counts: Record<string, number> = {};
  for (const row of result) {
    if (row.state) {
      counts[row.state] = row.count;
    }
  }
  return counts;
}

/**
 * Get clinic counts by featured tier
 */
export async function getClinicCountsByTier(): Promise<Record<string, number>> {
  const result = await db
    .select({
      tier: clinics.featuredTier,
      count: sql<number>`count(*)::int`,
    })
    .from(clinics)
    .where(
      and(
        eq(clinics.status, "published"),
        isNotNull(clinics.emails),
        sql`array_length(${clinics.emails}, 1) > 0`
      )
    )
    .groupBy(clinics.featuredTier);

  const counts: Record<string, number> = {};
  for (const row of result) {
    if (row.tier) {
      counts[row.tier] = row.count;
    }
  }
  return counts;
}
