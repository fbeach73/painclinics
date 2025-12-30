# Implementation Plan: Checkpoint Review Fixes

## Overview

Fix security vulnerabilities, payment reliability issues, and code quality problems identified in the checkpoint review. Implementation is organized by priority: critical security fixes first, then payment reliability, then code quality improvements.

---

## Phase 1: Critical Security Fixes ✅

Eliminate security vulnerabilities that could be exploited in production.

### Tasks

- [x] Remove hardcoded fallback secret from revalidation endpoint
- [x] Add webhook events table to database schema for idempotency tracking
- [x] Implement webhook idempotency check in stripe-webhooks.ts
- [x] Add payment failure event handlers (invoice.payment_failed, customer.subscription.updated)

### Technical Details

**Revalidation endpoint fix** (`src/app/api/revalidate/route.ts`):
```typescript
// BEFORE (insecure):
const expectedSecret = process.env.REVALIDATE_SECRET || "painclinics-revalidate-2024";

// AFTER (secure):
const expectedSecret = process.env.REVALIDATE_SECRET;
if (!expectedSecret) {
  console.error("REVALIDATE_SECRET environment variable is not set");
  return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
}
```

**Webhook events table** (`src/lib/schema.ts`):
```typescript
export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  stripeEventId: text("stripe_event_id").unique().notNull(),
  eventType: text("event_type").notNull(),
  status: text("status").notNull(), // 'processed', 'failed', 'skipped'
  processedAt: timestamp("processed_at").defaultNow(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**Idempotency check** (`src/lib/stripe-webhooks.ts`):
```typescript
// At start of webhook handler:
const existingEvent = await db.query.webhookEvents.findFirst({
  where: eq(webhookEvents.stripeEventId, event.id)
});
if (existingEvent) {
  console.log(`Webhook ${event.id} already processed, skipping`);
  return;
}

// After successful processing:
await db.insert(webhookEvents).values({
  stripeEventId: event.id,
  eventType: event.type,
  status: "processed",
});
```

**Payment failure handlers** (`src/lib/stripe-webhooks.ts`):
```typescript
// Add to onEvent handler:
if (event.type === "invoice.payment_failed") {
  await handleInvoicePaymentFailed(event);
}
if (event.type === "customer.subscription.updated") {
  await handleSubscriptionUpdated(event);
}

// Handler implementations:
async function handleInvoicePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = invoice.subscription as string;

  // Update subscription status to past_due
  await db.update(schema.featuredSubscriptions)
    .set({ status: "past_due" })
    .where(eq(schema.featuredSubscriptions.stripeSubscriptionId, subscriptionId));

  // Send payment failed email
  // ... email logic
}
```

**Database migration command**:
```bash
pnpm db:push
```

---

## Phase 2: Payment Reliability ✅

Add safeguards to prevent duplicate charges and improve checkout reliability.

### Tasks

- [x] Add idempotency keys to checkout session creation
- [x] Add Stripe environment variable validation to env.ts
- [x] Fix pricing display in admin subscriptions page

### Technical Details

**Idempotency key** (`src/app/api/checkout/create-session/route.ts`):
```typescript
// Generate idempotency key before creating session
const idempotencyKey = `checkout-${clinicId}-${userId}-${Date.now()}`;

const checkoutSession = await stripe.checkout.sessions.create(
  {
    customer: stripeCustomerId,
    // ... other options
  },
  {
    idempotencyKey,
  }
);
```

**Stripe env validation** (`src/lib/env.ts`):
```typescript
// Add to serverSchema:
STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
STRIPE_BASIC_MONTHLY_PRICE_ID: z.string().startsWith("price_").optional(),
STRIPE_BASIC_ANNUAL_PRICE_ID: z.string().startsWith("price_").optional(),
STRIPE_PREMIUM_MONTHLY_PRICE_ID: z.string().startsWith("price_").optional(),
STRIPE_PREMIUM_ANNUAL_PRICE_ID: z.string().startsWith("price_").optional(),
```

**Admin pricing fix** (`src/app/admin/subscriptions/page.tsx`):
- Current incorrect text: `$99/mo or $990/yr`
- Should be: Basic `$49.50/mo or $495/yr`, Premium `$99.50/mo or $995/yr`
- Create shared pricing constant if not exists

**File paths**:
- `src/app/api/checkout/create-session/route.ts` - Add idempotency
- `src/lib/env.ts` - Add Stripe validation
- `src/app/admin/subscriptions/page.tsx` - Fix pricing display

---

## Phase 3: Code Quality Improvements ✅

Replace console statements with proper logging and fix incomplete implementations.

### Tasks

- [x] Remove or replace console.error in error.tsx with proper error boundary logging
- [x] Remove console.error from revalidate route (already has return statements)
- [x] Keep env.ts console statements (only run at startup, acceptable)
- [x] Fix profile page - either implement edit API or remove edit button

### Technical Details

**Error boundary** (`src/app/error.tsx`):
```typescript
// BEFORE:
useEffect(() => {
  console.error("Application error:", error);
}, [error]);

// AFTER: Remove console.error, error is already passed to error boundary
// Optionally add Sentry or similar:
useEffect(() => {
  // Optional: Report to error tracking service
  // Sentry.captureException(error);
}, [error]);
```

**Revalidate route** (`src/app/api/revalidate/route.ts`):
```typescript
// Lines 32 and 66 - Remove console.error statements
// The route already returns proper error responses
// If logging is needed, use a logging service
```

**Profile page options** (`src/app/profile/page.tsx`):

Option A - Remove edit functionality (simpler):
```typescript
// Remove the edit button and edit dialog entirely
// Remove handleEditProfileSubmit function
// Keep profile as read-only display
```

Option B - Implement edit API (more work):
```typescript
// Create /api/user/profile/route.ts with PATCH method
// Update handleEditProfileSubmit to call API
// Add proper form validation
```

**Recommendation**: Option A (remove edit) - profile edits can be added as a future feature with proper requirements.

**File paths**:
- `src/app/error.tsx` - Line 16
- `src/app/api/revalidate/route.ts` - Lines 32, 66
- `src/app/profile/page.tsx` - Lines 60-61 and related edit UI

---

## Phase 4: Webhook Event Persistence (Enhancement) ✅

Add comprehensive webhook audit trail for debugging payment issues.

### Tasks

- [x] Record all webhook events (not just successful ones)
- [x] Add error logging for failed webhook processing
- [x] Add admin endpoint to view webhook history (optional)

### Technical Details

**Enhanced webhook logging** (`src/lib/stripe-webhooks.ts`):
```typescript
async function processWebhook(event: Stripe.Event) {
  try {
    // Check idempotency first
    const existing = await db.query.webhookEvents.findFirst({
      where: eq(webhookEvents.stripeEventId, event.id)
    });
    if (existing) return { status: "skipped", reason: "already_processed" };

    // Process the event
    await handleEvent(event);

    // Record success
    await db.insert(webhookEvents).values({
      stripeEventId: event.id,
      eventType: event.type,
      status: "processed",
    });

    return { status: "processed" };
  } catch (error) {
    // Record failure
    await db.insert(webhookEvents).values({
      stripeEventId: event.id,
      eventType: event.type,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });

    throw error; // Re-throw so Stripe retries
  }
}
```

**Admin webhook history** (optional, `src/app/api/admin/webhooks/route.ts`):
```typescript
export async function GET(request: NextRequest) {
  // Auth check...

  const events = await db.query.webhookEvents.findMany({
    orderBy: [desc(webhookEvents.createdAt)],
    limit: 100,
  });

  return NextResponse.json({ events });
}
```

---

## Summary

| Phase | Priority | Est. Effort | Files Changed |
|-------|----------|-------------|---------------|
| 1 | Critical | Medium | 3 files + migration |
| 2 | High | Low | 3 files |
| 3 | Medium | Low | 3 files |
| 4 | Low | Low | 1-2 files |

**Total files to modify**: 8-9 files
**New files**: 1 (optional admin webhook endpoint)
**Database changes**: 1 new table (webhook_events)
