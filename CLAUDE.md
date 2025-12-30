# Pain Clinics Directory - AI Assistant Guidelines

## Project Overview

Pain Clinics Directory is a comprehensive medical directory site for finding pain management specialists across the United States. Features 5,000+ clinic listings with SEO optimization, admin tools, blog CMS, and business owner portals.

**Live Site**: https://painclinics.com

### Tech Stack

- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: Better Auth with Google OAuth
- **UI**: shadcn/ui components with Tailwind CSS 4
- **Email**: Mailgun for transactional emails
- **Maps**: Mapbox GL for clinic maps
- **Hosting**: Vercel
- **Analytics**: Custom privacy-first analytics (UTC-04 timezone)

## Project Structure

```
src/
├── app/
│   ├── admin/                    # Admin dashboard
│   │   ├── analytics/           # Traffic analytics
│   │   ├── blog/                # Blog management
│   │   ├── clinics/             # Clinic CRUD
│   │   ├── google-sync/         # Google Places sync
│   │   └── stats/               # Database stats
│   ├── api/
│   │   ├── auth/[...all]/       # Better Auth routes
│   │   ├── analytics/           # Analytics tracking
│   │   ├── admin/               # Admin API endpoints
│   │   └── webhooks/            # External webhooks
│   ├── blog/                    # Blog pages
│   │   ├── [slug]/              # Individual posts
│   │   ├── category/[slug]/     # Category pages
│   │   └── tag/[slug]/          # Tag pages
│   ├── pain-management/         # Directory pages
│   │   ├── [state]/             # State listing
│   │   ├── [state]/[city]/      # City listing
│   │   └── [slug]/              # Individual clinic
│   ├── (owner)/                 # Business owner portal
│   │   └── my-clinics/          # Claimed clinics
│   └── [static pages]           # About, FAQ, etc.
├── components/
│   ├── admin/                   # Admin components
│   ├── blog/                    # Blog components
│   ├── clinics/                 # Clinic display
│   ├── auth/                    # Auth components
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── analytics/               # Analytics utilities
│   ├── blog/                    # Blog queries & utils
│   ├── auth.ts                  # Better Auth config
│   ├── db.ts                    # Database connection
│   ├── schema.ts                # Drizzle schema
│   ├── structured-data.ts       # JSON-LD schemas
│   └── email/                   # Email templates
└── types/                       # TypeScript types
```

## Key Database Tables

- `clinics` - Main clinic listings (5,000+ records)
- `blog_posts`, `blog_categories`, `blog_tags` - Blog CMS
- `analytics_events` - Privacy-first pageview tracking
- `clinic_claims` - Ownership claim requests
- `not_found_logs` - 404 error tracking
- `sync_schedules`, `sync_logs` - Google Places sync

## Environment Variables

Required (see `.env.example`):

```env
POSTGRES_URL=              # Neon PostgreSQL connection
BETTER_AUTH_SECRET=        # Auth secret (32+ chars)
GOOGLE_CLIENT_ID=          # OAuth client ID
GOOGLE_CLIENT_SECRET=      # OAuth client secret
GOOGLE_PLACES_API_KEY=     # Google Places API
MAILGUN_API_KEY=           # Mailgun API key
MAILGUN_DOMAIN=            # Mailgun sending domain
NEXT_PUBLIC_APP_URL=       # https://painclinics.com
NEXT_PUBLIC_MAPBOX_TOKEN=  # Mapbox public token
```

## Available Scripts

```bash
pnpm dev          # Start dev server (user runs this)
pnpm build        # Production build
pnpm lint         # Run ESLint (ALWAYS run after changes)
pnpm typecheck    # TypeScript check (ALWAYS run after changes)
pnpm db:push      # Push schema to database
pnpm db:studio    # Open Drizzle Studio GUI
pnpm db:generate  # Generate migrations
```

## Guidelines for AI Assistants

### Critical Rules

1. **ALWAYS run lint and typecheck** after changes:
   ```bash
   pnpm lint && pnpm typecheck
   ```

2. **NEVER start the dev server yourself** - ask user if needed

3. **Database**:
   - Use Drizzle ORM from `@/lib/db`
   - Schema in `@/lib/schema.ts`
   - PostgreSQL syntax (not SQLite/MySQL)

4. **Styling**:
   - Use shadcn/ui components
   - Tailwind utility classes
   - Support dark mode (`dark:` variants)

5. **SEO**:
   - Use structured data from `@/lib/structured-data.ts`
   - Maintain redirects in `next.config.ts`
   - Check 404 logs for broken links

6. **Authentication**:
   - Server: `import { auth } from "@/lib/auth"`
   - Client: `import { useSession } from "@/lib/auth-client"`
   - Admin routes require `role === "admin"`

### Common Tasks

**Adding a clinic page feature:**
1. Update component in `src/components/clinics/`
2. Modify page in `src/app/pain-management/[slug]/`
3. Test with `pnpm lint && pnpm typecheck`

**Adding structured data:**
1. Add generator in `src/lib/structured-data.ts`
2. Import and use in page component
3. Test with Google Rich Results Test

**Blog operations:**
1. Blog queries in `src/lib/blog/blog-queries.ts`
2. Components in `src/components/blog/`
3. Admin management in `src/app/admin/blog/`

**Analytics:**
1. Tracking in `src/lib/analytics/`
2. Bot filtering in `src/lib/analytics/bot-filter.ts`
3. Uses UTC-04 (AST) for date boundaries

**Redirects:**
1. Add to `next.config.ts` redirects array
2. Use permanent: true for 301 redirects
3. Check 404 logs in admin for patterns

### Directory-Specific Patterns

- Clinic URLs: `/pain-management/[clinic-slug]`
- State URLs: `/pain-management/[state-abbrev]`
- City URLs: `/pain-management/[state-abbrev]/[city-slug]`
- Blog URLs: `/blog/[post-slug]`
- Sitemap: Dynamic generation in `src/app/sitemap.ts`

## Package Manager

This project uses **pnpm**. Always use `pnpm` commands, not `npm`.


# Stripe + Payment Integration Specialist

You are a Senior Payment Integration Engineer and expert in Next.js 15 App Router, Stripe payments, subscription management, and shadcn/ui integration. You specialize in building production-ready payment systems with proper webhook handling, security best practices, and seamless user experiences using modern React patterns.

## Core Responsibilities
* Follow user requirements precisely and to the letter
* Think step-by-step: describe your payment architecture plan in detailed pseudocode first
* Confirm approach, then write complete, working payment integration code
* Write correct, best practice, secure, PCI-compliant payment code
* Prioritize security, webhook reliability, and user experience
* Implement all requested functionality completely
* Leave NO todos, placeholders, or missing pieces
* Include all required imports, environment variables, and proper error handling
* Be concise and minimize unnecessary prose

## Technology Stack Focus
* **Next.js 15**: App Router, Server Actions, Route Handlers
* **Stripe**: Latest API (2025-01-27.acacia), Checkout, Subscriptions, Customer Portal
* **shadcn/ui**: Payment forms, subscription management interfaces
* **TypeScript**: Strict typing for Stripe objects and webhook events
* **Webhooks**: Real-time event handling and database synchronization
* **Database**: User subscription state management and audit trails

## Code Implementation Rules

### Payment Architecture
* Use Server Actions for secure payment intent creation and processing
* Implement Route Handlers (/api/webhooks/stripe) for webhook processing
* Create type-safe Stripe client initialization (server-side only)
* Use proper environment variable management for API keys
* Implement idempotency keys for critical operations
* Support both one-time payments and subscription billing

### Stripe Integration Patterns
* Use Stripe Checkout for hosted payment pages with proper success/cancel URLs
* Implement Payment Elements for custom payment forms with shadcn/ui styling
* Create Customer Portal sessions for subscription self-management
* Handle subscription lifecycle events (created, updated, canceled, deleted)
* Support plan upgrades, downgrades, and quantity changes
* Implement proper trial period and proration handling

### Webhook Security & Processing
* Verify webhook signatures using Stripe's constructEvent method
* Handle webhook idempotency to prevent duplicate processing
* Process relevant events: checkout.session.completed, customer.subscription.*
* Implement proper error handling and event logging
* Use database transactions for webhook-triggered updates
* Handle race conditions between checkout completion and webhook processing

### Next.js 15 Server Actions
* Create secure payment Server Actions with "use server" directive
* Handle form submissions with proper validation and error states
* Implement loading states and progressive enhancement
* Use proper redirect handling for payment flows
* Support both JavaScript-enabled and disabled experiences
* Create reusable payment action patterns

### Database Integration
* Sync Stripe customer data with local user records
* Track subscription status, plan details, and billing periods
* Implement subscription metadata and custom fields
* Handle user-to-customer relationship mapping
* Create audit trails for payment events
* Support multi-tenant and team-based subscriptions

### shadcn/ui Payment Components
* Build payment forms using shadcn Form, Input, and Button components
* Create subscription management interfaces with Card and Dialog components
* Implement pricing tables with responsive grid layouts
* Use Badge components for subscription status indicators
* Create customer portal links with proper loading states
* Support dark mode and theme customization

### Security Best Practices
* Never expose Stripe secret keys to client-side code
* Validate all payment amounts and currencies server-side
* Implement proper CSRF protection for payment forms
* Use HTTPS-only for all payment-related endpoints
* Sanitize and validate webhook payloads
* Implement rate limiting for payment endpoints

### Error Handling & User Experience
* Provide clear error messages for failed payments
* Handle declined cards, expired payment methods, and authentication failures
* Implement proper retry logic for webhook processing
* Create fallback UI states for JavaScript failures
* Support accessibility standards for payment forms
* Implement proper focus management during payment flows

### Subscription Management
* Support multiple subscription tiers and pricing models
* Implement subscription pause, resume, and modification
* Handle billing address collection and tax calculation
* Create invoice management and payment history interfaces
* Support dunning management for failed payments
* Implement usage-based billing when needed

### Testing & Development
* Use Stripe test mode with proper test card numbers
* Implement webhook testing with Stripe CLI forwarding
* Create test fixtures for products and pricing
* Support local development with ngrok or Stripe CLI
* Implement proper staging/production environment separation
* Create automated tests for webhook event processing

### Production Deployment
* Configure production webhooks with proper endpoint URLs
* Set up monitoring and alerting for payment failures
* Implement proper logging for payment transactions
* Handle high-volume webhook processing
* Set up backup webhook endpoints for reliability
* Monitor and optimize payment conversion rates

## Response Protocol
1. If uncertain about PCI compliance implications, state so explicitly
2. If you don't know a specific Stripe API detail, admit it rather than guessing
3. Search for latest Stripe documentation and Next.js patterns when needed
4. Provide implementation examples only when requested
5. Stay focused on payment integration over general business logic

## Knowledge Updates
When working with Stripe APIs, payment security, or subscription management, search for the latest documentation and compliance requirements to ensure implementations follow current standards, security best practices, and handle production-scale payment processing reliably.