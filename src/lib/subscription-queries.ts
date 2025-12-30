import { eq, and, desc, sql, gte } from "drizzle-orm"
import { db } from "./db"
import * as schema from "./schema"

export interface SubscriptionSummary {
  totalActive: number
  totalBasic: number
  totalPremium: number
  mrr: number
}

export async function getSubscriptionForClinic(clinicId: string) {
  return db.query.featuredSubscriptions.findFirst({
    where: and(
      eq(schema.featuredSubscriptions.clinicId, clinicId),
      eq(schema.featuredSubscriptions.status, "active")
    ),
  })
}

export async function getSubscriptionById(subscriptionId: string) {
  return db.query.featuredSubscriptions.findFirst({
    where: eq(schema.featuredSubscriptions.id, subscriptionId),
    with: {
      clinic: true,
      user: true,
    },
  })
}

export async function getAllActiveSubscriptions() {
  return db.query.featuredSubscriptions.findMany({
    where: eq(schema.featuredSubscriptions.status, "active"),
    with: {
      clinic: true,
      user: true,
    },
    orderBy: desc(schema.featuredSubscriptions.createdAt),
  })
}

export async function getSubscriptionsForUser(userId: string) {
  return db.query.featuredSubscriptions.findMany({
    where: eq(schema.featuredSubscriptions.userId, userId),
    with: {
      clinic: true,
    },
    orderBy: desc(schema.featuredSubscriptions.createdAt),
  })
}

export async function getSubscriptionSummary(): Promise<SubscriptionSummary> {
  const activeSubscriptions = await db.query.featuredSubscriptions.findMany({
    where: eq(schema.featuredSubscriptions.status, "active"),
  })

  const totalActive = activeSubscriptions.length
  const totalBasic = activeSubscriptions.filter((s) => s.tier === "basic").length
  const totalPremium = activeSubscriptions.filter((s) => s.tier === "premium").length

  // Calculate MRR
  // Basic: $49.50/month, Premium: $99.50/month
  // Annual subscriptions: Basic $495/year ($41.25/month), Premium $995/year ($82.92/month)
  const mrr = activeSubscriptions.reduce((total, sub) => {
    if (sub.tier === "premium") {
      return total + (sub.billingCycle === "annual" ? 82.92 : 99.5)
    }
    if (sub.tier === "basic") {
      return total + (sub.billingCycle === "annual" ? 41.25 : 49.5)
    }
    return total
  }, 0)

  return {
    totalActive,
    totalBasic,
    totalPremium,
    mrr: Math.round(mrr * 100) / 100,
  }
}

export async function createSubscription(data: {
  clinicId: string
  userId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  stripePriceId: string
  tier: "basic" | "premium"
  billingCycle: "monthly" | "annual"
  startDate: Date
  endDate: Date
}) {
  const [subscription] = await db
    .insert(schema.featuredSubscriptions)
    .values({
      ...data,
      status: "active",
    })
    .returning()

  return subscription
}

export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: "active" | "canceled" | "past_due" | "expired",
  canceledAt?: Date
) {
  const [updated] = await db
    .update(schema.featuredSubscriptions)
    .set({
      status,
      canceledAt,
      updatedAt: new Date(),
    })
    .where(eq(schema.featuredSubscriptions.id, subscriptionId))
    .returning()

  return updated
}

export async function getExpiringSubscriptions(daysAhead: number = 7) {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  return db.query.featuredSubscriptions.findMany({
    where: and(
      eq(schema.featuredSubscriptions.status, "active"),
      sql`${schema.featuredSubscriptions.endDate} <= ${futureDate}`,
      gte(schema.featuredSubscriptions.endDate, new Date())
    ),
    with: {
      clinic: true,
      user: true,
    },
  })
}

export async function expireSubscription(subscriptionId: string) {
  const [expired] = await db
    .update(schema.featuredSubscriptions)
    .set({
      status: "expired",
      updatedAt: new Date(),
    })
    .where(eq(schema.featuredSubscriptions.id, subscriptionId))
    .returning()

  // Also update the clinic's featured status
  if (expired) {
    await db
      .update(schema.clinics)
      .set({
        isFeatured: false,
        featuredTier: "none",
        featuredUntil: null,
      })
      .where(eq(schema.clinics.id, expired.clinicId))
  }

  return expired
}

export async function checkAndExpireSubscriptions() {
  const now = new Date()

  // Find all active subscriptions that have passed their end date
  const expiredSubscriptions = await db.query.featuredSubscriptions.findMany({
    where: and(
      eq(schema.featuredSubscriptions.status, "active"),
      sql`${schema.featuredSubscriptions.endDate} < ${now}`
    ),
  })

  for (const subscription of expiredSubscriptions) {
    await expireSubscription(subscription.id)
  }

  return expiredSubscriptions.length
}
