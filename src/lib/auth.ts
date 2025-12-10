import { betterAuth, type BetterAuthPlugin } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { eq } from "drizzle-orm"
import { polar, checkout, portal, webhooks } from "@polar-sh/better-auth"
import { Polar } from "@polar-sh/sdk"
import { db } from "./db"
import * as schema from "./schema"
import {
  handleSubscriptionActive,
  handleSubscriptionCanceled,
  handleOrderPaid,
} from "./polar-webhooks"
import { generateUnsubscribeToken, sendWelcomeEmail } from "./email"

// Initialize Polar client
const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
})

// Create Polar plugin with type assertion to handle version mismatch
const polarPlugin = polar({
  client: polarClient,
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
      secret: process.env.POLAR_WEBHOOK_SECRET!,
      onSubscriptionActive: handleSubscriptionActive,
      onSubscriptionCanceled: handleSubscriptionCanceled,
      onOrderPaid: handleOrderPaid,
    }),
  ],
}) as unknown as BetterAuthPlugin

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
  plugins: [polarPlugin],
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
