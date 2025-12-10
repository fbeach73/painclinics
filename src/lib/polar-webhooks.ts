import { eq } from "drizzle-orm"
import { db } from "./db"
import * as schema from "./schema"
import { sendFeaturedConfirmedEmail, sendPaymentFailedEmail, sendSubscriptionCanceledEmail, sendFeaturedRenewalEmail } from "./email"

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
        await sendFeaturedConfirmedEmail(user.email, clinic.title, tier, {
          userId,
          clinicId,
          unsubscribeToken: user.unsubscribeToken ?? undefined,
        })
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

    // Send subscription canceled email
    const clinic = await db.query.clinics.findFirst({
      where: eq(schema.clinics.id, subscription.clinicId),
    })

    if (clinic && subscription.userId) {
      const user = await db.query.user.findFirst({
        where: eq(schema.user.id, subscription.userId),
      })

      if (user?.email) {
        // Use the subscription endDate or fallback to currentPeriodEnd from webhook
        const endDate = subscription.endDate || new Date(data.currentPeriodEnd || Date.now())
        await sendSubscriptionCanceledEmail(
          user.email,
          clinic.title,
          endDate,
          {
            userId: subscription.userId,
            clinicId: subscription.clinicId,
            subscriptionId: subscription.id,
            unsubscribeToken: user.unsubscribeToken ?? undefined,
          }
        )
      }
    }

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

    // Check if this is a renewal (subscription already existed before this order)
    // The subscription.startDate would be before this order's createdAt for renewals
    const orderCreatedAt = new Date(data.createdAt)
    const isRenewal = subscription.startDate && subscription.startDate < orderCreatedAt

    // Send renewal email for recurring payments (not the first payment)
    if (isRenewal && subscription.userId) {
      const user = await db.query.user.findFirst({
        where: eq(schema.user.id, subscription.userId),
      })

      const clinic = await db.query.clinics.findFirst({
        where: eq(schema.clinics.id, subscription.clinicId),
      })

      if (user?.email && clinic) {
        // Extract payment details from order
        const amount = data.totalAmount
          ? `$${(data.totalAmount / 100).toFixed(2)}`
          : "$9.99"

        // Try to get payment method info - fallback to generic text
        const paymentMethodLast4 = data.paymentMethod?.last4 || "****"

        // Calculate next billing date (add one month for monthly billing)
        const nextBillingDate = subscription.endDate
          ? subscription.endDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "your next billing cycle"

        await sendFeaturedRenewalEmail(
          user.email,
          clinic.title,
          amount,
          paymentMethodLast4,
          nextBillingDate,
          {
            userId: subscription.userId,
            clinicId: subscription.clinicId,
            subscriptionId: subscription.id,
            invoiceUrl: data.invoiceUrl,
            unsubscribeToken: user.unsubscribeToken ?? undefined,
          }
        )
      }
    }
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
      await sendPaymentFailedEmail(email, clinic.title, {
        clinicId,
      })
    }
  } catch (error) {
    console.error("[Polar Webhook] Error handling payment failed:", error)
  }
}
