import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db } from "./db";
import { sendClaimApprovedEmail, sendClaimRejectedEmail } from "./email";
import { clinicClaims, clinics, user } from "./schema";

// ============================================
// Types
// ============================================

export interface CreateClaimData {
  clinicId: string;
  userId: string;
  fullName: string;
  role: "owner" | "manager" | "authorized_representative";
  businessEmail: string;
  businessPhone: string;
  additionalNotes?: string | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
}

export interface ClaimWithDetails {
  id: string;
  clinicId: string;
  userId: string;
  fullName: string;
  role: string;
  businessEmail: string;
  businessPhone: string;
  additionalNotes: string | null;
  status: "pending" | "approved" | "rejected" | "expired";
  adminNotes: string | null;
  rejectionReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  clinic: {
    id: string;
    title: string;
    city: string;
    state: string;
    phone: string | null;
    website: string | null;
    streetAddress: string | null;
  };
  claimant: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

// ============================================
// Create Claim
// ============================================

/**
 * Create a new clinic claim request
 */
export async function createClaim(data: CreateClaimData) {
  const result = await db
    .insert(clinicClaims)
    .values({
      clinicId: data.clinicId,
      userId: data.userId,
      fullName: data.fullName,
      role: data.role,
      businessEmail: data.businessEmail,
      businessPhone: data.businessPhone,
      additionalNotes: data.additionalNotes,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      status: "pending",
    })
    .returning();

  const claim = result[0];
  if (!claim) {
    throw new Error("Failed to create claim");
  }
  return claim;
}

// ============================================
// Get Claims for User
// ============================================

/**
 * Get all claims for a specific user with clinic details
 */
export async function getUserClaims(userId: string) {
  const claims = await db
    .select({
      id: clinicClaims.id,
      clinicId: clinicClaims.clinicId,
      status: clinicClaims.status,
      fullName: clinicClaims.fullName,
      role: clinicClaims.role,
      businessEmail: clinicClaims.businessEmail,
      createdAt: clinicClaims.createdAt,
      reviewedAt: clinicClaims.reviewedAt,
      rejectionReason: clinicClaims.rejectionReason,
      clinic: {
        id: clinics.id,
        title: clinics.title,
        city: clinics.city,
        state: clinics.state,
        imageUrl: clinics.imageUrl,
      },
    })
    .from(clinicClaims)
    .innerJoin(clinics, eq(clinicClaims.clinicId, clinics.id))
    .where(eq(clinicClaims.userId, userId))
    .orderBy(desc(clinicClaims.createdAt));

  return claims;
}

// ============================================
// Get Claim by ID
// ============================================

/**
 * Get a claim by ID with full details
 */
export async function getClaimById(
  claimId: string
): Promise<ClaimWithDetails | null> {
  const result = await db
    .select({
      id: clinicClaims.id,
      clinicId: clinicClaims.clinicId,
      userId: clinicClaims.userId,
      fullName: clinicClaims.fullName,
      role: clinicClaims.role,
      businessEmail: clinicClaims.businessEmail,
      businessPhone: clinicClaims.businessPhone,
      additionalNotes: clinicClaims.additionalNotes,
      status: clinicClaims.status,
      adminNotes: clinicClaims.adminNotes,
      rejectionReason: clinicClaims.rejectionReason,
      ipAddress: clinicClaims.ipAddress,
      userAgent: clinicClaims.userAgent,
      reviewedAt: clinicClaims.reviewedAt,
      reviewedBy: clinicClaims.reviewedBy,
      createdAt: clinicClaims.createdAt,
      updatedAt: clinicClaims.updatedAt,
      clinic: {
        id: clinics.id,
        title: clinics.title,
        city: clinics.city,
        state: clinics.state,
        phone: clinics.phone,
        website: clinics.website,
        streetAddress: clinics.streetAddress,
      },
      claimant: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    })
    .from(clinicClaims)
    .innerJoin(clinics, eq(clinicClaims.clinicId, clinics.id))
    .innerJoin(user, eq(clinicClaims.userId, user.id))
    .where(eq(clinicClaims.id, claimId))
    .limit(1);

  const claim = result[0];
  if (!claim) {
    return null;
  }

  // Fetch reviewer if exists
  let reviewer: { id: string; name: string; email: string } | null = null;
  if (claim.reviewedBy) {
    const reviewerResult = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
      })
      .from(user)
      .where(eq(user.id, claim.reviewedBy))
      .limit(1);

    const reviewerData = reviewerResult[0];
    if (reviewerData) {
      reviewer = reviewerData;
    }
  }

  return {
    id: claim.id,
    clinicId: claim.clinicId,
    userId: claim.userId,
    fullName: claim.fullName,
    role: claim.role,
    businessEmail: claim.businessEmail,
    businessPhone: claim.businessPhone,
    additionalNotes: claim.additionalNotes,
    status: claim.status,
    adminNotes: claim.adminNotes,
    rejectionReason: claim.rejectionReason,
    ipAddress: claim.ipAddress,
    userAgent: claim.userAgent,
    reviewedAt: claim.reviewedAt,
    reviewedBy: claim.reviewedBy,
    createdAt: claim.createdAt,
    updatedAt: claim.updatedAt,
    clinic: claim.clinic,
    claimant: claim.claimant,
    reviewer,
  };
}

// ============================================
// Get Pending Claims (Admin)
// ============================================

interface GetClaimsOptions {
  status?: "pending" | "approved" | "rejected" | "expired" | "all";
  limit?: number;
  offset?: number;
}

/**
 * Get claims for admin review with pagination
 */
export async function getClaims(options: GetClaimsOptions = {}) {
  const { status = "pending", limit = 20, offset = 0 } = options;

  const baseQuery = db
    .select({
      id: clinicClaims.id,
      clinicId: clinicClaims.clinicId,
      userId: clinicClaims.userId,
      fullName: clinicClaims.fullName,
      role: clinicClaims.role,
      businessEmail: clinicClaims.businessEmail,
      status: clinicClaims.status,
      createdAt: clinicClaims.createdAt,
      reviewedAt: clinicClaims.reviewedAt,
      clinic: {
        id: clinics.id,
        title: clinics.title,
        city: clinics.city,
        state: clinics.state,
      },
      claimant: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    })
    .from(clinicClaims)
    .innerJoin(clinics, eq(clinicClaims.clinicId, clinics.id))
    .innerJoin(user, eq(clinicClaims.userId, user.id));

  const whereClause =
    status === "all" ? undefined : eq(clinicClaims.status, status);

  const claims = await baseQuery
    .where(whereClause)
    .orderBy(desc(clinicClaims.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count for pagination
  const countQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(clinicClaims);

  const [countResult] = await (whereClause
    ? countQuery.where(whereClause)
    : countQuery);

  return {
    claims,
    total: countResult?.count ?? 0,
    limit,
    offset,
  };
}

// ============================================
// Approve Claim
// ============================================

/**
 * Approve a claim - transfers ownership to the claimant
 * Uses a database transaction for atomicity - all DB operations succeed or none do
 */
export async function approveClaim(
  claimId: string,
  reviewerId: string,
  adminNotes?: string
) {

  // Get the claim first (outside transaction for read)
  const claim = await getClaimById(claimId);

  if (!claim) {
    console.error("[Claim Approval] Claim not found", { claimId });
    throw new Error("Claim not found");
  }

  if (claim.status !== "pending") {
    console.error("[Claim Approval] Claim already reviewed", { claimId, status: claim.status });
    throw new Error("Claim has already been reviewed");
  }

  const now = new Date();

  // All DB writes in transaction for atomicity
  const result = await db.transaction(async (tx) => {
    // Step 1: Update claim status
    await tx
      .update(clinicClaims)
      .set({
        status: "approved",
        reviewedAt: now,
        reviewedBy: reviewerId,
        adminNotes: adminNotes,
      })
      .where(eq(clinicClaims.id, claimId));

    // Step 2: Update clinic ownership
    await tx
      .update(clinics)
      .set({
        ownerUserId: claim.userId,
        isVerified: true,
        claimedAt: now,
      })
      .where(eq(clinics.id, claim.clinicId));

    // Step 3: Update user role to clinic_owner if not already admin
    const [claimantUser] = await tx
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, claim.userId))
      .limit(1);

    if (claimantUser && claimantUser.role !== "admin") {
      await tx
        .update(user)
        .set({ role: "clinic_owner" })
        .where(eq(user.id, claim.userId));
    }

    // Step 4: Expire other pending claims for this clinic
    await tx
      .update(clinicClaims)
      .set({
        status: "expired",
        adminNotes: "Claim expired - clinic was claimed by another user",
      })
      .where(
        and(
          eq(clinicClaims.clinicId, claim.clinicId),
          eq(clinicClaims.status, "pending"),
          sql`${clinicClaims.id} != ${claimId}`
        )
      );

    return { claimId, clinicId: claim.clinicId, userId: claim.userId };
  });

  // Email sending AFTER transaction commits (failures won't rollback DB)
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com"}/my-clinics/${claim.clinicId}`;

  let emailSent = false;
  try {
    const emailResult = await sendClaimApprovedEmail(
      claim.businessEmail,
      claim.clinic.title,
      dashboardUrl,
      {
        userId: claim.userId,
        clinicId: claim.clinicId,
        claimId,
      }
    );
    emailSent = emailResult.success;

    if (!emailResult.success) {
      console.error("[Claim Approval] Email failed but approval succeeded", {
        claimId,
        error: emailResult.error,
      });
    }
  } catch (emailError) {
    console.error("[Claim Approval] Email threw error but approval succeeded", {
      claimId,
      error: emailError instanceof Error ? emailError.message : "Unknown error",
    });
  }

  return {
    success: true,
    ...result,
    emailSent,
  };
}

// ============================================
// Reject Claim
// ============================================

/**
 * Reject a claim with a reason
 */
export async function rejectClaim(
  claimId: string,
  reviewerId: string,
  rejectionReason: string,
  adminNotes?: string
) {
  // Get the claim first
  const claim = await getClaimById(claimId);

  if (!claim) {
    throw new Error("Claim not found");
  }

  if (claim.status !== "pending") {
    throw new Error("Claim has already been reviewed");
  }

  // Update the claim status
  await db
    .update(clinicClaims)
    .set({
      status: "rejected",
      rejectionReason,
      reviewedAt: new Date(),
      reviewedBy: reviewerId,
      adminNotes: adminNotes,
    })
    .where(eq(clinicClaims.id, claimId));

  // Send rejection email
  await sendClaimRejectedEmail(
    claim.businessEmail,
    claim.clinic.title,
    rejectionReason,
    {
      userId: claim.userId,
      clinicId: claim.clinicId,
      claimId,
    }
  );

  return {
    success: true,
    claimId,
    clinicId: claim.clinicId,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a clinic is already claimed
 */
export async function isClinicClaimed(clinicId: string): Promise<boolean> {
  const [clinic] = await db
    .select({ ownerUserId: clinics.ownerUserId })
    .from(clinics)
    .where(eq(clinics.id, clinicId))
    .limit(1);

  return !!clinic?.ownerUserId;
}

/**
 * Get claim history for a clinic (for admin review)
 */
export async function getClinicClaimHistory(clinicId: string) {
  const claims = await db
    .select({
      id: clinicClaims.id,
      userId: clinicClaims.userId,
      fullName: clinicClaims.fullName,
      businessEmail: clinicClaims.businessEmail,
      status: clinicClaims.status,
      createdAt: clinicClaims.createdAt,
      reviewedAt: clinicClaims.reviewedAt,
      rejectionReason: clinicClaims.rejectionReason,
    })
    .from(clinicClaims)
    .where(eq(clinicClaims.clinicId, clinicId))
    .orderBy(desc(clinicClaims.createdAt));

  return claims;
}

/**
 * Get claims count by status (for admin dashboard)
 */
export async function getClaimsCountByStatus() {
  const result = await db
    .select({
      status: clinicClaims.status,
      count: sql<number>`count(*)::int`,
    })
    .from(clinicClaims)
    .groupBy(clinicClaims.status);

  const counts = {
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
    total: 0,
  };

  for (const row of result) {
    if (row.status in counts) {
      counts[row.status as keyof typeof counts] = row.count;
    }
    counts.total += row.count;
  }

  return counts;
}

// ============================================
// Delete Claims (Admin)
// ============================================

/**
 * Delete claims by IDs (admin only)
 * This removes claim records from the database - use for cleanup of old/test data
 */
export async function deleteClaims(claimIds: string[]) {
  if (claimIds.length === 0) {
    return { deleted: 0 };
  }

  const result = await db
    .delete(clinicClaims)
    .where(inArray(clinicClaims.id, claimIds))
    .returning({ id: clinicClaims.id });

  return { deleted: result.length };
}
