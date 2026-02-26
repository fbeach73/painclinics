import { stripe } from "@better-auth/stripe"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { eq } from "drizzle-orm"
import Stripe from "stripe"
import { db } from "./db"
import { generateUnsubscribeToken, sendWelcomeEmail } from "./email"
import * as schema from "./schema"
import {
  handleSubscriptionComplete,
  handleSubscriptionCancel,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleSubscriptionUpdated,
  checkWebhookIdempotency,
  recordWebhookSuccess,
  recordWebhookFailure,
} from "./stripe-webhooks"

// Initialize Stripe client
const stripeClient =
  process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-12-15.clover",
      })
    : null

// Initialize Stripe plugin only if configured
const stripePlugin =
  stripeClient && process.env.STRIPE_WEBHOOK_SECRET
    ? stripe({
        stripeClient,
        stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        createCustomerOnSignUp: true,
        subscription: {
          enabled: true,
          plans: [
            {
              name: "featured-basic",
              priceId: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || "",
              annualDiscountPriceId: process.env.STRIPE_BASIC_ANNUAL_PRICE_ID,
            },
            {
              name: "featured-premium",
              priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || "",
              annualDiscountPriceId: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID,
            },
          ],
          onSubscriptionComplete: handleSubscriptionComplete,
          onSubscriptionCancel: handleSubscriptionCancel,
        },
        onEvent: async (event) => {
          // Check idempotency - skip if already processed
          const alreadyProcessed = await checkWebhookIdempotency(event.id)
          if (alreadyProcessed) {
            console.warn(`[Stripe Webhook] Event ${event.id} already processed, skipping`)
            return // Don't record again, it's already in the database
          }

          try {
            // Track whether this event type is specifically handled
            let isHandled = false

            // Handle different event types
            if (event.type === "checkout.session.completed") {
              // Manual handling for checkout.session.completed since Better Auth
              // internal handler isn't triggering onSubscriptionComplete
              const session = event.data.object as Stripe.Checkout.Session
              if (session.mode === "subscription" && session.subscription && stripeClient) {
                const subscriptionId = typeof session.subscription === "string"
                  ? session.subscription
                  : session.subscription.id
                const stripeSubscription = await stripeClient.subscriptions.retrieve(subscriptionId)

                // Get plan info from subscription metadata or price
                const priceId = stripeSubscription.items.data[0]?.price?.id || ""
                const planName = priceId === process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID ||
                                 priceId === process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID
                  ? "featured-premium" : "featured-basic"

                await handleSubscriptionComplete({
                  event,
                  subscription: {
                    id: stripeSubscription.id,
                    referenceId: session.metadata?.userId || stripeSubscription.metadata?.userId || "",
                    plan: planName,
                    status: stripeSubscription.status,
                    stripeSubscriptionId: stripeSubscription.id,
                    stripeCustomerId: typeof stripeSubscription.customer === "string"
                      ? stripeSubscription.customer
                      : stripeSubscription.customer?.id,
                  },
                  stripeSubscription,
                  plan: { name: planName, priceId },
                })
                isHandled = true
              }
            } else if (event.type === "invoice.paid") {
              await handleInvoicePaid(event)
              isHandled = true
            } else if (event.type === "invoice.payment_failed") {
              await handleInvoicePaymentFailed(event)
              isHandled = true
            } else if (event.type === "customer.subscription.updated") {
              await handleSubscriptionUpdated(event)
              isHandled = true
            } else if (event.type === "customer.subscription.deleted") {
              // Handle subscription deletion/cancellation
              const stripeSubscription = event.data.object as Stripe.Subscription
              await handleSubscriptionCancel({
                event,
                subscription: {
                  id: stripeSubscription.id,
                  referenceId: stripeSubscription.metadata?.userId || "",
                  plan: "",
                  status: stripeSubscription.status,
                  stripeSubscriptionId: stripeSubscription.id,
                },
                stripeSubscription,
              })
              isHandled = true
            }

            // Record ALL events - both handled and unhandled
            // Status is "processed" for handled events, "received" for unhandled
            await recordWebhookSuccess(event.id, event.type, isHandled ? "processed" : "received")

            if (!isHandled) {
              console.warn(`[Stripe Webhook] Event ${event.id} (${event.type}) received but not specifically handled`)
            }
          } catch (error) {
            // Record failure with detailed error information
            const errorMessage = error instanceof Error
              ? `${error.name}: ${error.message}${error.stack ? `\n${error.stack.split('\n').slice(0, 3).join('\n')}` : ''}`
              : "Unknown error"

            console.error(`[Stripe Webhook] Error processing event ${event.id} (${event.type}):`, error)
            await recordWebhookFailure(event.id, event.type, errorMessage)
            throw error // Re-throw so Stripe retries
          }
        },
      })
    : null

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes cache
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: stripePlugin ? [stripePlugin] : [],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Generate unsubscribe token for new users
          return {
            data: {
              ...user,
              unsubscribeToken: generateUnsubscribeToken(),
            },
          }
        },
        after: async (user) => {
          // Auto-promote user to admin if their email matches ADMIN_EMAIL
          const adminEmail = process.env.ADMIN_EMAIL
          if (adminEmail && user.email === adminEmail) {
            await db
              .update(schema.user)
              .set({ role: "admin" })
              .where(eq(schema.user.id, user.id))
          }

          // Send welcome email to new users
          if (user.email) {
            // Get the unsubscribe token we just created
            const unsubscribeToken =
              "unsubscribeToken" in user
                ? (user.unsubscribeToken as string)
                : undefined
            await sendWelcomeEmail(user.email, user.name || "there", {
              userId: user.id,
              unsubscribeToken,
            })
          }
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          // Update last login timestamp
          await db
            .update(schema.user)
            .set({ lastLoginAt: new Date() })
            .where(eq(schema.user.id, session.userId))

          // Check if user should be promoted to admin on each session creation
          // This handles cases where ADMIN_EMAIL is set after user was created
          const adminEmail = process.env.ADMIN_EMAIL
          if (adminEmail) {
            const user = await db.query.user.findFirst({
              where: eq(schema.user.id, session.userId),
            })
            if (user && user.email === adminEmail && user.role !== "admin") {
              await db
                .update(schema.user)
                .set({ role: "admin" })
                .where(eq(schema.user.id, user.id))
            }
          }
        },
      },
    },
  },
})
