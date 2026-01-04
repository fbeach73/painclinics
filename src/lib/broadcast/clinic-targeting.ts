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
  // Additional fields for merge tag personalization
  permalink: string;
  city: string;
  state: string;
  stateAbbreviation: string | null;
  streetAddress: string | null;
  postalCode: string;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviewCount: number | null;
  isFeatured: boolean;
  featuredTier: "none" | "basic" | "premium" | null;
}

/**
 * Available merge tags for broadcast emails
 */
export const MERGE_TAGS = {
  clinic_name: { label: "Clinic Name", example: "ABC Pain Clinic" },
  clinic_url: { label: "Clinic Page URL", example: "https://painclinics.com/pain-management/abc-pain-clinic" },
  claim_url: { label: "Claim Listing URL", example: "https://painclinics.com/pain-management/abc-pain-clinic#claim" },
  city: { label: "City", example: "Los Angeles" },
  state: { label: "State (Full)", example: "California" },
  state_abbr: { label: "State (Abbrev)", example: "CA" },
  address: { label: "Street Address", example: "123 Main Street" },
  full_address: { label: "Full Address", example: "123 Main Street, Los Angeles, CA 90001" },
  postal_code: { label: "Postal Code", example: "90001" },
  phone: { label: "Phone Number", example: "(555) 123-4567" },
  website: { label: "Website", example: "https://example.com" },
  rating: { label: "Google Rating", example: "4.8" },
  review_count: { label: "Review Count", example: "127" },
} as const;

export type MergeTagKey = keyof typeof MERGE_TAGS;

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

    case "manual":
      // Return manual email list directly, skip database query
      // Manual entries don't have clinic data, so merge tags will show placeholders
      if (filters?.manualEmails && filters.manualEmails.length > 0) {
        return filters.manualEmails.map((email) => ({
          clinicId: "",
          clinicName: "Your Clinic",
          email,
          ownerUserId: null,
          permalink: "",
          city: "",
          state: "",
          stateAbbreviation: null,
          streetAddress: null,
          postalCode: "",
          phone: null,
          website: null,
          rating: null,
          reviewCount: null,
          isFeatured: false,
          featuredTier: null,
        }));
      }
      return [];
  }

  // Query clinics with all fields needed for merge tags
  const result = await db
    .select({
      clinicId: clinics.id,
      clinicName: clinics.title,
      emails: clinics.emails,
      ownerUserId: clinics.ownerUserId,
      permalink: clinics.permalink,
      city: clinics.city,
      state: clinics.state,
      stateAbbreviation: clinics.stateAbbreviation,
      streetAddress: clinics.streetAddress,
      postalCode: clinics.postalCode,
      phone: clinics.phone,
      website: clinics.website,
      rating: clinics.rating,
      reviewCount: clinics.reviewCount,
      isFeatured: clinics.isFeatured,
      featuredTier: clinics.featuredTier,
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
      permalink: c.permalink,
      city: c.city,
      state: c.state,
      stateAbbreviation: c.stateAbbreviation,
      streetAddress: c.streetAddress,
      postalCode: c.postalCode,
      phone: c.phone,
      website: c.website,
      rating: c.rating,
      reviewCount: c.reviewCount,
      isFeatured: c.isFeatured,
      featuredTier: c.featuredTier,
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
