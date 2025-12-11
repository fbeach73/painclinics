import { eq, and, gte, sql } from "drizzle-orm";
import { db } from "./db";
import { claimRateLimits, clinicClaims, clinics } from "./schema";

// ============================================
// Rate Limiting Configuration
// ============================================

const CLAIMS_PER_DAY = 3;
const REJECTION_BLOCK_DAYS = 30;
const RATE_LIMIT_WINDOW_HOURS = 24;

// ============================================
// Rate Limiting Functions
// ============================================

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check if an IP address is allowed to submit a claim
 * Limits to CLAIMS_PER_DAY claims per 24-hour window
 */
export async function checkClaimRateLimit(
  ipAddress: string
): Promise<RateLimitResult> {
  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - RATE_LIMIT_WINDOW_HOURS);

  // Get the rate limit record for this IP
  const [record] = await db
    .select()
    .from(claimRateLimits)
    .where(
      and(
        eq(claimRateLimits.ipAddress, ipAddress),
        gte(claimRateLimits.windowStart, windowStart)
      )
    )
    .limit(1);

  if (!record) {
    // No recent claims from this IP
    const resetAt = new Date();
    resetAt.setHours(resetAt.getHours() + RATE_LIMIT_WINDOW_HOURS);
    return {
      allowed: true,
      remaining: CLAIMS_PER_DAY,
      resetAt,
    };
  }

  const remaining = Math.max(0, CLAIMS_PER_DAY - record.claimCount);
  const resetAt = new Date(record.windowStart);
  resetAt.setHours(resetAt.getHours() + RATE_LIMIT_WINDOW_HOURS);

  return {
    allowed: remaining > 0,
    remaining,
    resetAt,
  };
}

/**
 * Record a claim attempt for rate limiting purposes
 * Should be called after successfully submitting a claim
 */
export async function recordClaimAttempt(ipAddress: string): Promise<void> {
  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - RATE_LIMIT_WINDOW_HOURS);

  // Check if there's an existing record within the window
  const [existing] = await db
    .select()
    .from(claimRateLimits)
    .where(
      and(
        eq(claimRateLimits.ipAddress, ipAddress),
        gte(claimRateLimits.windowStart, windowStart)
      )
    )
    .limit(1);

  if (existing) {
    // Increment the claim count
    await db
      .update(claimRateLimits)
      .set({
        claimCount: sql`${claimRateLimits.claimCount} + 1`,
      })
      .where(eq(claimRateLimits.id, existing.id));
  } else {
    // Create a new rate limit record
    await db.insert(claimRateLimits).values({
      ipAddress,
      claimCount: 1,
      windowStart: new Date(),
    });
  }
}

// ============================================
// User Claim Eligibility
// ============================================

interface EligibilityResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if a user is eligible to claim a specific clinic
 * Checks for:
 * - Clinic not already claimed by another user
 * - User doesn't have a pending claim for this clinic
 * - User wasn't rejected for this clinic within REJECTION_BLOCK_DAYS days
 */
export async function canUserClaimClinic(
  userId: string,
  clinicId: string
): Promise<EligibilityResult> {
  // Check if clinic is already claimed
  const [clinic] = await db
    .select({
      ownerUserId: clinics.ownerUserId,
      isVerified: clinics.isVerified,
    })
    .from(clinics)
    .where(eq(clinics.id, clinicId))
    .limit(1);

  if (!clinic) {
    return {
      allowed: false,
      reason: "Clinic not found",
    };
  }

  if (clinic.ownerUserId) {
    if (clinic.ownerUserId === userId) {
      return {
        allowed: false,
        reason: "You already own this clinic",
      };
    }
    return {
      allowed: false,
      reason: "This clinic has already been claimed by another user",
    };
  }

  // Check for existing pending claim by this user for this clinic
  const [pendingClaim] = await db
    .select()
    .from(clinicClaims)
    .where(
      and(
        eq(clinicClaims.userId, userId),
        eq(clinicClaims.clinicId, clinicId),
        eq(clinicClaims.status, "pending")
      )
    )
    .limit(1);

  if (pendingClaim) {
    return {
      allowed: false,
      reason: "You already have a pending claim for this clinic",
    };
  }

  // Check for recent rejection
  const rejectionBlockDate = new Date();
  rejectionBlockDate.setDate(
    rejectionBlockDate.getDate() - REJECTION_BLOCK_DAYS
  );

  const [recentRejection] = await db
    .select()
    .from(clinicClaims)
    .where(
      and(
        eq(clinicClaims.userId, userId),
        eq(clinicClaims.clinicId, clinicId),
        eq(clinicClaims.status, "rejected"),
        gte(clinicClaims.reviewedAt, rejectionBlockDate)
      )
    )
    .limit(1);

  if (recentRejection) {
    const unblockDate = new Date(recentRejection.reviewedAt!);
    unblockDate.setDate(unblockDate.getDate() + REJECTION_BLOCK_DAYS);
    const daysRemaining = Math.ceil(
      (unblockDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return {
      allowed: false,
      reason: `Your previous claim was rejected. You can submit a new claim in ${daysRemaining} days.`,
    };
  }

  return {
    allowed: true,
  };
}

/**
 * Check if a clinic is currently claimed by any user
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
 * Get all pending claims for a user
 */
export async function getUserPendingClaimsCount(
  userId: string
): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(clinicClaims)
    .where(
      and(eq(clinicClaims.userId, userId), eq(clinicClaims.status, "pending"))
    );

  return result[0]?.count ?? 0;
}
