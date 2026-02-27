/**
 * One-off script to send subscription welcome + admin notification emails
 * for Amir's manually activated subscription.
 *
 * Run: env $(grep -v '^#' .env.local | xargs) npx tsx scripts/send-subscription-emails.ts
 */
import { config } from "dotenv"
config({ path: ".env.local" })

// Override localhost URL for email links
process.env.NEXT_PUBLIC_APP_URL = "https://painclinics.com"

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "../src/lib/schema"
import { eq } from "drizzle-orm"
import {
  sendFeaturedConfirmedEmail,
  sendSubscriptionAdminNotificationEmail,
  sendSubscriptionThankYouEmail,
} from "../src/lib/email"

const client = postgres(process.env.POSTGRES_URL!)
const db = drizzle(client, { schema })

const CLINIC_ID = "m94ma3lx2u50tduhzql1fd6q"
const USER_ID = "OS1BUVr1CFEoCihWIOi47bXhXoUeM0GW"
const STRIPE_SUBSCRIPTION_ID = "sub_1T55WLFnwck6B4DCbLcYYzBu"

async function main() {
  // Set verified badge
  await db
    .update(schema.clinics)
    .set({ isVerified: true })
    .where(eq(schema.clinics.id, CLINIC_ID))
  console.log("Set isVerified=true for clinic")

  const clinic = await db.query.clinics.findFirst({
    where: eq(schema.clinics.id, CLINIC_ID),
    columns: { title: true, permalink: true },
  })
  if (!clinic) throw new Error("Clinic not found")

  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, USER_ID),
    columns: { email: true, unsubscribeToken: true },
  })
  if (!user?.email) throw new Error("User not found")

  const clinicSlug = clinic.permalink.replace(/^pain-management\//, "")

  console.log(`Sending emails for: ${clinic.title} (${clinicSlug})`)
  console.log(`User: ${user.email}`)
  console.log(`APP_URL: ${process.env.NEXT_PUBLIC_APP_URL}`)

  // 1. Featured confirmed (welcome) email to user
  const r1 = await sendFeaturedConfirmedEmail(user.email, clinic.title, "basic", {
    userId: USER_ID,
    clinicId: CLINIC_ID,
    subscriptionId: STRIPE_SUBSCRIPTION_ID,
    unsubscribeToken: user.unsubscribeToken ?? undefined,
  })
  console.log("Featured welcome email:", r1.success ? "SENT" : `FAILED: ${r1.error}`)

  // 2. Admin notification email
  const r2 = await sendSubscriptionAdminNotificationEmail(
    clinic.title,
    clinicSlug,
    "basic",
    "monthly",
    user.email,
    { clinicId: CLINIC_ID, subscriptionId: STRIPE_SUBSCRIPTION_ID }
  )
  console.log("Admin notification email:", r2.success ? "SENT" : `FAILED: ${r2.error}`)

  // 3. Thank you email to user
  const r3 = await sendSubscriptionThankYouEmail(user.email, clinic.title, "basic", {
    userId: USER_ID,
    clinicId: CLINIC_ID,
    subscriptionId: STRIPE_SUBSCRIPTION_ID,
    unsubscribeToken: user.unsubscribeToken ?? undefined,
  })
  console.log("Thank you email:", r3.success ? "SENT" : `FAILED: ${r3.error}`)

  await client.end()
  process.exit(0)
}

main().catch(async (err) => {
  console.error("Error:", err)
  await client.end()
  process.exit(1)
})
