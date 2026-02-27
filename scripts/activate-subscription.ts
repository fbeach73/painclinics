/**
 * One-off script to manually activate Amir's featured subscription
 * after webhook failure (301 due to www redirect).
 *
 * Run: npx tsx scripts/activate-subscription.ts
 */
import { config } from "dotenv"
config({ path: ".env.local" })

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "../src/lib/schema"
import { eq } from "drizzle-orm"

const client = postgres(process.env.POSTGRES_URL!)
const db = drizzle(client, { schema })

const CLINIC_ID = "m94ma3lx2u50tduhzql1fd6q"
const USER_ID = "OS1BUVr1CFEoCihWIOi47bXhXoUeM0GW"
const STRIPE_SUBSCRIPTION_ID = "sub_1T55WLFnwck6B4DCbLcYYzBu"
const STRIPE_CUSTOMER_ID = "cus_U2uDCtEuLLMe2s"
const STRIPE_PRICE_ID = "price_1SjvoHFnwck6B4DC5zv1DaN8"

async function main() {
  // Check if subscription already exists
  const existing = await db.query.featuredSubscriptions.findFirst({
    where: eq(schema.featuredSubscriptions.stripeSubscriptionId, STRIPE_SUBSCRIPTION_ID),
  })

  if (existing) {
    console.log("Subscription record already exists:", existing.id, "status:", existing.status)
    if (existing.status === "active") {
      console.log("Already active, skipping insert. Will still update clinic.")
    } else {
      await db
        .update(schema.featuredSubscriptions)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(schema.featuredSubscriptions.id, existing.id))
      console.log("Reactivated existing subscription record")
    }
  } else {
    const startDate = new Date("2026-02-26T14:26:30Z")
    const endDate = new Date("2026-03-26T14:26:30Z")

    await db.insert(schema.featuredSubscriptions).values({
      clinicId: CLINIC_ID,
      userId: USER_ID,
      stripeSubscriptionId: STRIPE_SUBSCRIPTION_ID,
      stripeCustomerId: STRIPE_CUSTOMER_ID,
      stripePriceId: STRIPE_PRICE_ID,
      tier: "basic",
      billingCycle: "monthly",
      status: "active",
      startDate,
      endDate,
    })
    console.log("Created featured_subscriptions record")
  }

  // Update clinic featured status
  await db
    .update(schema.clinics)
    .set({
      isFeatured: true,
      featuredTier: "basic",
      featuredUntil: new Date("2026-03-26T14:26:30Z"),
    })
    .where(eq(schema.clinics.id, CLINIC_ID))

  // Verify
  const clinic = await db.query.clinics.findFirst({
    where: eq(schema.clinics.id, CLINIC_ID),
    columns: { id: true, title: true, isFeatured: true, featuredTier: true, featuredUntil: true },
  })
  console.log("Clinic updated:", clinic)

  await client.end()
  process.exit(0)
}

main().catch(async (err) => {
  console.error("Error:", err)
  await client.end()
  process.exit(1)
})
