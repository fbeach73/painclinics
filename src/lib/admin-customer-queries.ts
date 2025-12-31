import { eq, and, desc } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export type CustomerWithDetails = {
  subscriptionId: string;
  clinicId: string;
  clinicName: string;
  clinicPermalink: string;
  clinicCity: string;
  clinicState: string;
  ownerName: string | null;
  ownerEmail: string;
  ownerImage: string | null;
  tier: "basic" | "premium" | "none";
  status: "active" | "canceled" | "past_due" | "expired";
  billingCycle: "monthly" | "annual" | null;
  startDate: Date;
  endDate: Date | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  claimedAt: Date | null;
};

export type CustomerCounts = {
  all: number;
  active: number;
  canceled: number;
  past_due: number;
  expired: number;
};

export async function getAllCustomers(filters?: {
  status?: string;
}): Promise<CustomerWithDetails[]> {
  const subscriptions = await db.query.featuredSubscriptions.findMany({
    where: filters?.status && filters.status !== "all"
      ? eq(schema.featuredSubscriptions.status, filters.status)
      : undefined,
    with: {
      clinic: true,
      user: true,
    },
    orderBy: desc(schema.featuredSubscriptions.createdAt),
  });

  return subscriptions.map((sub) => ({
    subscriptionId: sub.id,
    clinicId: sub.clinicId,
    clinicName: sub.clinic?.title || "Unknown Clinic",
    clinicPermalink: sub.clinic?.permalink || "",
    clinicCity: sub.clinic?.city || "",
    clinicState: sub.clinic?.state || "",
    ownerName: sub.user?.name || null,
    ownerEmail: sub.user?.email || "",
    ownerImage: sub.user?.image || null,
    tier: sub.tier as "basic" | "premium" | "none",
    status: sub.status as "active" | "canceled" | "past_due" | "expired",
    billingCycle: sub.billingCycle as "monthly" | "annual" | null,
    startDate: sub.startDate,
    endDate: sub.endDate,
    stripeSubscriptionId: sub.stripeSubscriptionId,
    stripeCustomerId: sub.stripeCustomerId,
    claimedAt: sub.clinic?.claimedAt || null,
  }));
}

export async function getCustomerCounts(): Promise<CustomerCounts> {
  const subscriptions = await db.query.featuredSubscriptions.findMany({
    columns: {
      status: true,
    },
  });

  const counts = {
    all: subscriptions.length,
    active: 0,
    canceled: 0,
    past_due: 0,
    expired: 0,
  };

  for (const sub of subscriptions) {
    const status = sub.status as keyof Omit<CustomerCounts, "all">;
    if (status in counts) {
      counts[status]++;
    }
  }

  return counts;
}

export async function cancelSubscription(
  subscriptionId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Get subscription with stripeSubscriptionId
  const subscription = await db.query.featuredSubscriptions.findFirst({
    where: eq(schema.featuredSubscriptions.id, subscriptionId),
    with: {
      clinic: true,
    },
  });

  if (!subscription) {
    return { success: false, error: "Subscription not found" };
  }

  if (subscription.status !== "active") {
    return { success: false, error: "Subscription is not active" };
  }

  // 2. Cancel in Stripe if there's a Stripe subscription
  if (subscription.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    } catch (stripeError) {
      console.error("[Admin] Stripe cancellation error:", stripeError);
      return { success: false, error: "Failed to cancel in Stripe" };
    }
  }

  // 3. Update database record
  await db
    .update(schema.featuredSubscriptions)
    .set({
      status: "canceled",
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.featuredSubscriptions.id, subscriptionId));

  // 4. Update clinic featured status
  if (subscription.clinicId) {
    await db
      .update(schema.clinics)
      .set({
        isFeatured: false,
        featuredTier: "none",
        featuredUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.clinics.id, subscription.clinicId));
  }

  // 5. Log admin action
  console.warn(`[Admin] Subscription ${subscriptionId} canceled by admin ${adminId}`);

  return { success: true };
}

export async function reverseClinicClaim(
  clinicId: string,
  adminId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Get clinic to verify it exists and is claimed
  const clinic = await db.query.clinics.findFirst({
    where: eq(schema.clinics.id, clinicId),
  });

  if (!clinic) {
    return { success: false, error: "Clinic not found" };
  }

  if (!clinic.ownerUserId) {
    return { success: false, error: "Clinic is not claimed" };
  }

  // 2. Update clinic: ownerUserId = null, isVerified = false, claimedAt = null
  await db
    .update(schema.clinics)
    .set({
      ownerUserId: null,
      isVerified: false,
      claimedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(schema.clinics.id, clinicId));

  // 3. Update any approved claims for this clinic to "expired"
  await db
    .update(schema.clinicClaims)
    .set({
      status: "expired",
      adminNotes: reason || `Claim reversed by admin on ${new Date().toISOString()}`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.clinicClaims.clinicId, clinicId),
        eq(schema.clinicClaims.status, "approved")
      )
    );

  // 4. Log admin action
  console.warn(`[Admin] Clinic ${clinicId} claim reversed by admin ${adminId}. Reason: ${reason || "No reason provided"}`);

  return { success: true };
}

export async function getClinicWithOwner(clinicId: string) {
  return db.query.clinics.findFirst({
    where: eq(schema.clinics.id, clinicId),
    with: {
      owner: true,
    },
  });
}
