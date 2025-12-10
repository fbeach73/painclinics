# Implementation Plan: Clinic Claiming & Paid Featured Listings

## Overview

Implement a complete clinic claiming and featured listings system including:
- Database schema for claims, subscriptions, and rate limiting
- Admin dashboard for claim review
- Owner dashboard for clinic management
- Polar payment integration for featured subscriptions
- Email notifications via Mailgun
- UI enhancements for featured display

## Status

**Phase 1: COMPLETED** - Database schema and migration done.
**Phase 2: COMPLETED** - Email service and rate limiting infrastructure done.
**Phase 3: COMPLETED** - Claim database queries and API routes done.
**Phase 4: COMPLETED** - Claim UI components done.
**Phase 5: COMPLETED** - Admin claims dashboard done.
**Phase 6: COMPLETED** - Owner auth and session helpers done.
**Phase 7: COMPLETED** - Owner dashboard for managing clinics done.
**Phase 8: COMPLETED** - Polar payment integration done.
**Phase 9: COMPLETED** - Featured display enhancements done.
**Phase 10: COMPLETED** - Admin subscriptions dashboard done.
**Phase 11: COMPLETED** - Final integration & testing done.

---

## Phase 1: Database Schema & Foundation

**Goal**: Set up database tables, enums, and run migrations.

### Tasks

- [x] Install dependencies (@polar-sh/sdk, @polar-sh/better-auth, mailgun.js)
- [x] Add new enums to schema (claim_status, featured_tier)
- [x] Add ownership columns to clinics table (owner_user_id, is_verified, claimed_at, is_featured, featured_tier, featured_until)
- [x] Create clinic_claims table with all fields
- [x] Create featured_subscriptions table with Polar integration fields
- [x] Create claim_rate_limits table for anti-fraud
- [x] Add relations (userRelations, clinicsRelations, clinicClaimsRelations, featuredSubscriptionsRelations)
- [x] Run database migration

### Technical Details

**Dependencies installed:**
```bash
pnpm add @polar-sh/sdk @polar-sh/better-auth mailgun.js
```

**New enums in `src/lib/schema.ts`:**
```typescript
export const claimStatusEnum = pgEnum("claim_status", ["pending", "approved", "rejected", "expired"]);
export const featuredTierEnum = pgEnum("featured_tier", ["none", "basic", "premium"]);
```

**New columns on clinics table:**
```typescript
ownerUserId: text("owner_user_id").references(() => user.id),
isVerified: boolean("is_verified").default(false).notNull(),
claimedAt: timestamp("claimed_at"),
isFeatured: boolean("is_featured").default(false).notNull(),
featuredTier: featuredTierEnum("featured_tier").default("none"),
featuredUntil: timestamp("featured_until"),
```

**New tables created:**
- `clinic_claims` - Stores claim requests with status, claimant info, anti-fraud tracking
- `featured_subscriptions` - Links Polar subscriptions to clinics
- `claim_rate_limits` - IP-based rate limiting for claims

**Migration script:** `src/scripts/migrate-claims-schema.ts`

---

## Phase 2: Email & Rate Limiting Infrastructure

**Goal**: Set up Mailgun email service and claim rate limiting.

### Tasks

- [x] Create Mailgun email service (`src/lib/email.ts`)
- [x] Create email template functions for all notification types
- [x] Create claim rate limiting module (`src/lib/claim-rate-limit.ts`)
- [x] Implement `checkClaimRateLimit(ip)` function (3/day limit)
- [x] Implement `recordClaimAttempt(ip)` function
- [x] Implement `canUserClaimClinic(userId, clinicId)` eligibility check

### Technical Details

**Email service (`src/lib/email.ts`):**
```typescript
import Mailgun from "mailgun.js";
import FormData from "form-data";

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY!,
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return mg.messages.create(process.env.MAILGUN_DOMAIN!, {
    from: "Pain Clinics Directory <noreply@painclinics.com>",
    to,
    subject,
    html,
  });
}
```

**Email templates to create:**
- `sendClaimSubmittedEmail(to, clinicName)`
- `sendClaimApprovedEmail(to, clinicName, dashboardUrl)`
- `sendClaimRejectedEmail(to, clinicName, reason)`
- `sendFeaturedConfirmedEmail(to, clinicName, tier)`
- `sendPaymentFailedEmail(to, clinicName)`

**Rate limiting (`src/lib/claim-rate-limit.ts`):**
```typescript
const CLAIMS_PER_DAY = 3;
const REJECTION_BLOCK_DAYS = 30;

export async function checkClaimRateLimit(ipAddress: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}>

export async function recordClaimAttempt(ipAddress: string): Promise<void>

export async function canUserClaimClinic(userId: string, clinicId: string): Promise<{
  allowed: boolean;
  reason?: string;
}>
```

**Environment variables required:**
```env
MAILGUN_API_KEY=xxx
MAILGUN_DOMAIN=painclinics.com
```

---

## Phase 3: Claim Database Queries & API Routes

**Goal**: Create backend for claim submission and management.

### Tasks

- [x] Create claim database queries (`src/lib/claim-queries.ts`)
- [x] Create public claim API routes [complex]
  - [x] POST `/api/claims` - Submit new claim
  - [x] GET `/api/claims` - List user's claims
  - [x] GET `/api/claims/[claimId]` - Get claim status
- [x] Create admin claim API routes [complex]
  - [x] GET `/api/admin/claims` - List all pending claims
  - [x] GET `/api/admin/claims/[claimId]` - Get claim details
  - [x] POST `/api/admin/claims/[claimId]/approve` - Approve claim
  - [x] POST `/api/admin/claims/[claimId]/reject` - Reject claim

### Technical Details

**Claim queries (`src/lib/claim-queries.ts`):**
```typescript
// Create a new claim
export async function createClaim(data: {
  clinicId: string;
  userId: string;
  fullName: string;
  role: string;
  businessEmail: string;
  businessPhone: string;
  additionalNotes?: string;
  ipAddress?: string;
  userAgent?: string;
})

// Get claims for a user
export async function getUserClaims(userId: string)

// Get claim by ID
export async function getClaimById(claimId: string)

// Get pending claims for admin
export async function getPendingClaims(limit?: number, offset?: number)

// Approve claim - updates clinic ownership
export async function approveClaim(claimId: string, reviewerId: string, adminNotes?: string)

// Reject claim
export async function rejectClaim(claimId: string, reviewerId: string, rejectionReason: string, adminNotes?: string)

// Check if clinic is already claimed
export async function isClinicClaimed(clinicId: string): Promise<boolean>
```

**API route files to create:**
- `src/app/api/claims/route.ts`
- `src/app/api/claims/[claimId]/route.ts`
- `src/app/api/admin/claims/route.ts`
- `src/app/api/admin/claims/[claimId]/route.ts`
- `src/app/api/admin/claims/[claimId]/approve/route.ts`
- `src/app/api/admin/claims/[claimId]/reject/route.ts`

**POST `/api/claims` request body:**
```typescript
{
  clinicId: string;
  fullName: string;
  role: "owner" | "manager" | "authorized_representative";
  businessEmail: string;
  businessPhone: string;
  additionalNotes?: string;
}
```

**POST `/api/admin/claims/[claimId]/approve` - Updates:**
1. Set claim status to "approved"
2. Set clinic.ownerUserId to claim.userId
3. Set clinic.claimedAt to now
4. Set clinic.isVerified to true
5. Update user.role to "clinic_owner" if not admin
6. Send approval email

---

## Phase 4: Claim UI Components

**Goal**: Create frontend components for claiming.

### Tasks

- [x] Create claim button component (`src/components/clinic/claim-listing-button.tsx`)
- [x] Create claim form modal (`src/components/clinic/claim-form-modal.tsx`)
- [x] Create claim benefits banner (`src/components/clinic/claim-benefits-banner.tsx`)
- [x] Update clinic header to include claim button (`src/components/clinic/clinic-header.tsx`)

### Technical Details

**ClaimListingButton props:**
```typescript
interface ClaimListingButtonProps {
  clinicId: string;
  clinicName: string;
  isOwned: boolean;
  isOwnedByCurrentUser: boolean;
  className?: string;
}
```

**Behavior:**
- If `isOwnedByCurrentUser`: Show "Your Listing" badge (green)
- If `isOwned` (by another user): Hide button
- Otherwise: Show "Claim This Listing" button with ShieldCheck icon

**ClaimFormModal fields:**
```typescript
const claimFormSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  role: z.enum(["owner", "manager", "authorized_representative"]),
  businessEmail: z.string().email("Valid email required"),
  businessPhone: z.string().min(10, "Valid phone required"),
  additionalNotes: z.string().optional(),
});
```

**Form submission flow:**
1. Validate form with Zod
2. POST to `/api/claims`
3. Show success toast with "pending review" message
4. Close modal

---

## Phase 5: Admin Claims Dashboard

**Goal**: Build admin interface for reviewing claims.

### Tasks

- [x] Update admin sidebar with "Claims" nav item (`src/components/admin/admin-sidebar.tsx`)
- [x] Create claims list page (`src/app/admin/claims/page.tsx`)
- [x] Create claim review page (`src/app/admin/claims/[claimId]/page.tsx`)
- [x] Add approve/reject functionality with confirmation dialogs

### Technical Details

**Admin sidebar addition:**
```typescript
{ href: "/admin/claims", label: "Claims", icon: Shield }
```

**Claims list page features:**
- Table columns: Clinic Name, Claimant Name, Email, Role, Submitted, Status
- Filter dropdown: All, Pending, Approved, Rejected
- Pagination
- Click row to view details

**Claim review page features:**
- Clinic info card (name, address, phone, website)
- Claimant info section (name, email, phone, role, notes)
- Status badge (pending/approved/rejected)
- Anti-fraud info (IP address, user agent, submitted date)
- Admin notes textarea
- Action buttons:
  - Approve (with confirmation)
  - Reject (requires rejection reason)
- Claim history timeline (if multiple claims exist for clinic)

---

## Phase 6: Owner Auth & Session Helpers

**Goal**: Add authentication helpers for clinic owners.

### Tasks

- [x] Add owner auth helpers to session.ts (`src/lib/session.ts`)
- [x] Implement `requireOwner()` function
- [x] Implement `requireClinicOwnership(clinicId)` function
- [x] Create owner queries (`src/lib/owner-queries.ts`)

### Technical Details

**Session helpers (`src/lib/session.ts`):**
```typescript
export const ownerRoutes = ["/my-clinics"];

export async function requireOwner() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/");
  }

  if (!["admin", "clinic_owner"].includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return session;
}

export async function requireClinicOwnership(clinicId: string) {
  const session = await requireOwner();

  const clinic = await db.query.clinics.findFirst({
    where: and(
      eq(schema.clinics.id, clinicId),
      eq(schema.clinics.ownerUserId, session.user.id)
    ),
  });

  // Admins can access any clinic
  if (!clinic && session.user.role !== "admin") {
    redirect("/unauthorized");
  }

  return { session, clinic };
}
```

**Owner queries (`src/lib/owner-queries.ts`):**
```typescript
export async function getOwnedClinics(userId: string)
export async function getClinicForOwner(clinicId: string, userId: string)
export async function updateClinicByOwner(clinicId: string, userId: string, data: ClinicUpdateData)
```

---

## Phase 7: Owner Dashboard

**Goal**: Build owner dashboard for managing clinics.

### Tasks

- [x] Create owner dashboard layout (`src/app/(owner)/layout.tsx`)
- [x] Create owner sidebar component (`src/components/owner/owner-sidebar.tsx`)
- [x] Create my-clinics list page (`src/app/(owner)/my-clinics/page.tsx`)
- [x] Create clinic overview page (`src/app/(owner)/my-clinics/[clinicId]/page.tsx`)
- [x] Create clinic edit page (`src/app/(owner)/my-clinics/[clinicId]/edit/page.tsx`) [complex]
  - [x] Contact info section (phone, website, email)
  - [x] Address section (street, city, state, zip)
  - [x] Hours section
  - [x] Description/about section
  - [x] Social links section
- [x] Create photos management page (`src/app/(owner)/my-clinics/[clinicId]/photos/page.tsx`)
- [x] Create services management page (`src/app/(owner)/my-clinics/[clinicId]/services/page.tsx`)
- [x] Create owner API routes [complex]
  - [x] GET `/api/owner/clinics` - List owned clinics
  - [x] GET `/api/owner/clinics/[clinicId]` - Get clinic details
  - [x] PATCH `/api/owner/clinics/[clinicId]` - Update clinic

### Technical Details

**Owner sidebar navigation:**
```typescript
const ownerNavItems = [
  { href: "/my-clinics", label: "My Clinics", icon: Building2 },
  { href: "/my-clinics/claims", label: "Claim Status", icon: FileCheck },
];
```

**Owner layout structure:**
- Full-width header with logo and user menu
- Left sidebar with navigation
- Main content area

**Clinic edit form sections:**
1. **Contact Info**
   - Phone (text input)
   - Additional phones (array)
   - Website URL
   - Email addresses (array)

2. **Address**
   - Street address
   - City
   - State (select)
   - Postal code
   - Latitude/longitude (read-only, shown for reference)

3. **Hours**
   - JSON editor or structured time picker
   - "Closed on" field

4. **Description**
   - Rich text or textarea for content
   - Word count indicator

5. **Social Links**
   - Facebook, Instagram, Twitter, YouTube, LinkedIn, TikTok, Pinterest URLs

**PATCH `/api/owner/clinics/[clinicId]` request body:**
```typescript
{
  phone?: string;
  phones?: string[];
  website?: string;
  emails?: string[];
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  clinicHours?: object;
  closedOn?: string;
  content?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  tiktok?: string;
  pinterest?: string;
}
```

---

## Phase 8: Polar Payment Integration

**Goal**: Integrate Polar for featured listing subscriptions.

### Tasks

- [x] Update auth.ts with Polar plugin (`src/lib/auth.ts`)
- [x] Update auth-client.ts with polarClient (`src/lib/auth-client.ts`)
- [x] Create Polar webhook handlers (`src/lib/polar-webhooks.ts`)
- [x] Create featured subscription queries (`src/lib/subscription-queries.ts`)
- [x] Create featured checkout page (`src/app/(owner)/my-clinics/[clinicId]/featured/page.tsx`)
- [x] Create featured checkout component (`src/components/owner/featured-checkout.tsx`)

### Technical Details

**Auth.ts Polar plugin configuration:**
```typescript
import { polar, checkout, portal, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});

// Add to plugins array:
polar({
  client: polarClient,
  createCustomerOnSignUp: true,
  use: [
    checkout({
      products: [
        { productId: process.env.POLAR_BASIC_PRODUCT_ID!, slug: "featured-basic" },
        { productId: process.env.POLAR_PREMIUM_PRODUCT_ID!, slug: "featured-premium" },
      ],
      successUrl: "/my-clinics/{CHECKOUT_ID}/featured?success=true",
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
}),
```

**Auth-client.ts update:**
```typescript
import { polarClient } from "@polar-sh/better-auth";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [polarClient()],
});
```

**Webhook handlers (`src/lib/polar-webhooks.ts`):**
```typescript
export async function handleSubscriptionActive(payload: any) {
  // 1. Extract clinicId from metadata/referenceId
  // 2. Determine tier from product ID
  // 3. Create/update featured_subscriptions record
  // 4. Update clinic: isFeatured=true, featuredTier, featuredUntil
  // 5. Send confirmation email
}

export async function handleSubscriptionCanceled(payload: any) {
  // 1. Update subscription status
  // 2. Keep clinic featured until end_date
  // 3. Send cancellation email
}

export async function handleOrderPaid(payload: any) {
  // 1. If renewal, extend featuredUntil date
  // 2. Log payment for analytics
}
```

**Checkout flow:**
```typescript
// In featured-checkout.tsx
const handleCheckout = async (tier: "basic" | "premium") => {
  await authClient.checkout({
    products: [tier === "basic" ? POLAR_BASIC_PRODUCT_ID : POLAR_PREMIUM_PRODUCT_ID],
    metadata: { clinicId },
  });
};
```

**Environment variables:**
```env
POLAR_ACCESS_TOKEN=polar_xxx (already set)
POLAR_WEBHOOK_SECRET=polar_xxx (already set)
POLAR_BASIC_PRODUCT_ID=xxx (need to create in Polar)
POLAR_PREMIUM_PRODUCT_ID=xxx (need to create in Polar)
```

---

## Phase 9: Featured Display Enhancements

**Goal**: Update UI to show featured status prominently.

### Tasks

- [x] Create featured badge component (`src/components/clinic/featured-badge.tsx`)
- [x] Update clinic card with featured styling (`src/components/clinic/clinic-card.tsx`)
- [x] Update map marker with featured styling (`src/components/map/clinic-marker.tsx`)
- [x] Update clinic queries with featured prioritization (`src/lib/clinic-queries.ts`)
- [x] Update clinic header with featured badge display

### Technical Details

**Featured badge component:**
```typescript
interface FeaturedBadgeProps {
  tier: "basic" | "premium";
  size?: "sm" | "md" | "lg";
}

// Basic: Gold background, "Featured" text
// Premium: Gold background with star icon, "Premium" text
```

**Clinic card styling for featured:**
```css
/* Featured card wrapper */
.featured-card {
  background: linear-gradient(135deg, #FFF9E6 0%, #FFFFFF 100%);
  border: 2px solid #FFD700;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.15);
}

/* Featured badge positioning */
.featured-badge {
  position: absolute;
  top: 12px;
  right: 12px;
}
```

**Map marker updates:**
```typescript
// In clinic-marker.tsx
const getMarkerStyle = (isFeatured: boolean, tier: string) => {
  if (tier === "premium") {
    return { color: "#FFD700", scale: 1.4, icon: "star" };
  }
  if (isFeatured) {
    return { color: "#FFD700", scale: 1.2 };
  }
  return { color: "#3B82F6", scale: 1.0 };
};
```

**Query prioritization (`src/lib/clinic-queries.ts`):**
```typescript
// Update getClinicsForSearch and similar functions
.orderBy(
  desc(clinics.isFeatured),
  desc(sql`CASE WHEN featured_tier = 'premium' THEN 2 WHEN featured_tier = 'basic' THEN 1 ELSE 0 END`),
  desc(clinics.rating),
  // existing order by...
)
```

---

## Phase 10: Admin Subscriptions Dashboard

**Goal**: Build admin view for subscription management.

### Tasks

- [x] Update admin sidebar with "Subscriptions" nav item
- [x] Create subscriptions list page (`src/app/admin/subscriptions/page.tsx`)
- [x] Add revenue metrics (MRR, active count, churn)
- [x] Link to Polar dashboard for detailed management

### Technical Details

**Admin sidebar addition:**
```typescript
{ href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard }
```

**Subscriptions page features:**
- Summary cards:
  - Total Active Subscriptions
  - Monthly Recurring Revenue (MRR)
  - Basic vs Premium breakdown
- Subscriptions table:
  - Clinic name
  - Owner email
  - Tier (Basic/Premium)
  - Status
  - Start date
  - Next billing date
- Link to Polar dashboard for refunds/cancellations

**Revenue calculation:**
```typescript
const calculateMRR = (subscriptions: FeaturedSubscription[]) => {
  return subscriptions.reduce((total, sub) => {
    if (sub.status !== "active") return total;
    const monthlyAmount = sub.tier === "premium" ? 199 : 99;
    // Adjust for annual billing (divide by 12)
    if (sub.billingCycle === "annual") {
      return total + (monthlyAmount * 10 / 12);
    }
    return total + monthlyAmount;
  }, 0);
};
```

---

## Phase 11: Final Integration & Testing

**Goal**: Wire everything together and verify functionality.

### Tasks

- [x] Run lint and typecheck
- [x] Verify claim submission flow end-to-end
- [x] Verify admin approval flow
- [x] Verify owner dashboard functionality
- [x] Verify featured checkout flow (sandbox mode)
- [x] Verify email notifications send correctly

### Technical Details

**Lint and typecheck commands:**
```bash
pnpm run lint
pnpm run typecheck
```

**Manual testing checklist:**
1. Submit a claim as a regular user
2. Review claim in admin dashboard
3. Approve claim and verify ownership transfer
4. Edit clinic as owner
5. Initiate featured checkout (Polar sandbox)
6. Verify featured display in search results
7. Verify featured marker on map
