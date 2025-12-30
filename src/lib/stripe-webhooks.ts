import type Stripe from "stripe"
import { eq } from "drizzle-orm"
import { db } from "./db"
import {
  sendFeaturedConfirmedEmail,
  sendFeaturedRenewalEmail,
  sendSubscriptionCanceledEmail,
  sendPaymentFailedEmail,
  sendSubscriptionAdminNotificationEmail,
  sendSubscriptionThankYouEmail,
} from "./email"
import * as schema from "./schema"

// ============================================
// Webhook Idempotency Functions
// ============================================

/**
 * Check if a webhook event has already been processed
 * Returns true if event was already processed (should skip)
 */
export async function checkWebhookIdempotency(
  eventId: string
): Promise<boolean> {
  const existingEvent = await db.query.webhookEvents.findFirst({
    where: eq(schema.webhookEvents.stripeEventId, eventId),
  })
  return !!existingEvent
}

/**
 * Record a successfully processed webhook event
 * @param status - "processed" for handled events, "received" for unhandled events
 */
export async function recordWebhookSuccess(
  eventId: string,
  eventType: string,
  status: "processed" | "received" = "processed"
): Promise<void> {
  await db.insert(schema.webhookEvents).values({
    stripeEventId: eventId,
    eventType,
    status,
  })
}

/**
 * Record a failed webhook event processing
 */
export async function recordWebhookFailure(
  eventId: string,
  eventType: string,
  errorMessage: string
): Promise<void> {
  await db.insert(schema.webhookEvents).values({
    stripeEventId: eventId,
    eventType,
    status: "failed",
    errorMessage,
  })
}

/**
 * Record a skipped webhook event (already processed)
 */
export async function recordWebhookSkipped(
  eventId: string,
  eventType: string
): Promise<void> {
  // Only record if not already in the database (avoid duplicates)
  const existing = await db.query.webhookEvents.findFirst({
    where: eq(schema.webhookEvents.stripeEventId, eventId),
  })
  if (!existing) {
    await db.insert(schema.webhookEvents).values({
      stripeEventId: eventId,
      eventType,
      status: "skipped",
    })
  }
}

// Helper functions for determining subscription tier and billing cycle
function determineTier(planName: string): "basic" | "premium" {
  return planName === "featured-premium" ? "premium" : "basic"
}

function determineBillingCycle(priceId: string): "monthly" | "annual" {
  const annualPriceIds = [
    process.env.STRIPE_BASIC_ANNUAL_PRICE_ID,
    process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID,
  ]
  return annualPriceIds.includes(priceId) ? "annual" : "monthly"
}

// Helper to get subscription period from Stripe subscription
function getSubscriptionPeriod(stripeSubscription: Stripe.Subscription): {
  start: Date
  end: Date
} {
  // Access the raw subscription object to get period values
  const raw = stripeSubscription as unknown as {
    current_period_start?: number
    current_period_end?: number
  }
  return {
    start: raw.current_period_start
      ? new Date(raw.current_period_start * 1000)
      : new Date(),
    end: raw.current_period_end
      ? new Date(raw.current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }
}

// Types for Better Auth Stripe plugin webhook handlers
// Using generic object types to avoid type mismatch with Better Auth's internal types
type BetterAuthSubscription = {
  id: string
  referenceId: string
  plan: string
  status: string
  stripeSubscriptionId?: string | undefined
  stripeCustomerId?: string | undefined
  periodStart?: Date | undefined
  periodEnd?: Date | undefined
}

type StripePlan = {
  name: string
  priceId?: string | undefined
}

/**
 * Handle subscription.complete event from Better Auth Stripe plugin
 * Called when a new subscription is created via checkout
 */
export async function handleSubscriptionComplete(params: {
  event: Stripe.Event
  subscription: BetterAuthSubscription
  stripeSubscription: Stripe.Subscription
  plan: StripePlan
}): Promise<void> {
  const { subscription, stripeSubscription, plan } = params

  // Get clinicId from checkout session metadata
  // The checkout session is stored in the Stripe subscription's metadata
  const metadata = stripeSubscription.metadata as {
    clinicId?: string
    userId?: string
  }
  const clinicId = metadata?.clinicId
  const userId = subscription.referenceId // Better Auth uses referenceId for user ID

  if (!clinicId) {
    console.error("[Stripe Webhook] Missing clinicId in subscription metadata")
    return
  }

  if (!userId) {
    console.error("[Stripe Webhook] Missing userId (referenceId)")
    return
  }

  // Get Stripe IDs - prefer from subscription object, fallback to stripeSubscription
  const stripeSubscriptionId =
    subscription.stripeSubscriptionId || stripeSubscription.id
  const stripeCustomerId =
    subscription.stripeCustomerId ||
    (typeof stripeSubscription.customer === "string"
      ? stripeSubscription.customer
      : stripeSubscription.customer?.id)

  const period = getSubscriptionPeriod(stripeSubscription)
  const tier = determineTier(plan.name)
  const priceId = plan.priceId || ""
  const billingCycle = determineBillingCycle(priceId)
  const startDate = subscription.periodStart || period.start
  const endDate = subscription.periodEnd || period.end

  try {
    // Check if subscription already exists
    const existingSubscription = await db.query.featuredSubscriptions.findFirst(
      {
        where: eq(
          schema.featuredSubscriptions.stripeSubscriptionId,
          stripeSubscriptionId
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
          billingCycle,
          endDate,
          updatedAt: new Date(),
        })
        .where(eq(schema.featuredSubscriptions.id, existingSubscription.id))
    } else {
      // Create new subscription record
      await db.insert(schema.featuredSubscriptions).values({
        clinicId,
        userId,
        stripeSubscriptionId,
        stripeCustomerId,
        stripePriceId: priceId,
        tier,
        billingCycle,
        status: "active",
        startDate,
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

    // Get clinic and user for confirmation email
    const clinic = await db.query.clinics.findFirst({
      where: eq(schema.clinics.id, clinicId),
    })

    if (clinic) {
      const user = await db.query.user.findFirst({
        where: eq(schema.user.id, userId),
      })

      if (user?.email) {
        await sendFeaturedConfirmedEmail(user.email, clinic.title, tier, {
          userId,
          clinicId,
          unsubscribeToken: user.unsubscribeToken ?? undefined,
        })

        // Extract slug from permalink (remove "pain-management/" prefix if present)
        const clinicSlug = clinic.permalink.replace(/^pain-management\//, "")

        // Send admin notification email
        await sendSubscriptionAdminNotificationEmail(
          clinic.title,
          clinicSlug,
          tier,
          billingCycle,
          user.email,
          {
            clinicId,
            subscriptionId: stripeSubscriptionId,
          }
        )

        // Send user thank you email
        await sendSubscriptionThankYouEmail(user.email, clinic.title, tier, {
          userId,
          clinicId,
          subscriptionId: stripeSubscriptionId,
          unsubscribeToken: user.unsubscribeToken ?? undefined,
        })
      }
    }

    console.log(
      `[Stripe Webhook] Subscription activated for clinic ${clinicId}, tier: ${tier}`
    )
  } catch (error) {
    console.error(
      "[Stripe Webhook] Error handling subscription complete:",
      error
    )
    throw error
  }
}

/**
 * Handle subscription.cancel event from Better Auth Stripe plugin
 * Called when a subscription is canceled (user cancels or payment fails)
 */
export async function handleSubscriptionCancel(params: {
  event?: Stripe.Event
  subscription: BetterAuthSubscription
  stripeSubscription: Stripe.Subscription
  cancellationDetails?: Stripe.Subscription.CancellationDetails | null
}): Promise<void> {
  const { subscription, stripeSubscription } = params

  // Get Stripe subscription ID - prefer from subscription object, fallback to stripeSubscription
  const stripeSubscriptionId =
    subscription.stripeSubscriptionId || stripeSubscription.id

  try {
    // Find the subscription by Stripe subscription ID
    const dbSubscription = await db.query.featuredSubscriptions.findFirst({
      where: eq(
        schema.featuredSubscriptions.stripeSubscriptionId,
        stripeSubscriptionId
      ),
    })

    if (!dbSubscription) {
      console.error(
        "[Stripe Webhook] Subscription not found:",
        stripeSubscriptionId
      )
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
      .where(eq(schema.featuredSubscriptions.id, dbSubscription.id))

    // Send subscription canceled email
    const clinic = await db.query.clinics.findFirst({
      where: eq(schema.clinics.id, dbSubscription.clinicId),
    })

    if (clinic && dbSubscription.userId) {
      const user = await db.query.user.findFirst({
        where: eq(schema.user.id, dbSubscription.userId),
      })

      if (user?.email) {
        // Use the subscription endDate or periodEnd from webhook or stripeSubscription
        const period = getSubscriptionPeriod(stripeSubscription)
        const endDate =
          dbSubscription.endDate || subscription.periodEnd || period.end
        await sendSubscriptionCanceledEmail(user.email, clinic.title, endDate, {
          userId: dbSubscription.userId,
          clinicId: dbSubscription.clinicId,
          subscriptionId: dbSubscription.id,
          unsubscribeToken: user.unsubscribeToken ?? undefined,
        })
      }
    }

    console.log(
      `[Stripe Webhook] Subscription canceled for clinic ${dbSubscription.clinicId}`
    )

    // Note: We don't remove featured status immediately
    // A scheduled job should check featuredUntil dates and expire features
  } catch (error) {
    console.error(
      "[Stripe Webhook] Error handling subscription cancel:",
      error
    )
    throw error
  }
}

/**
 * Handle invoice.paid event from Stripe
 * Called when an invoice is paid (including renewals)
 */
export async function handleInvoicePaid(event: Stripe.Event): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice

  // In Stripe SDK v20+, subscription is accessed via parent.subscription_details
  const subscriptionDetails = invoice.parent?.subscription_details
  if (!subscriptionDetails?.subscription) {
    return
  }

  const stripeSubscriptionId =
    typeof subscriptionDetails.subscription === "string"
      ? subscriptionDetails.subscription
      : subscriptionDetails.subscription.id

  try {
    // Find the subscription by Stripe subscription ID
    const subscription = await db.query.featuredSubscriptions.findFirst({
      where: eq(
        schema.featuredSubscriptions.stripeSubscriptionId,
        stripeSubscriptionId
      ),
    })

    if (!subscription) {
      // This might be a new subscription - handled by onSubscriptionComplete
      return
    }

    // Check if this is a renewal (subscription already existed before this invoice)
    // billing_reason tells us if this is renewal, subscription_create, etc.
    const isRenewal =
      invoice.billing_reason === "subscription_cycle" ||
      invoice.billing_reason === "subscription_update"

    if (!isRenewal) {
      // Initial subscription payment is handled by onSubscriptionComplete
      return
    }

    // Update the subscription end date based on the new period
    const lineItems = invoice.lines?.data
    if (lineItems && lineItems.length > 0) {
      const lineItem = lineItems[0]
      if (lineItem?.period?.end) {
        const newEndDate = new Date(lineItem.period.end * 1000)
        await db
          .update(schema.featuredSubscriptions)
          .set({
            endDate: newEndDate,
            status: "active",
            updatedAt: new Date(),
          })
          .where(eq(schema.featuredSubscriptions.id, subscription.id))

        // Also update clinic featuredUntil
        await db
          .update(schema.clinics)
          .set({
            featuredUntil: newEndDate,
          })
          .where(eq(schema.clinics.id, subscription.clinicId))
      }
    }

    // Send renewal email
    if (subscription.userId) {
      const user = await db.query.user.findFirst({
        where: eq(schema.user.id, subscription.userId),
      })

      const clinic = await db.query.clinics.findFirst({
        where: eq(schema.clinics.id, subscription.clinicId),
      })

      if (user?.email && clinic) {
        // Format payment amount
        const amount = invoice.amount_paid
          ? `$${(invoice.amount_paid / 100).toFixed(2)}`
          : "$9.99"

        // Get payment method last 4 digits - simplified for reliability
        const paymentMethodLast4 = "****"

        // Calculate next billing date
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
            invoiceUrl: invoice.hosted_invoice_url ?? undefined,
            unsubscribeToken: user.unsubscribeToken ?? undefined,
          }
        )
      }
    }

    console.log(
      `[Stripe Webhook] Invoice paid (renewal) for clinic ${subscription.clinicId}`
    )
  } catch (error) {
    console.error("[Stripe Webhook] Error handling invoice paid:", error)
    throw error
  }
}

/**
 * Handle invoice.payment_failed event from Stripe
 * Called when a recurring payment fails
 */
export async function handleInvoicePaymentFailed(
  event: Stripe.Event
): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice

  // Get subscription ID from invoice
  const subscriptionDetails = invoice.parent?.subscription_details
  if (!subscriptionDetails?.subscription) {
    return
  }

  const stripeSubscriptionId =
    typeof subscriptionDetails.subscription === "string"
      ? subscriptionDetails.subscription
      : subscriptionDetails.subscription.id

  try {
    // Find the subscription by Stripe subscription ID
    const subscription = await db.query.featuredSubscriptions.findFirst({
      where: eq(
        schema.featuredSubscriptions.stripeSubscriptionId,
        stripeSubscriptionId
      ),
    })

    if (!subscription) {
      console.error(
        "[Stripe Webhook] Subscription not found for failed payment:",
        stripeSubscriptionId
      )
      return
    }

    // Update subscription status to past_due
    await db
      .update(schema.featuredSubscriptions)
      .set({
        status: "past_due",
        updatedAt: new Date(),
      })
      .where(eq(schema.featuredSubscriptions.id, subscription.id))

    // Send payment failed email
    if (subscription.userId) {
      const user = await db.query.user.findFirst({
        where: eq(schema.user.id, subscription.userId),
      })

      const clinic = await db.query.clinics.findFirst({
        where: eq(schema.clinics.id, subscription.clinicId),
      })

      if (user?.email && clinic) {
        await sendPaymentFailedEmail(user.email, clinic.title, {
          userId: subscription.userId,
          clinicId: subscription.clinicId,
          subscriptionId: subscription.id,
          unsubscribeToken: user.unsubscribeToken ?? undefined,
        })
      }
    }

    console.log(
      `[Stripe Webhook] Payment failed for clinic ${subscription.clinicId}, status set to past_due`
    )
  } catch (error) {
    console.error(
      "[Stripe Webhook] Error handling invoice payment failed:",
      error
    )
    throw error
  }
}

/**
 * Handle customer.subscription.updated event from Stripe
 * Called when a subscription status changes (e.g., to past_due, unpaid, etc.)
 */
export async function handleSubscriptionUpdated(
  event: Stripe.Event
): Promise<void> {
  const stripeSubscription = event.data.object as Stripe.Subscription
  const stripeSubscriptionId = stripeSubscription.id
  const stripeStatus = stripeSubscription.status

  try {
    // Find the subscription by Stripe subscription ID
    const subscription = await db.query.featuredSubscriptions.findFirst({
      where: eq(
        schema.featuredSubscriptions.stripeSubscriptionId,
        stripeSubscriptionId
      ),
    })

    if (!subscription) {
      // Subscription not in our system - likely handled elsewhere or not a featured subscription
      return
    }

    // Map Stripe status to our status
    let newStatus: "active" | "canceled" | "past_due" | "expired" =
      subscription.status as "active" | "canceled" | "past_due" | "expired"

    switch (stripeStatus) {
      case "active":
      case "trialing":
        newStatus = "active"
        break
      case "past_due":
      case "unpaid":
        newStatus = "past_due"
        break
      case "canceled":
      case "incomplete_expired":
        newStatus = "canceled"
        break
    }

    // Only update if status changed
    if (newStatus !== subscription.status) {
      await db
        .update(schema.featuredSubscriptions)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(schema.featuredSubscriptions.id, subscription.id))

      // If subscription became inactive, update clinic featured status
      if (newStatus === "canceled" || newStatus === "expired") {
        await db
          .update(schema.clinics)
          .set({
            isFeatured: false,
            featuredTier: "none",
            featuredUntil: null,
          })
          .where(eq(schema.clinics.id, subscription.clinicId))
      }

      console.log(
        `[Stripe Webhook] Subscription ${stripeSubscriptionId} status updated to ${newStatus}`
      )
    }
  } catch (error) {
    console.error(
      "[Stripe Webhook] Error handling subscription updated:",
      error
    )
    throw error
  }
}
