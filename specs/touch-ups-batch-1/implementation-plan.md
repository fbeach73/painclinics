# Implementation Plan: Touch-Ups Batch 1

## Overview

Implementation of 5 touch-up tasks identified during recent feature work. Tasks are ordered by complexity and dependencies, starting with quick fixes and progressing to more complex admin features.

---

## Phase 1: Quick Fixes

Simple changes with no dependencies. Can be done independently.

### Tasks

- [x] Fix email link in featured-welcome.tsx - replace plain text `/my-clinics` with clickable hyperlink

### Technical Details

**File to modify:** `src/emails/featured-welcome.tsx`

**Current code (lines 60-64):**
```tsx
<Text style={paragraphStyle}>
  Your listing will now appear with a Featured badge and receive
  priority placement, helping more patients discover your clinic.
  Visit your clinic dashboard at /my-clinics to manage your listing.
</Text>
```

**Replace with:**
```tsx
import { Link } from "@react-email/components";

<Text style={paragraphStyle}>
  Your listing will now appear with a Featured badge and receive
  priority placement, helping more patients discover your clinic.{" "}
  <Link href={dashboardUrl} style={linkStyle}>
    Visit your clinic dashboard
  </Link>{" "}
  to manage your listing.
</Text>
```

**Add style (after line 107):**
```tsx
const linkStyle: React.CSSProperties = {
  color: "#2563eb",
  textDecoration: "underline",
};
```

---

## Phase 2: Dashboard UI Cleanup

Styling improvements to the owner dashboard for better readability and consistency.

### Tasks

- [x] Audit and simplify my-clinics list page styling
- [x] Audit and simplify clinic detail dashboard styling
- [x] Ensure dark mode compatibility across all dashboard cards

### Technical Details

**Files to modify:**
- `src/app/(owner)/my-clinics/page.tsx`
- `src/app/(owner)/my-clinics/[clinicId]/page.tsx`

**Design Guidelines:**
- **Color palette:** Primary (brand), Muted (cards/backgrounds), Amber (featured accents only)
- **Cards:** Use shadcn Card with `hover:bg-muted/50` for interactive elements
- **Icons:** Use `text-muted-foreground` universally instead of colored icons
- **Dark mode:** Rely on CSS variables, avoid hardcoded `dark:bg-*` classes

**Before/After Pattern:**
```tsx
// Before - multiple colors
<div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-3">
  <Edit className="h-5 w-5 text-blue-600" />
</div>

// After - unified muted style
<div className="bg-muted rounded-lg p-3">
  <Edit className="h-5 w-5 text-muted-foreground" />
</div>
```

**Quick Action Cards Pattern:**
```tsx
<Card className="cursor-pointer hover:bg-muted/50 transition-colors">
  <CardContent className="p-4 flex items-center gap-3">
    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
      <Icon className="h-5 w-5 text-muted-foreground" />
    </div>
    <div>
      <h3 className="font-medium">Title</h3>
      <p className="text-sm text-muted-foreground">Description</p>
    </div>
  </CardContent>
</Card>
```

---

## Phase 3: Broadcast Manual Target Filter

Add ability to manually input email addresses for broadcast targeting.

### Tasks

- [x] Add "manual" value to targetAudienceEnum in schema
- [x] Update TargetFilters type to include manualEmails array
- [x] Handle "manual" audience type in clinic-targeting.ts
- [x] Add manual email input UI to recipient-selector.tsx
- [x] Update preview-count API to handle manual emails

### Technical Details

**Schema change (`src/lib/schema.ts`):**
```typescript
export const targetAudienceEnum = pgEnum("target_audience", [
  "all_with_email",
  "featured_only",
  "by_state",
  "by_tier",
  "custom",
  "manual",  // ADD THIS
]);
```

**After schema change, run:**
```bash
pnpm db:push
```

**Type update (`src/lib/broadcast/broadcast-queries.ts`):**
```typescript
export type TargetFilters = {
  states?: string[];
  tiers?: string[];
  excludeUnsubscribed?: boolean;
  manualEmails?: string[];  // ADD THIS
};
```

**Targeting logic (`src/lib/broadcast/clinic-targeting.ts`):**
```typescript
// Add case for "manual" in getTargetClinics function
case "manual":
  if (filters?.manualEmails && filters.manualEmails.length > 0) {
    return filters.manualEmails.map(email => ({
      clinicId: "",
      clinicName: "Manual Entry",
      email,
      ownerUserId: null,
    }));
  }
  return [];
```

**UI addition (`src/components/admin/broadcasts/recipient-selector.tsx`):**

Add new radio option after line 284 (after "custom" option):
```tsx
<div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
  <RadioGroupItem value="manual" id="manual" />
  <Label htmlFor="manual" className="flex-1 cursor-pointer">
    <div className="font-medium">Manual email list</div>
    <div className="text-sm text-muted-foreground">
      Enter specific email addresses
    </div>
  </Label>
</div>
```

Add textarea when manual is selected:
```tsx
{audience === "manual" && (
  <div className="space-y-3">
    <Label>Enter Email Addresses</Label>
    <Textarea
      placeholder="email1@example.com, email2@example.com&#10;email3@example.com"
      value={manualEmailsText}
      onChange={handleManualEmailsChange}
      rows={5}
    />
    <p className="text-sm text-muted-foreground">
      Enter email addresses separated by commas or new lines.
      {validEmailCount > 0 && ` ${validEmailCount} valid email(s) detected.`}
    </p>
  </div>
)}
```

**Email validation helper:**
```typescript
const parseManualEmails = (text: string): string[] => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return text
    .split(/[,\n]+/)
    .map(e => e.trim())
    .filter(e => emailRegex.test(e));
};
```

---

## Phase 4: Stripe Thank You Page

Create personalized post-checkout confirmation page.

### Tasks

- [x] Create /checkout/success page component
- [x] Update checkout create-session route to use new success URL
- [x] Fetch and display Stripe session details on thank you page

### Technical Details

**New file: `src/app/checkout/success/page.tsx`**

```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

interface PageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { session_id } = await searchParams;

  if (!session_id) {
    redirect("/my-clinics");
  }

  const session = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ["subscription"],
  });

  const clinicId = session.metadata?.clinicId;
  const plan = session.metadata?.plan;
  const tier = plan?.includes("premium") ? "Premium" : "Basic";

  // ... render thank you UI
}
```

**Update checkout route (`src/app/api/checkout/create-session/route.ts`):**

Change line 169 from:
```typescript
const successUrl = `${appUrl}/my-clinics/${clinicId}/featured?success=true`
```
To:
```typescript
const successUrl = `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
```

Note: `{CHECKOUT_SESSION_ID}` is a Stripe template variable that gets replaced with the actual session ID.

**Page content structure:**
- Large green checkmark icon
- "Thank you for subscribing!" heading
- Clinic name from session metadata
- Subscription tier badge (Basic/Premium)
- Billing info (monthly/annual)
- Primary CTA: "Go to Your Clinic Dashboard" → `/my-clinics/{clinicId}`
- Secondary link: "Manage Subscription" → Stripe Customer Portal

---

## Phase 5: Admin Customer Data Table [complex]

Unified admin view for managing subscribers and clinic owners.

### Tasks

- [x] Create admin customer queries in lib/admin-customer-queries.ts
- [x] Create /admin/customers page with tab filtering
- [x] Create customer actions component (cancel subscription, reverse claim)
- [x] Create API route for canceling subscriptions (with Stripe sync)
- [x] Create API route for reversing clinic claims
- [x] Add "Customers" item to admin sidebar

### Technical Details

**New files to create:**
```
src/app/admin/customers/
├── page.tsx                    # Main page with tabs
├── customer-filter-tabs.tsx    # Tab filtering component
└── customer-actions.tsx        # Action buttons

src/app/api/admin/customers/
├── [subscriptionId]/cancel/route.ts
└── [clinicId]/reverse-claim/route.ts

src/lib/admin-customer-queries.ts
```

**Query functions (`src/lib/admin-customer-queries.ts`):**

```typescript
import { db } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";
import * as schema from "@/lib/schema";

export type CustomerWithDetails = {
  subscriptionId: string;
  clinicId: string;
  clinicName: string;
  ownerName: string | null;
  ownerEmail: string;
  tier: "basic" | "premium";
  status: "active" | "canceled" | "past_due" | "expired";
  billingCycle: "monthly" | "annual";
  startDate: Date;
  stripeSubscriptionId: string | null;
};

export async function getAllCustomers(filters?: {
  status?: string[];
}): Promise<CustomerWithDetails[]> {
  // Join featuredSubscriptions with clinics and users
  // Filter by status if provided
}

export async function cancelSubscription(
  subscriptionId: string,
  adminId: string
): Promise<void> {
  // 1. Get subscription with stripeSubscriptionId
  // 2. Call stripe.subscriptions.cancel()
  // 3. Update database record
  // 4. Log admin action
}

export async function reverseClinicClaim(
  clinicId: string,
  adminId: string,
  reason?: string
): Promise<void> {
  // 1. Update clinic: ownerUserId = null, isVerified = false, claimedAt = null
  // 2. Update any approved claims for this clinic to "expired"
  // 3. Log admin action
}
```

**Cancel subscription API (`src/app/api/admin/customers/[subscriptionId]/cancel/route.ts`):**

```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { checkAdminApi } from "@/lib/admin-auth";
import { cancelSubscription } from "@/lib/admin-customer-queries";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  const adminCheck = await checkAdminApi();
  if (!adminCheck.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subscriptionId } = await params;

  try {
    await cancelSubscription(subscriptionId, adminCheck.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin] Error canceling subscription:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
```

**Sidebar update (`src/components/admin/admin-sidebar.tsx`):**

Add to navigation items (after Claims or Subscriptions):
```tsx
{
  title: "Customers",
  href: "/admin/customers",
  icon: Users,
}
```

**Tab filter component pattern:**
Follow existing pattern from `src/app/admin/claims/claims-filter-tabs.tsx`:
- Tabs for: All, Active, Canceled, Past Due, Expired
- URL search params for filter state
- Badge counts per status

---

## Post-Implementation Checklist

- [x] Run `pnpm lint && pnpm typecheck` after each phase
- [x] Run `pnpm db:push` after Phase 3 schema change
- [ ] Test email preview for Phase 1
- [x] Test Stripe checkout flow for Phase 4
- [x] Test subscription cancellation syncs with Stripe for Phase 5
