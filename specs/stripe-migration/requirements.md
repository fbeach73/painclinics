# Requirements: Stripe Payment Migration

## Overview

Migrate the payment processing system from Polar to Stripe using Better Auth's official Stripe plugin. This enables featured clinic subscriptions with more robust payment infrastructure and better integration with the existing Better Auth setup.

## Background

The Pain Clinics Directory currently uses Polar for handling featured clinic subscriptions (Basic and Premium tiers). The decision to migrate to Stripe is driven by:

- Better Auth's official Stripe plugin provides tighter integration
- Stripe's broader feature set and ecosystem
- More robust webhook handling and customer portal
- Better documentation and community support

## Functional Requirements

### FR-1: Subscription Plans
- Support two tiers: Basic ($49.50/month, $495/year) and Premium ($99.50/month, $995/year)
- Users can subscribe, upgrade, downgrade, and cancel subscriptions
- Subscriptions are associated with specific clinics (not just users)

### FR-2: Checkout Flow
- Authenticated users can initiate checkout for a specific clinic
- Checkout redirects to Stripe Checkout hosted page
- Success redirects back to clinic's featured page with confirmation
- Cancel redirects back to pricing page

### FR-3: Subscription Management
- Users can access Stripe's billing portal to manage payment methods
- Users can cancel subscriptions (remains active until period end)
- Users can view subscription status in their dashboard

### FR-4: Webhook Processing
- Handle `checkout.session.completed` to activate subscriptions
- Handle `customer.subscription.updated` for plan changes
- Handle `customer.subscription.deleted` for cancellations
- Handle `invoice.paid` for renewal notifications
- Handle `invoice.payment_failed` for payment failure alerts

### FR-5: Email Notifications
- Confirmation email when subscription activates
- Renewal email when payment succeeds
- Cancellation email when subscription is canceled
- Payment failure email when charge fails

### FR-6: Admin Dashboard
- View all active subscriptions with MRR calculations
- Link to Stripe Dashboard for detailed management

## Non-Functional Requirements

### NFR-1: Security
- Stripe secret key never exposed to client
- Webhook signatures verified using Stripe's `constructEvent`
- All payment operations server-side only

### NFR-2: Data Integrity
- Database transactions for webhook-triggered updates
- Idempotent webhook processing (handle duplicate events)

### NFR-3: Backward Compatibility
- No existing subscribers to migrate (fresh start)
- Remove all Polar code and dependencies

## Acceptance Criteria

- [ ] New user signup creates Stripe customer automatically
- [ ] Basic plan checkout completes successfully
- [ ] Premium plan checkout completes successfully
- [ ] Annual billing option works correctly
- [ ] Webhook creates `featuredSubscriptions` database record
- [ ] Clinic `isFeatured` and `featuredTier` fields are updated
- [ ] Confirmation email is sent on subscription activation
- [ ] Billing portal opens and allows payment method management
- [ ] Subscription cancellation updates status correctly
- [ ] Cancellation email is sent
- [ ] Renewal payment triggers renewal email
- [ ] Admin dashboard displays subscriptions and MRR
- [ ] All Polar code and dependencies removed
- [ ] `pnpm lint && pnpm typecheck` passes

## Dependencies

- Stripe account with products and prices configured
- Stripe webhook endpoint configured in dashboard
- Environment variables set for API keys and price IDs

## Related Features

- Better Auth authentication system (`src/lib/auth.ts`)
- Featured clinic display (`src/components/clinics/`)
- Clinic owner portal (`src/app/(owner)/my-clinics/`)
