# Implementation Plan: Subscription Quick Wins

## Overview

Implement three post-subscription enhancements: admin notification email with Adsense link, user thank you email with dashboard link, and subscription tier badge in /my-clinics.

---

## Phase 1: Email Templates

Create new email templates following existing patterns.

### Tasks

- [x] Create `subscription-admin.tsx` email template for admin notifications
- [x] Create `subscription-thank-you.tsx` email template for user thank you
- [x] Add exports to `src/emails/index.ts` for both templates

### Technical Details

**Admin Notification Template (`src/emails/subscription-admin.tsx`):**

```typescript
export interface SubscriptionAdminProps {
  clinicName: string;
  clinicSlug: string;
  tier: "basic" | "premium";
  billingCycle: "monthly" | "annual";
  userEmail: string;
  submittedAt: string;
  clinicUrl: string;
  adsenseExclusionUrl: string;
}
```

Follow `claim-pending-admin.tsx` pattern:
- Subject: `New Featured Subscription - {clinicName} ({tier})`
- Heading: "New Featured Subscription"
- EmailCard with details: Clinic, Tier, Billing, Customer Email, Clinic URL, Created
- Two CTA buttons: "View Clinic" and "Remove from Adsense"
- Footer reminder about Adsense removal

**User Thank You Template (`src/emails/subscription-thank-you.tsx`):**

```typescript
export interface SubscriptionThankYouProps {
  clinicName: string;
  tier: "basic" | "premium";
  dashboardUrl: string;
  unsubscribeUrl?: string;
}
```

- Subject: `Thank You for Subscribing! - Pain Clinics Directory`
- Warm personal thank you message
- Mention clinic name and tier
- Info card: "Your Dashboard is Ready"
- CTA: "Go to My Clinics" → `/my-clinics`
- Support section with hello@painclinics.com
- Signature: "The Pain Clinics Directory Team"

**Email Index Exports (`src/emails/index.ts`):**

```typescript
// Add imports
import { SubscriptionAdmin, type SubscriptionAdminProps } from "./subscription-admin";
import { SubscriptionThankYou, type SubscriptionThankYouProps } from "./subscription-thank-you";

// Add exports
export { SubscriptionAdmin, SubscriptionThankYou };
export type { SubscriptionAdminProps, SubscriptionThankYouProps };

// Add render functions
export async function renderSubscriptionAdminEmail(props: SubscriptionAdminProps): Promise<string> {
  return render(SubscriptionAdmin(props));
}

export async function renderSubscriptionThankYouEmail(props: SubscriptionThankYouProps): Promise<string> {
  return render(SubscriptionThankYou(props));
}

// Add to EMAIL_TEMPLATES constant
SUBSCRIPTION_ADMIN: "subscription-admin",
SUBSCRIPTION_THANK_YOU: "subscription-thank-you",
```

---

## Phase 2: Email Sending Functions

Add sending functions to the email service.

### Tasks

- [x] Add `sendSubscriptionAdminNotificationEmail()` function to `src/lib/email.ts`
- [x] Add `sendSubscriptionThankYouEmail()` function to `src/lib/email.ts`

### Technical Details

**Admin Notification Function:**

```typescript
export async function sendSubscriptionAdminNotificationEmail(
  clinicName: string,
  clinicSlug: string,
  tier: "basic" | "premium",
  billingCycle: "monthly" | "annual",
  userEmail: string,
  options?: {
    clinicId?: string;
    subscriptionId?: string;
  }
): Promise<SendEmailResult>
```

- Uses `PRIMARY_ADMIN_EMAIL` (kyle@freddybeach.com)
- BCC to additional admins (hello@painclinics.com)
- Constructs clinic URL from slug
- Gets Adsense URL from `ADSENSE_EXCLUSION_URL` env var (fallback to generic Adsense URL)
- Logs with template name `EMAIL_TEMPLATES.SUBSCRIPTION_ADMIN`

**User Thank You Function:**

```typescript
export async function sendSubscriptionThankYouEmail(
  to: string,
  clinicName: string,
  tier: "basic" | "premium",
  options?: {
    userId?: string;
    clinicId?: string;
    subscriptionId?: string;
    unsubscribeToken?: string;
  }
): Promise<SendEmailResult>
```

- Dashboard URL: `${baseUrl}/my-clinics`
- Logs with template name `EMAIL_TEMPLATES.SUBSCRIPTION_THANK_YOU`

---

## Phase 3: Webhook Integration

Add email calls to the subscription webhook handler.

### Tasks

- [x] Import new email functions in `src/lib/stripe-webhooks.ts`
- [x] Call `sendSubscriptionAdminNotificationEmail()` in `handleSubscriptionComplete()`
- [x] Call `sendSubscriptionThankYouEmail()` in `handleSubscriptionComplete()`

### Technical Details

**Location:** `src/lib/stripe-webhooks.ts` in `handleSubscriptionComplete()` function (around line 243, after existing `sendFeaturedConfirmedEmail()` call)

**Add imports:**
```typescript
import {
  sendSubscriptionAdminNotificationEmail,
  sendSubscriptionThankYouEmail
} from "./email";
```

**Add calls after existing email (around line 243):**
```typescript
// Extract slug from permalink (remove "pain-management/" prefix if present)
const clinicSlug = clinic.permalink.replace(/^pain-management\//, '');

// Send admin notification email
await sendSubscriptionAdminNotificationEmail(
  clinic.title,
  clinicSlug,
  tier,
  billingCycle,
  user.email,
  {
    clinicId,
    subscriptionId: stripeSubscriptionId,
  }
);

// Send user thank you email
await sendSubscriptionThankYouEmail(
  user.email,
  clinic.title,
  tier,
  {
    userId,
    clinicId,
    subscriptionId: stripeSubscriptionId,
    unsubscribeToken: user.unsubscribeToken ?? undefined,
  }
);
```

---

## Phase 4: My-Clinics UI Update

Update the clinic cards to show subscription tier badge.

### Tasks

- [x] Update `/my-clinics` page to show tier badge for featured clinics instead of "Get Featured" button

### Technical Details

**File:** `src/app/(owner)/my-clinics/page.tsx`

**Current code (lines 163-170):**
```tsx
{!clinic.isFeatured && (
  <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50" asChild>
    <Link href={`/my-clinics/${clinic.id}/featured`}>
      <Star className="h-4 w-4 mr-1" />
      Get Featured
    </Link>
  </Button>
)}
```

**Replace with:**
```tsx
{clinic.isFeatured && clinic.featuredTier && clinic.featuredTier !== "none" ? (
  <Link
    href={`/my-clinics/${clinic.id}/featured`}
    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-opacity hover:opacity-80 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
  >
    <Star className="h-3 w-3" />
    {clinic.featuredTier === "premium" ? "Premium" : "Basic"}
  </Link>
) : (
  <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50" asChild>
    <Link href={`/my-clinics/${clinic.id}/featured`}>
      <Star className="h-4 w-4 mr-1" />
      Get Featured
    </Link>
  </Button>
)}
```

**Logic:**
- If `clinic.isFeatured` AND `clinic.featuredTier` exists AND not "none": Show tier badge link
- Otherwise: Show "Get Featured" button (existing behavior)
- Badge links to same destination: `/my-clinics/{clinicId}/featured`

---

## Phase 5: Environment & Validation

Add environment variable and run validation.

### Tasks

- [x] Add `ADSENSE_EXCLUSION_URL` to `.env.example` with placeholder
- [x] Run `pnpm lint && pnpm typecheck` to validate all changes

### Technical Details

**Add to `.env.example`:**
```env
# Google Adsense exclusion URL for admin notifications (optional)
# Get your URL from: Google Adsense > Sites > URL exclusions
ADSENSE_EXCLUSION_URL=https://www.google.com/adsense/new/u/0/pub-XXXXXXXX/url-channels
```

**Validation commands:**
```bash
pnpm lint && pnpm typecheck
```

---

## Files Summary

| File | Action | Description |
|------|--------|-------------|
| `src/emails/subscription-admin.tsx` | CREATE | Admin notification template |
| `src/emails/subscription-thank-you.tsx` | CREATE | User thank you template |
| `src/emails/index.ts` | MODIFY | Add exports and render functions |
| `src/lib/email.ts` | MODIFY | Add 2 sending functions |
| `src/lib/stripe-webhooks.ts` | MODIFY | Call emails in handleSubscriptionComplete() |
| `src/app/(owner)/my-clinics/page.tsx` | MODIFY | Update lines 163-170 for tier badge |
| `.env.example` | MODIFY | Add ADSENSE_EXCLUSION_URL |
