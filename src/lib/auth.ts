import { betterAuth, type BetterAuthPlugin } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { eq } from "drizzle-orm"
import { db } from "./db"
import * as schema from "./schema"
import { generateUnsubscribeToken, sendWelcomeEmail } from "./email"

// Initialize Polar plugin lazily to avoid import errors when Polar env vars are missing
let polarPlugin: BetterAuthPlugin | null = null

// Initialize Polar plugin synchronously for module-level export
// This won't throw if Polar isn't configured
if (process.env.POLAR_ACCESS_TOKEN) {
  // Polar will be initialized, but we need sync access for betterAuth config
  // Use a simpler approach: only import Polar modules if env var is set
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { polar, checkout, portal, webhooks } = require("@polar-sh/better-auth")
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Polar } = require("@polar-sh/sdk")
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const polarWebhooks = require("./polar-webhooks")

    polarPlugin = polar({
      client: new Polar({
        accessToken: process.env.POLAR_ACCESS_TOKEN,
        server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
      }),
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: process.env.POLAR_BASIC_PRODUCT_ID || "",
              slug: "featured-basic",
            },
            {
              productId: process.env.POLAR_PREMIUM_PRODUCT_ID || "",
              slug: "featured-premium",
            },
          ],
          successUrl: "/my-clinics/{metadata.clinicId}/featured?success=true&checkout_id={CHECKOUT_ID}",
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET || "",
          onSubscriptionActive: polarWebhooks.handleSubscriptionActive,
          onSubscriptionCanceled: polarWebhooks.handleSubscriptionCanceled,
          onOrderPaid: polarWebhooks.handleOrderPaid,
        }),
      ],
    }) as unknown as BetterAuthPlugin
  } catch (error) {
    console.warn("Failed to initialize Polar plugin:", error)
    polarPlugin = null
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
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
  plugins: polarPlugin ? [polarPlugin] : [],
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
