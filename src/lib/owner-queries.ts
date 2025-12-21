import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

export type ClinicUpdateData = {
  phone?: string | null;
  phones?: string[] | null;
  website?: string | null;
  emails?: string[] | null;
  streetAddress?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  clinicHours?: Record<string, unknown> | null;
  closedOn?: string | null;
  content?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  linkedin?: string | null;
  tiktok?: string | null;
  pinterest?: string | null;
};

/**
 * Get all clinics owned by a user
 */
export async function getOwnedClinics(userId: string) {
  const clinics = await db.query.clinics.findMany({
    where: eq(schema.clinics.ownerUserId, userId),
    orderBy: [desc(schema.clinics.claimedAt)],
    with: {
      clinicServices: {
        with: {
          service: true,
        },
      },
    },
  });

  return clinics;
}

/**
 * Get a specific clinic for an owner (verifies ownership)
 */
export async function getClinicForOwner(clinicId: string, userId: string) {
  const clinic = await db.query.clinics.findFirst({
    where: and(
      eq(schema.clinics.id, clinicId),
      eq(schema.clinics.ownerUserId, userId)
    ),
    with: {
      clinicServices: {
        with: {
          service: true,
        },
      },
    },
  });

  return clinic;
}

/**
 * Update a clinic by an owner (verifies ownership)
 */
export async function updateClinicByOwner(
  clinicId: string,
  userId: string,
  data: ClinicUpdateData
) {
  // Verify ownership
  const clinic = await db.query.clinics.findFirst({
    where: and(
      eq(schema.clinics.id, clinicId),
      eq(schema.clinics.ownerUserId, userId)
    ),
  });

  if (!clinic) {
    throw new Error("Clinic not found or you do not have permission to edit");
  }

  // Update the clinic
  const [updatedClinic] = await db
    .update(schema.clinics)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schema.clinics.id, clinicId))
    .returning();

  return updatedClinic;
}

/**
 * Update a clinic by an admin (no ownership check)
 */
export async function updateClinicByAdmin(
  clinicId: string,
  data: ClinicUpdateData
) {
  const [updatedClinic] = await db
    .update(schema.clinics)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schema.clinics.id, clinicId))
    .returning();

  return updatedClinic;
}

/**
 * Get clinic with featured subscription info
 */
export async function getClinicWithSubscription(clinicId: string, userId: string) {
  const clinic = await db.query.clinics.findFirst({
    where: and(
      eq(schema.clinics.id, clinicId),
      eq(schema.clinics.ownerUserId, userId)
    ),
  });

  if (!clinic) {
    return null;
  }

  const subscription = await db.query.featuredSubscriptions.findFirst({
    where: and(
      eq(schema.featuredSubscriptions.clinicId, clinicId),
      eq(schema.featuredSubscriptions.status, "active")
    ),
  });

  return { clinic, subscription };
}

/**
 * Get analytics/stats for owned clinics
 */
export async function getOwnerClinicStats(userId: string) {
  const clinics = await db.query.clinics.findMany({
    where: eq(schema.clinics.ownerUserId, userId),
    columns: {
      id: true,
      title: true,
      isFeatured: true,
      featuredTier: true,
      rating: true,
      reviewCount: true,
    },
  });

  const totalClinics = clinics.length;
  const featuredCount = clinics.filter((c) => c.isFeatured).length;
  const premiumCount = clinics.filter((c) => c.featuredTier === "premium").length;
  const totalReviews = clinics.reduce((sum, c) => sum + (c.reviewCount || 0), 0);
  const avgRating =
    clinics.length > 0
      ? clinics.reduce((sum, c) => sum + (c.rating || 0), 0) / clinics.length
      : 0;

  return {
    totalClinics,
    featuredCount,
    premiumCount,
    totalReviews,
    avgRating: Math.round(avgRating * 10) / 10,
  };
}

/**
 * Get claim status for user's claims
 */
export async function getUserClaimStatuses(userId: string) {
  const claims = await db.query.clinicClaims.findMany({
    where: eq(schema.clinicClaims.userId, userId),
    orderBy: [desc(schema.clinicClaims.createdAt)],
    with: {
      clinic: {
        columns: {
          id: true,
          title: true,
          city: true,
          state: true,
        },
      },
    },
  });

  return claims;
}
