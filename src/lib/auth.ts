import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { eq } from "drizzle-orm"
import { db } from "./db"
import * as schema from "./schema"

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
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Auto-promote user to admin if their email matches ADMIN_EMAIL
          const adminEmail = process.env.ADMIN_EMAIL
          if (adminEmail && user.email === adminEmail) {
            await db
              .update(schema.user)
              .set({ role: "admin" })
              .where(eq(schema.user.id, user.id))
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