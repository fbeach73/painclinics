import { eq } from "drizzle-orm"
import { db } from "./db"
import * as schema from "./schema"
import { sendFeaturedConfirmedEmail, sendPaymentFailedEmail } from "./email"

// Webhook payload types - using 'unknown' to avoid type compatibility issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WebhookPayload = any

function determineTier(productId: string): "basic" | "premium" {
  const basicProductId = process.env.POLAR_BASIC_PRODUCT_ID
  const premiumProductId = process.env.POLAR_PREMIUM_PRODUCT_ID

  if (productId === premiumProductId) {
    return "premium"
  }
  if (productId === basicProductId) {
    return "basic"
  }
  // Default to basic if product ID doesn't match
  return "basic"
}

export async function handleSubscriptionActive(payload: WebhookPayload) {
  const { data } = payload
  const metadata = data.metadata as { clinicId?: string; userId?: string } | undefined
  const clinicId = metadata?.clinicId
  const userId = metadata?.userId

  if (!clinicId || !userId) {
    console.error("[Polar Webhook] Missing clinicId or userId in metadata")
    return
  }

  const tier = determineTier(data.product.id)
  const endDate = new Date(data.currentPeriodEnd)

  try {
    // Check if subscription already exists
    const existingSubscription = await db.query.featuredSubscriptions.findFirst(
      {
        where: eq(
          schema.featuredSubscriptions.polarSubscriptionId,
          data.id
        ),
      }
    )

    if (existingSubscription) {
      // Update existing subscription
      await db
        .update(schema.featuredSubscriptions)
        .set({
          status: "active",
          tier,
          endDate,
          updatedAt: new Date(),
        })
        .where(eq(schema.featuredSubscriptions.id, existingSubscription.id))
    } else {
      // Create new subscription record
      await db.insert(schema.featuredSubscriptions).values({
        clinicId,
        userId,
        polarSubscriptionId: data.id,
        polarCustomerId: data.customerId,
        polarProductId: data.product.id,
        tier,
        billingCycle: "monthly", // Determine from product if needed
        status: "active",
        startDate: new Date(data.currentPeriodStart),
        endDate,
      })
    }

    // Update clinic featured status
    await db
      .update(schema.clinics)
      .set({
        isFeatured: true,
        featuredTier: tier,
        featuredUntil: endDate,
      })
      .where(eq(schema.clinics.id, clinicId))

    // Get clinic for email
    const clinic = await db.query.clinics.findFirst({
      where: eq(schema.clinics.id, clinicId),
    })

    // Send confirmation email - get customer email from metadata or subscription
    if (clinic) {
      // Try to get email from user record
      const user = await db.query.user.findFirst({
        where: eq(schema.user.id, userId),
      })
      if (user?.email) {
        await sendFeaturedConfirmedEmail(user.email, clinic.title, tier)
      }
    }
  } catch (error) {
    console.error("[Polar Webhook] Error handling subscription active:", error)
    throw error
  }
}

export async function handleSubscriptionCanceled(payload: WebhookPayload) {
  const { data } = payload

  try {
    // Find the subscription by Polar subscription ID
    const subscription = await db.query.featuredSubscriptions.findFirst({
      where: eq(
        schema.featuredSubscriptions.polarSubscriptionId,
        data.id
      ),
    })

    if (!subscription) {
      console.error("[Polar Webhook] Subscription not found:", data.id)
      return
    }

    // Update subscription status - keep featured until end of period
    await db
      .update(schema.featuredSubscriptions)
      .set({
        status: "canceled",
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.featuredSubscriptions.id, subscription.id))

    // Note: We don't remove featured status immediately
    // A scheduled job should check featuredUntil dates and expire features
  } catch (error) {
    console.error(
      "[Polar Webhook] Error handling subscription canceled:",
      error
    )
    throw error
  }
}

export async function handleOrderPaid(payload: WebhookPayload) {
  const { data } = payload

  try {
    // Find the subscription by Polar subscription ID
    const subscriptionInfo = data.subscription
    if (!subscriptionInfo?.id) {
      return
    }

    const subscription = await db.query.featuredSubscriptions.findFirst({
      where: eq(
        schema.featuredSubscriptions.polarSubscriptionId,
        subscriptionInfo.id
      ),
    })

    if (!subscription) {
      return
    }

    // For renewals, the subscription active webhook will handle the update
    // This is mostly for logging/analytics
  } catch (error) {
    console.error("[Polar Webhook] Error handling order paid:", error)
    throw error
  }
}

export async function handlePaymentFailed(email: string, clinicId: string) {
  try {
    const clinic = await db.query.clinics.findFirst({
      where: eq(schema.clinics.id, clinicId),
    })

    if (clinic) {
      await sendPaymentFailedEmail(email, clinic.title)
    }
  } catch (error) {
    console.error("[Polar Webhook] Error handling payment failed:", error)
  }
}
