import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { headers } from "next/headers"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import * as schema from "@/lib/schema"

// Initialize Stripe client
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
    })
  : null

// Price ID mapping for plans
const PLANS = {
  "featured-basic": {
    monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
    annual: process.env.STRIPE_BASIC_ANNUAL_PRICE_ID,
  },
  "featured-premium": {
    monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    annual: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID,
  },
} as const

type PlanName = keyof typeof PLANS

/**
 * POST /api/checkout/create-session
 *
 * Creates a Stripe checkout session for a featured subscription.
 * Includes clinicId in metadata for webhook processing.
 *
 * Request body:
 * - clinicId: string (required) - The clinic to upgrade
 * - plan: "featured-basic" | "featured-premium" (required) - The subscription plan
 * - annual: boolean (optional) - Whether to use annual billing (default: false)
 */
export async function POST(request: NextRequest) {
  // Validate Stripe is configured
  if (!stripe) {
    return NextResponse.json(
      { error: "Payment processing is not configured" },
      { status: 503 }
    )
  }

  // Validate authenticated user
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const userEmail = session.user.email

  // Parse request body
  let body: { clinicId?: string; plan?: string; annual?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    )
  }

  const { clinicId, plan, annual = false } = body

  // Validate required fields
  if (!clinicId) {
    return NextResponse.json(
      { error: "clinicId is required" },
      { status: 400 }
    )
  }

  if (!plan || !["featured-basic", "featured-premium"].includes(plan)) {
    return NextResponse.json(
      { error: "Invalid plan. Must be 'featured-basic' or 'featured-premium'" },
      { status: 400 }
    )
  }

  const planName = plan as PlanName

  // Verify user owns the clinic
  const clinic = await db.query.clinics.findFirst({
    where: eq(schema.clinics.id, clinicId),
    columns: {
      id: true,
      title: true,
      ownerUserId: true,
    },
  })

  if (!clinic) {
    return NextResponse.json({ error: "Clinic not found" }, { status: 404 })
  }

  if (clinic.ownerUserId !== userId) {
    return NextResponse.json(
      { error: "You do not own this clinic" },
      { status: 403 }
    )
  }

  // Get or create Stripe customer
  let stripeCustomerId: string

  // First check if user already has a Stripe customer ID
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, userId),
    columns: {
      id: true,
      stripeCustomerId: true,
      name: true,
    },
  })

  if (user?.stripeCustomerId) {
    stripeCustomerId = user.stripeCustomerId
  } else {
    // Create a new Stripe customer
    try {
      const customerParams: Stripe.CustomerCreateParams = {
        email: userEmail,
        metadata: {
          userId,
        },
      }
      // Only add name if it exists
      if (user?.name) {
        customerParams.name = user.name
      }
      const customer = await stripe.customers.create(customerParams)
      stripeCustomerId = customer.id

      // Save customer ID to user record
      await db
        .update(schema.user)
        .set({ stripeCustomerId: customer.id })
        .where(eq(schema.user.id, userId))
    } catch (error) {
      console.error("[Checkout] Error creating Stripe customer:", error)
      return NextResponse.json(
        { error: "Failed to create customer" },
        { status: 500 }
      )
    }
  }

  // Get the price ID for the selected plan
  const priceId = annual
    ? PLANS[planName].annual
    : PLANS[planName].monthly

  if (!priceId) {
    return NextResponse.json(
      { error: "Price configuration is missing" },
      { status: 500 }
    )
  }

  // Build success and cancel URLs
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const successUrl = `${appUrl}/my-clinics/${clinicId}/featured?success=true`
  const cancelUrl = `${appUrl}/my-clinics/${clinicId}/featured?canceled=true`

  // Create checkout session with clinic metadata
  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          clinicId,
          userId,
          plan: planName,
        },
      },
      metadata: {
        clinicId,
        userId,
        plan: planName,
      },
      allow_promotion_codes: true,
    })

    if (!checkoutSession.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("[Checkout] Error creating checkout session:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
