# Action Required: Stripe Payment Migration

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [ ] **Create Stripe account** - Required for payment processing. Sign up at https://stripe.com and complete business verification.

- [ ] **Create Stripe products and prices** - Navigate to Stripe Dashboard > Products and create:
  - Product: "Featured Listing - Basic"
    - Price: $49.50/month (recurring)
    - Price: $495/year (recurring)
  - Product: "Featured Listing - Premium"
    - Price: $99.50/month (recurring)
    - Price: $995/year (recurring)

- [ ] **Set up Stripe webhook endpoint** - Navigate to Stripe Dashboard > Developers > Webhooks and create endpoint:
  - URL: `https://painclinics.com/api/auth/stripe/webhook`
  - Events to subscribe:
    - `checkout.session.completed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.paid`
    - `invoice.payment_failed`

- [ ] **Collect Stripe API keys** - Navigate to Stripe Dashboard > Developers > API keys and copy:
  - Secret key (starts with `sk_live_` or `sk_test_`)
  - Publishable key (starts with `pk_live_` or `pk_test_`)
  - Webhook signing secret (starts with `whsec_`)

- [ ] **Collect Stripe Price IDs** - After creating products, copy the 4 price IDs for:
  - Basic Monthly
  - Basic Annual
  - Premium Monthly
  - Premium Annual

## During Implementation

- [ ] **Add environment variables to Vercel** - After local testing, add the following to Vercel project settings:
  - `STRIPE_SECRET_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_BASIC_MONTHLY_PRICE_ID`
  - `STRIPE_BASIC_ANNUAL_PRICE_ID`
  - `STRIPE_PREMIUM_MONTHLY_PRICE_ID`
  - `STRIPE_PREMIUM_ANNUAL_PRICE_ID`

## After Implementation

- [ ] **Test checkout flow in Stripe test mode** - Use test card `4242 4242 4242 4242` to verify:
  - Checkout redirects work
  - Webhooks fire correctly
  - Subscription records are created
  - Emails are sent

- [ ] **Switch to Stripe production mode** - After testing:
  - Update webhook endpoint to use live keys
  - Update environment variables in Vercel to production values
  - Verify production webhook is receiving events

- [ ] **Remove Polar environment variables from Vercel** - Clean up old configuration:
  - `POLAR_ACCESS_TOKEN`
  - `POLAR_WEBHOOK_SECRET`
  - `POLAR_BASIC_PRODUCT_ID`
  - `POLAR_PREMIUM_PRODUCT_ID`
  - `POLAR_BASIC_PROMO_PRODUCT_ID`
  - `POLAR_PREMIUM_PROMO_PRODUCT_ID`
  - `POLAR_ENVIRONMENT`

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`
