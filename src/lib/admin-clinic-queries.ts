import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics, featuredSubscriptions } from "@/lib/schema";

/**
 * Type for clinic featured info with subscription context
 */
export interface ClinicFeaturedInfo {
  clinicId: string;
  clinicTitle: string;
  isFeatured: boolean;
  featuredTier: "none" | "basic" | "premium" | null;
  featuredUntil: Date | null;
  // Subscription info
  hasActiveSubscription: boolean;
  subscriptionId: string | null;
  subscriptionTier: "none" | "basic" | "premium" | null;
  subscriptionStatus: string | null;
  subscriptionEndDate: Date | null;
}

/**
 * Type for admin featured update data
 */
export interface AdminFeaturedUpdateData {
  isFeatured: boolean;
  featuredTier?: "basic" | "premium" | undefined;
  featuredUntil?: Date | undefined;
}

/**
 * Get clinic featured status with subscription context.
 * Returns information about the clinic's featured status and any active subscription.
 *
 * @param clinicId - The clinic ID
 * @returns ClinicFeaturedInfo or null if clinic not found
 */
export async function getClinicFeaturedInfo(
  clinicId: string
): Promise<ClinicFeaturedInfo | null> {
  // Get clinic with featured info
  const clinic = await db.query.clinics.findFirst({
    where: eq(clinics.id, clinicId),
    columns: {
      id: true,
      title: true,
      isFeatured: true,
      featuredTier: true,
      featuredUntil: true,
    },
  });

  if (!clinic) {
    return null;
  }

  // Check for active subscription
  const subscription = await db.query.featuredSubscriptions.findFirst({
    where: and(
      eq(featuredSubscriptions.clinicId, clinicId),
      eq(featuredSubscriptions.status, "active")
    ),
    columns: {
      id: true,
      tier: true,
      status: true,
      endDate: true,
    },
  });

  return {
    clinicId: clinic.id,
    clinicTitle: clinic.title,
    isFeatured: clinic.isFeatured,
    featuredTier: clinic.featuredTier,
    featuredUntil: clinic.featuredUntil,
    hasActiveSubscription: !!subscription,
    subscriptionId: subscription?.id ?? null,
    subscriptionTier: subscription?.tier ?? null,
    subscriptionStatus: subscription?.status ?? null,
    subscriptionEndDate: subscription?.endDate ?? null,
  };
}

/**
 * Update clinic featured status (admin override).
 * This allows admins to manually control featured status, overriding subscription-based settings.
 *
 * @param clinicId - The clinic ID
 * @param data - The update data
 * @returns The updated clinic featured info
 */
export async function updateClinicFeaturedStatus(
  clinicId: string,
  data: AdminFeaturedUpdateData
): Promise<ClinicFeaturedInfo> {
  // Update the clinic
  await db
    .update(clinics)
    .set({
      isFeatured: data.isFeatured,
      featuredTier: data.isFeatured ? (data.featuredTier ?? "basic") : "none",
      featuredUntil: data.isFeatured ? data.featuredUntil : null,
      updatedAt: new Date(),
    })
    .where(eq(clinics.id, clinicId));

  // Return the updated info
  const updatedInfo = await getClinicFeaturedInfo(clinicId);
  if (!updatedInfo) {
    throw new Error("Clinic not found after update");
  }

  return updatedInfo;
}

/**
 * Remove featured status from clinic.
 * Resets all featured fields to their default values.
 *
 * @param clinicId - The clinic ID
 * @returns The updated clinic featured info
 */
export async function removeClinicFeaturedStatus(
  clinicId: string
): Promise<ClinicFeaturedInfo> {
  await db
    .update(clinics)
    .set({
      isFeatured: false,
      featuredTier: "none",
      featuredUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(clinics.id, clinicId));

  const updatedInfo = await getClinicFeaturedInfo(clinicId);
  if (!updatedInfo) {
    throw new Error("Clinic not found after update");
  }

  return updatedInfo;
}

/**
 * Get all featured clinics for admin overview.
 * Returns clinics that are currently featured (not expired).
 *
 * @returns Array of featured clinics with info
 */
export async function getAllFeaturedClinics() {
  const now = new Date();

  return db
    .select({
      id: clinics.id,
      title: clinics.title,
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
      isFeatured: clinics.isFeatured,
      featuredTier: clinics.featuredTier,
      featuredUntil: clinics.featuredUntil,
    })
    .from(clinics)
    .where(
      and(
        eq(clinics.isFeatured, true),
        sql`(${clinics.featuredUntil} IS NULL OR ${clinics.featuredUntil} > ${now})`
      )
    )
    .orderBy(
      sql`CASE WHEN ${clinics.featuredTier} = 'premium' THEN 1 WHEN ${clinics.featuredTier} = 'basic' THEN 2 ELSE 3 END`,
      clinics.title
    );
}
