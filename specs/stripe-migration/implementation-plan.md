# Implementation Plan: Stripe Payment Migration

## Overview

Complete replacement of Polar payment processing with Stripe using Better Auth's official Stripe plugin. Includes database schema updates, webhook handlers, checkout flow, and admin dashboard modifications.

---

## Phase 1: Dependencies & Environment Setup

Update project dependencies and configure environment variables.

### Tasks

- [x] Remove Polar packages from project
- [x] Add Stripe packages to project
- [x] Update `.env.example` with new Stripe variables
- [ ] Update `.env.local` with Stripe API keys and price IDs (requires manual setup first)

### Technical Details

**Remove packages:**
```bash
pnpm remove @polar-sh/better-auth @polar-sh/sdk
```

**Add packages:**
```bash
pnpm add @better-auth/stripe stripe@^20.0.0
```

**New environment variables (`.env.example` and `.env.local`):**
```env
# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (create in Stripe Dashboard first)
STRIPE_BASIC_MONTHLY_PRICE_ID=price_...
STRIPE_BASIC_ANNUAL_PRICE_ID=price_...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...
STRIPE_PREMIUM_ANNUAL_PRICE_ID=price_...
```

**Variables to remove:**
- `POLAR_ACCESS_TOKEN`
- `POLAR_WEBHOOK_SECRET`
- `POLAR_BASIC_PRODUCT_ID`
- `POLAR_PREMIUM_PRODUCT_ID`
- `POLAR_BASIC_PROMO_PRODUCT_ID`
- `POLAR_PREMIUM_PROMO_PRODUCT_ID`
- `POLAR_ENVIRONMENT`

---

## Phase 2: Database Schema Migration

Update the `featuredSubscriptions` table to use Stripe field names and add Stripe customer ID to user table.

### Tasks

- [x] Rename Polar fields to Stripe fields in schema.ts
- [x] Add `stripeCustomerId` field to user table
- [x] Update index names for renamed fields
- [x] Push schema changes to database

### Technical Details

**File:** `src/lib/schema.ts`

**Changes to `featuredSubscriptions` table (lines 400-443):**
```typescript
// Change from:
polarSubscriptionId: text("polar_subscription_id").unique(),
polarCustomerId: text("polar_customer_id"),
polarProductId: text("polar_product_id"),

// To:
stripeSubscriptionId: text("stripe_subscription_id").unique(),
stripeCustomerId: text("stripe_customer_id"),
stripePriceId: text("stripe_price_id"),
```

**Update index (line 440):**
```typescript
// Change from:
index("featured_subscriptions_polar_sub_idx").on(table.polarSubscriptionId),

// To:
index("featured_subscriptions_stripe_sub_idx").on(table.stripeSubscriptionId),
```

**Add to `user` table:**
```typescript
stripeCustomerId: text("stripe_customer_id"),
```

**Push changes:**
```bash
pnpm db:push
```

---

## Phase 3: Stripe Webhook Handlers [complex]

Create webhook handlers for Stripe events, porting logic from existing Polar webhooks.

### Tasks

- [x] Create `src/lib/stripe-webhooks.ts` with subscription handlers
  - [x] Implement `handleSubscriptionComplete` function
  - [x] Implement `handleSubscriptionCancel` function
  - [x] Implement `handleInvoicePaid` function
  - [x] Add `determineTier` and `determineBillingCycle` helpers

### Technical Details

**New file:** `src/lib/stripe-webhooks.ts`

**Port logic from:** `src/lib/polar-webhooks.ts`

**Key differences from Polar webhooks:**
- Stripe subscription object structure differs from Polar
- `clinicId` comes from checkout session metadata (not subscription metadata)
- Price ID determines tier/billing cycle (not product ID)

**Handler signatures:**
```typescript
type SubscriptionCompleteParams = {
  event: Stripe.Event
  subscription: {
    id: string
    referenceId: string
    plan: string
    status: string
    stripeSubscriptionId: string
    stripeCustomerId: string
    periodStart: Date
    periodEnd: Date
  }
  stripeSubscription: Stripe.Subscription
  plan: { name: string; priceId: string }
}

export async function handleSubscriptionComplete(params: SubscriptionCompleteParams): Promise<void>
export async function handleSubscriptionCancel(params: SubscriptionCancelParams): Promise<void>
export async function handleInvoicePaid(event: Stripe.Event): Promise<void>
```

**Tier determination:**
```typescript
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
```

**Email functions to call (already exist):**
- `sendFeaturedConfirmedEmail` - on subscription complete
- `sendSubscriptionCanceledEmail` - on subscription cancel
- `sendFeaturedRenewalEmail` - on invoice paid (renewals only)

---

## Phase 4: Server Auth Configuration [complex]

Replace Polar plugin with Stripe plugin in Better Auth configuration.

### Tasks

- [x] Update imports in `src/lib/auth.ts`
- [x] Initialize Stripe client with API version
- [x] Configure Stripe plugin with subscription plans
- [x] Wire up webhook handlers from Phase 3
- [x] Remove all Polar-related code

### Technical Details

**File:** `src/lib/auth.ts`

**New imports:**
```typescript
import { stripe } from "@better-auth/stripe"
import Stripe from "stripe"
import {
  handleSubscriptionComplete,
  handleSubscriptionCancel,
  handleInvoicePaid,
} from "./stripe-webhooks"
```

**Stripe client initialization:**
```typescript
const stripeClient = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-11-17.clover",
    })
  : null
```

**Stripe plugin configuration:**
```typescript
const stripePlugin = stripeClient && process.env.STRIPE_WEBHOOK_SECRET
  ? stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "featured-basic",
            priceId: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID!,
            annualDiscountPriceId: process.env.STRIPE_BASIC_ANNUAL_PRICE_ID,
          },
          {
            name: "featured-premium",
            priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID!,
            annualDiscountPriceId: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID,
          },
        ],
        onSubscriptionComplete: handleSubscriptionComplete,
        onSubscriptionCancel: handleSubscriptionCancel,
      },
      onEvent: async (event) => {
        if (event.type === "invoice.paid") {
          await handleInvoicePaid(event)
        }
      },
    })
  : null
```

**Code to remove:**
- Lines 8-60 (Polar plugin initialization)
- `require("@polar-sh/better-auth")` imports
- `require("@polar-sh/sdk")` imports
- `require("./polar-webhooks")` import

---

## Phase 5: Client Auth Configuration

Update client-side auth to use Stripe plugin methods.

### Tasks

- [x] Replace Polar client import with Stripe client in `src/lib/auth-client.ts`
- [x] Update plugin configuration
- [x] Export `subscription` methods instead of `checkout`/`customer`

### Technical Details

**File:** `src/lib/auth-client.ts`

**Replace entire file content:**
```typescript
import { stripeClient } from "@better-auth/stripe/client"
import { createAuthClient } from "better-auth/react"

const stripeClientPlugin = stripeClient({
  subscription: true,
})

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [stripeClientPlugin],
})

// Type-safe exports
export const { signIn, signOut, signUp, useSession, getSession } = authClient

// Stripe subscription exports
export const subscription = authClient.subscription
```

**Methods available on `subscription`:**
- `upgrade({ plan, annual, successUrl, cancelUrl })` - Start checkout
- `list()` - Get user's subscriptions
- `cancel({ subscriptionId })` - Cancel subscription
- `billingPortal({ returnUrl })` - Open customer portal

---

## Phase 6: Custom Checkout Endpoint [complex]

Create custom API endpoint to pass `clinicId` in Stripe checkout session metadata.

### Tasks

- [x] Create `src/app/api/checkout/create-session/route.ts`
  - [x] Validate authenticated user
  - [x] Get or create Stripe customer
  - [x] Create checkout session with clinic metadata
  - [x] Return checkout URL

### Technical Details

**New file:** `src/app/api/checkout/create-session/route.ts`

**Why needed:** Better Auth Stripe plugin uses `referenceId` (defaults to userId) for subscriptions. We need `clinicId` in metadata for webhook processing.

**Endpoint:** `POST /api/checkout/create-session`

**Request body:**
```typescript
{
  clinicId: string
  plan: "featured-basic" | "featured-premium"
  annual?: boolean
}
```

**Response:**
```typescript
{ url: string } // Stripe checkout URL
```

**Implementation:**
```typescript
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
})

const PLANS = {
  "featured-basic": {
    monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID!,
    annual: process.env.STRIPE_BASIC_ANNUAL_PRICE_ID!,
  },
  "featured-premium": {
    monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID!,
    annual: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID!,
  },
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { clinicId, plan, annual = false } = body

  // Validation...
  // Get or create customer...
  // Create checkout session with metadata...
  // Return { url: checkoutSession.url }
}
```

---

## Phase 7: Checkout Component Updates

Update the featured checkout component to use Stripe methods.

### Tasks

- [x] Update imports in `src/components/owner/featured-checkout.tsx`
- [x] Replace `checkout()` call with fetch to custom endpoint
- [x] Replace `customer.portal()` with `subscription.billingPortal()`
- [x] Update error handling and loading states

### Technical Details

**File:** `src/components/owner/featured-checkout.tsx`

**New import:**
```typescript
import { subscription } from "@/lib/auth-client"
```

**Checkout handler (using custom endpoint):**
```typescript
const handleCheckout = async () => {
  setIsLoading(true)
  try {
    const response = await fetch("/api/checkout/create-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinicId,
        plan: tier === "basic" ? "featured-basic" : "featured-premium",
        annual,
      }),
    })

    const data = await response.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      toast.error("Failed to start checkout")
    }
  } catch (error) {
    toast.error("Failed to start checkout")
  } finally {
    setIsLoading(false)
  }
}
```

**Billing portal handler:**
```typescript
const handleManageSubscription = async () => {
  setIsLoading(true)
  try {
    const { data, error } = await subscription.billingPortal({
      returnUrl: `/my-clinics/${clinicId}/featured`,
    })

    if (data?.url) {
      window.location.href = data.url
    } else {
      toast.error("Failed to open subscription portal")
    }
  } finally {
    setIsLoading(false)
  }
}
```

---

## Phase 8: Subscription Queries Updates

Update database queries to use Stripe field names.

### Tasks

- [x] Update field references in `src/lib/subscription-queries.ts`
- [x] Update `createSubscription` function parameters
- [x] Verify all query functions work with new schema

### Technical Details

**File:** `src/lib/subscription-queries.ts`

**Field name changes throughout file:**
- `polarSubscriptionId` → `stripeSubscriptionId`
- `polarCustomerId` → `stripeCustomerId`
- `polarProductId` → `stripePriceId`

**Update `createSubscription` function:**
```typescript
export async function createSubscription(data: {
  clinicId: string
  userId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  stripePriceId: string
  tier: "basic" | "premium"
  billingCycle: "monthly" | "annual"
  startDate: Date
  endDate: Date
}) {
  // Implementation unchanged, just field names
}
```

---

## Phase 9: Admin Dashboard Updates

Update admin subscriptions page for Stripe.

### Tasks

- [x] Update Stripe dashboard link in `src/app/admin/subscriptions/page.tsx`
- [x] Update help text references from Polar to Stripe
- [x] Update any field references in displayed data

### Technical Details

**File:** `src/app/admin/subscriptions/page.tsx`

**Dashboard link change:**
```typescript
// Change from:
href="https://sandbox.polar.sh/dashboard"

// To:
href="https://dashboard.stripe.com"
```

**Help text updates:**
- Replace "Polar" with "Stripe"
- Update webhook explanation text
- Update any Polar-specific terminology

---

## Phase 10: Documentation & Cleanup

Remove Polar code and update documentation.

### Tasks

- [x] Delete `src/lib/polar-webhooks.ts`
- [x] Update `.env.example` documentation comments
- [x] Update featured pricing page FAQ references
- [x] Run `pnpm lint && pnpm typecheck` to verify
- [x] Test build with `pnpm build`

### Technical Details

**Delete file:**
```bash
rm src/lib/polar-webhooks.ts
```

**Update FAQ in:** `src/app/(owner)/my-clinics/[clinicId]/featured/page.tsx`
- Replace any "Polar" references with "Stripe"
- Update payment processor mentions

**Verification commands:**
```bash
pnpm lint
pnpm typecheck
pnpm build
```

---

## Implementation Order

| Step | Phase | Description | Depends On |
|------|-------|-------------|------------|
| 1 | Phase 1 | Dependencies & Environment | Manual Stripe setup |
| 2 | Phase 2 | Database Schema | Phase 1 |
| 3 | Phase 3 | Webhook Handlers | Phase 2 |
| 4 | Phase 4 | Server Auth Config | Phase 3 |
| 5 | Phase 5 | Client Auth Config | Phase 4 |
| 6 | Phase 6 | Custom Checkout Endpoint | Phase 4 |
| 7 | Phase 7 | Checkout Component | Phase 5, 6 |
| 8 | Phase 8 | Subscription Queries | Phase 2 |
| 9 | Phase 9 | Admin Dashboard | Phase 8 |
| 10 | Phase 10 | Cleanup & Verification | All phases |
