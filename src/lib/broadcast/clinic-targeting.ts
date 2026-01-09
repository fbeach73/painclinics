import { and, eq, isNotNull, inArray, sql, SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics, user, featuredSubscriptions, emailUnsubscribes } from "@/lib/schema";
import type { TargetAudience, TargetFilters } from "./broadcast-queries";

// ============================================
// Types
// ============================================

export interface ClinicEmail {
  clinicId: string;
  clinicName: string;
  email: string;
  bccEmails: string | null; // Additional emails as comma-separated string for BCC
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

// Re-export merge tags from client-safe module
export { MERGE_TAGS, type MergeTagKey } from "./merge-tags";

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

    case "claimed_owners":
      // Target clinics that have been claimed (have an owner) but are NOT paying subscribers
      // Perfect for upselling free users to paid memberships
      return getClaimedNonSubscriberClinics(filters);

    case "by_state":
      if (filters?.states && filters.states.length > 0) {
        conditions.push(inArray(clinics.stateAbbreviation, filters.states));
      }
      break;

    case "by_tier":
      // by_tier now targets ACTIVE SUBSCRIBERS, not just featured_tier on clinic
      // This requires a separate query with JOIN to featured_subscriptions
      if (filters?.tiers && filters.tiers.length > 0) {
        return getSubscriberClinics(filters.tiers as ("basic" | "premium")[], filters);
      }
      return [];  // No tiers selected = no results

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
          bccEmails: null,
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

  // Process results to get single email per clinic with additional emails as BCC
  let targetClinics: ClinicEmail[] = result
    .filter((c) => c.emails && c.emails.length > 0 && c.emails[0])
    .map((c) => ({
      clinicId: c.clinicId,
      clinicName: c.clinicName,
      email: c.emails![0] as string,
      bccEmails: c.emails!.length > 1 ? c.emails!.slice(1).join(",") : null,
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

  // Exclude unsubscribed users/emails if requested
  if (filters?.excludeUnsubscribed) {
    // Get unsubscribed user IDs (users with accounts who unsubscribed)
    const unsubscribedUsers = await db
      .select({ id: user.id })
      .from(user)
      .where(isNotNull(user.emailUnsubscribedAt));

    const unsubscribedUserIds = new Set(unsubscribedUsers.map((u) => u.id));

    // Get unsubscribed emails (emails without accounts that unsubscribed)
    const unsubscribedEmails = await db
      .select({ email: emailUnsubscribes.email })
      .from(emailUnsubscribes)
      .where(isNotNull(emailUnsubscribes.unsubscribedAt));

    const unsubscribedEmailSet = new Set(unsubscribedEmails.map((e) => e.email.toLowerCase()));

    // Filter out:
    // 1. Clinics owned by unsubscribed users
    // 2. Clinics whose email is in the unsubscribes list
    targetClinics = targetClinics.filter((c) => {
      // Check if owner has unsubscribed
      if (c.ownerUserId && unsubscribedUserIds.has(c.ownerUserId)) {
        return false;
      }
      // Check if email address has unsubscribed
      if (unsubscribedEmailSet.has(c.email.toLowerCase())) {
        return false;
      }
      return true;
    });
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
 * Get clinic counts by ACTIVE SUBSCRIPTION tier (not featured_tier)
 * This counts clinics with active Stripe subscriptions
 */
export async function getClinicCountsByTier(): Promise<Record<string, number>> {
  const result = await db
    .select({
      tier: featuredSubscriptions.tier,
      count: sql<number>`count(DISTINCT ${clinics.id})::int`,
    })
    .from(featuredSubscriptions)
    .innerJoin(clinics, eq(featuredSubscriptions.clinicId, clinics.id))
    .where(
      and(
        eq(featuredSubscriptions.status, "active"),
        eq(clinics.status, "published"),
        isNotNull(clinics.emails),
        sql`array_length(${clinics.emails}, 1) > 0`
      )
    )
    .groupBy(featuredSubscriptions.tier);

  const counts: Record<string, number> = {};
  for (const row of result) {
    if (row.tier && row.tier !== "none") {
      counts[row.tier] = row.count;
    }
  }
  return counts;
}

/**
 * Get clinics with ACTIVE SUBSCRIPTIONS for the given tiers
 * Used by "by_tier" targeting to reach actual paying subscribers
 */
async function getSubscriberClinics(
  tiers: ("basic" | "premium")[],
  filters?: TargetFilters
): Promise<ClinicEmail[]> {
  // Query clinics that have active subscriptions with matching tiers
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
      subscriptionTier: featuredSubscriptions.tier,
    })
    .from(featuredSubscriptions)
    .innerJoin(clinics, eq(featuredSubscriptions.clinicId, clinics.id))
    .where(
      and(
        eq(featuredSubscriptions.status, "active"),
        inArray(featuredSubscriptions.tier, tiers),
        eq(clinics.status, "published"),
        isNotNull(clinics.emails),
        sql`array_length(${clinics.emails}, 1) > 0`
      )
    );

  // Process results with additional emails as BCC
  let targetClinics: ClinicEmail[] = result
    .filter((c) => c.emails && c.emails.length > 0 && c.emails[0])
    .map((c) => ({
      clinicId: c.clinicId,
      clinicName: c.clinicName,
      email: c.emails![0] as string,
      bccEmails: c.emails!.length > 1 ? c.emails!.slice(1).join(",") : null,
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

  // Exclude unsubscribed users/emails if requested
  if (filters?.excludeUnsubscribed) {
    const unsubscribedUsers = await db
      .select({ id: user.id })
      .from(user)
      .where(isNotNull(user.emailUnsubscribedAt));

    const unsubscribedUserIds = new Set(unsubscribedUsers.map((u) => u.id));

    const unsubscribedEmails = await db
      .select({ email: emailUnsubscribes.email })
      .from(emailUnsubscribes)
      .where(isNotNull(emailUnsubscribes.unsubscribedAt));

    const unsubscribedEmailSet = new Set(unsubscribedEmails.map((e) => e.email.toLowerCase()));

    targetClinics = targetClinics.filter((c) => {
      if (c.ownerUserId && unsubscribedUserIds.has(c.ownerUserId)) {
        return false;
      }
      if (unsubscribedEmailSet.has(c.email.toLowerCase())) {
        return false;
      }
      return true;
    });
  }

  return targetClinics;
}

/**
 * Get clinics that have been claimed (have an owner) but do NOT have active subscriptions
 * These are free users who could be upsold to paid memberships
 */
async function getClaimedNonSubscriberClinics(
  filters?: TargetFilters
): Promise<ClinicEmail[]> {
  // Get clinic IDs that have active subscriptions (to exclude them)
  const activeSubscriptions = await db
    .select({ clinicId: featuredSubscriptions.clinicId })
    .from(featuredSubscriptions)
    .where(eq(featuredSubscriptions.status, "active"));

  const activeSubscriberIds = new Set(activeSubscriptions.map((s) => s.clinicId));

  // Query clinics that:
  // 1. Have an owner (claimed and approved)
  // 2. Are published
  // 3. Have email
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
    .where(
      and(
        eq(clinics.status, "published"),
        isNotNull(clinics.emails),
        isNotNull(clinics.ownerUserId), // Must have an owner (claimed)
        sql`array_length(${clinics.emails}, 1) > 0`
      )
    );

  // Filter out active subscribers and process results
  let targetClinics: ClinicEmail[] = result
    .filter((c) => {
      // Must have email
      if (!c.emails || c.emails.length === 0 || !c.emails[0]) return false;
      // Must NOT be an active subscriber
      if (activeSubscriberIds.has(c.clinicId)) return false;
      return true;
    })
    .map((c) => ({
      clinicId: c.clinicId,
      clinicName: c.clinicName,
      email: c.emails![0] as string,
      bccEmails: c.emails!.length > 1 ? c.emails!.slice(1).join(",") : null,
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

  // Exclude unsubscribed users/emails if requested
  if (filters?.excludeUnsubscribed) {
    const unsubscribedUsers = await db
      .select({ id: user.id })
      .from(user)
      .where(isNotNull(user.emailUnsubscribedAt));

    const unsubscribedUserIds = new Set(unsubscribedUsers.map((u) => u.id));

    const unsubscribedEmails = await db
      .select({ email: emailUnsubscribes.email })
      .from(emailUnsubscribes)
      .where(isNotNull(emailUnsubscribes.unsubscribedAt));

    const unsubscribedEmailSet = new Set(unsubscribedEmails.map((e) => e.email.toLowerCase()));

    targetClinics = targetClinics.filter((c) => {
      if (c.ownerUserId && unsubscribedUserIds.has(c.ownerUserId)) {
        return false;
      }
      if (unsubscribedEmailSet.has(c.email.toLowerCase())) {
        return false;
      }
      return true;
    });
  }

  return targetClinics;
}

/**
 * Get count of claimed clinic owners who are NOT active subscribers
 */
export async function getClaimedNonSubscriberCount(): Promise<number> {
  // Get clinic IDs that have active subscriptions
  const activeSubscriptions = await db
    .select({ clinicId: featuredSubscriptions.clinicId })
    .from(featuredSubscriptions)
    .where(eq(featuredSubscriptions.status, "active"));

  const activeSubscriberIds = new Set(activeSubscriptions.map((s) => s.clinicId));

  // Count clinics with owners that aren't active subscribers
  const result = await db
    .select({ id: clinics.id })
    .from(clinics)
    .where(
      and(
        eq(clinics.status, "published"),
        isNotNull(clinics.emails),
        isNotNull(clinics.ownerUserId),
        sql`array_length(${clinics.emails}, 1) > 0`
      )
    );

  // Filter out active subscribers
  const count = result.filter((c) => !activeSubscriberIds.has(c.id)).length;
  return count;
}
