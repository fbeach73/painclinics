# Implementation Plan: Featured Subscription Benefits

## Overview

Deliver all promised featured listing benefits across emails, search results, owner portal, and premium-only features. The backend infrastructure (search ordering, webhooks, map markers) already works - this plan focuses on visual enhancements and new features.

---

## Phase 1: Email Notifications

Notify admin of new subscriptions with clinic slug for Adsense management, and improve user welcome email.

### Tasks

- [x] Create admin notification email template
- [x] Add admin email sending function to email.ts
- [x] Update stripe-webhooks.ts to send admin notification
- [x] Update user welcome email CTA text

### Technical Details

**Admin Email Template** (`src/emails/featured-subscription-admin.tsx`):
```tsx
// Key content to include:
// - Clinic name with link to public listing
// - Clinic slug: /pain-management/{permalink} (CRITICAL for Adsense)
// - Subscription tier (Basic/Premium)
// - Billing cycle (Monthly/Annual)
// - User name and email
// - Link to admin subscriptions page
```

**Email Function** (`src/lib/email.ts`):
```typescript
export async function sendFeaturedSubscriptionAdminEmail(
  clinicName: string,
  clinicSlug: string,  // Full path: pain-management/ny/new-york/clinic-name
  tier: 'basic' | 'premium',
  billingCycle: 'monthly' | 'annual',
  userName: string,
  userEmail: string
): Promise<SendEmailResult>
```

**Webhook Update** (`src/lib/stripe-webhooks.ts`):
- Add call after line ~244 (after user welcome email)
- Use `clinic.permalink` for the slug

**User Welcome Email** (`src/emails/featured-welcome.tsx`):
- Change button text to "Manage Your Clinics"
- Add text reference to `/my-clinics` URL

---

## Phase 2: Owner Portal Subscription Status

Replace "Get Featured" button with subscription status for subscribed clinics.

### Tasks

- [x] Update getOwnedClinics query to include subscription data
- [x] Create SubscriptionStatusBadge component
- [x] Update my-clinics page to show status badge for featured clinics

### Technical Details

**Query Update** (`src/lib/owner-queries.ts`):
```typescript
// In getOwnedClinics(), add relation:
with: {
  clinicServices: { with: { service: true } },
  // ADD THIS:
  featuredSubscriptions: {
    where: eq(schema.featuredSubscriptions.status, 'active'),
    limit: 1,
  },
}
```

**SubscriptionStatusBadge Component** (`src/components/owner/subscription-status-badge.tsx`):
```tsx
interface Props {
  tier: 'basic' | 'premium';
  clinicId: string;
}
// Renders:
// - Badge with tier name (Basic/Premium)
// - Star icon
// - Links to /my-clinics/{clinicId}/featured
// - Amber/gold styling for premium, yellow for basic
```

**My-Clinics Page Update** (`src/app/(owner)/my-clinics/page.tsx`):
- Lines 163-170: Replace conditional render
- If `clinic.featuredSubscriptions?.[0]?.status === 'active'`:
  - Show SubscriptionStatusBadge with tier
- Else:
  - Show existing "Get Featured" button

---

## Phase 3: Search Results Visual Enhancements

Add featured badges and highlighting to clinic cards in state/city directory pages.

### Tasks

- [x] Create reusable FeaturedBadge component
- [x] Update state-page.tsx to show badges and highlighting
- [x] Update city-page.tsx to show badges and highlighting

### Technical Details

**FeaturedBadge Component** (`src/components/ui/featured-badge.tsx`):
```tsx
interface FeaturedBadgeProps {
  tier: 'basic' | 'premium' | 'none';
  size?: 'sm' | 'md';
  className?: string;
}

// Visual specs:
// Basic: yellow-500 bg, Star icon, "Featured" text
// Premium: amber gradient, shimmer animation, Star icon, "Premium" text
// Reuse shimmer classes from featured-clinic-card.tsx:
// - premium-badge-shimmer
// - premium-badge-glow
```

**State Page Update** (`src/app/pain-management/state-page.tsx`):
- Lines 176-212 (clinic card rendering)
- Add FeaturedBadge after clinic title
- Add card highlighting classes:
  ```tsx
  className={cn(
    "block rounded-lg border p-4 hover:bg-muted/50 transition-colors",
    clinic.featuredTier === 'premium' && "border-amber-300 bg-amber-50/30 dark:border-amber-700/50 dark:bg-amber-950/20 ring-1 ring-amber-200/50",
    clinic.featuredTier === 'basic' && clinic.isFeatured && "border-yellow-200 bg-yellow-50/20 dark:border-yellow-800/50 dark:bg-yellow-950/10"
  )}
  ```

**City Page Update** (`src/app/pain-management/city-page.tsx`):
- Lines 194-261 (similar structure to state page)
- Same badge and highlighting implementation

**Data Availability**:
- Both pages use queries from `clinic-queries.ts`
- `isFeatured` and `featuredTier` already included in query results
- No query changes needed

---

## Phase 4: Map Marker Verification

Verify featured tier data flows correctly to map markers. Markers already support tier-aware styling.

### Tasks

- [x] Verify ClinicMap passes featuredTier to markers
- [x] Test map markers show correct styling for all tiers

### Technical Details

**ClinicMarker Component** (`src/components/map/clinic-marker.tsx`):
Already correctly implements:
- Premium: `h-10 w-10`, gold gradient, Star icon
- Basic: `h-8 w-8`, yellow-500 background
- Regular: `h-8 w-8`, primary color

**Verification Points**:
1. `src/components/map/clinic-map.tsx` - Check marker rendering passes `featuredTier`
2. `src/components/home/nearby-clinics-section.tsx` - Check homepage map
3. `src/components/map/embedded-map.tsx` - Individual clinic page map

If `featuredTier` not passed, update marker instantiation:
```tsx
<ClinicMarker
  isFeatured={clinic.isFeatured}
  featuredTier={clinic.featuredTier || 'none'}
  // ...other props
/>
```

---

## Phase 5: Premium Analytics Dashboard [complex]

Create analytics dashboard for Premium subscribers showing page views and traffic insights.

### Tasks

- [x] Create owner analytics query functions
- [x] Create analytics dashboard page
- [x] Add analytics link to clinic management page
- [x] Implement access control (Premium only)

### Technical Details

**Analytics Queries** (`src/lib/analytics/owner-analytics.ts`):
```typescript
export interface OwnerAnalyticsData {
  totalViews: number;
  viewsByDay: { date: string; views: number }[];
  topReferrers: { source: string; count: number }[];
  previousPeriodViews: number;
  percentChange: number;
}

export async function getOwnerClinicAnalytics(
  clinicId: string,
  ownerId: string,
  days: number = 30
): Promise<OwnerAnalyticsData>
```

**Query Implementation**:
```sql
-- Views by day
SELECT DATE(created_at) as date, COUNT(*) as views
FROM analytics_events
WHERE page_path LIKE '/pain-management/%{clinicSlug}%'
  AND created_at > NOW() - INTERVAL '{days} days'
GROUP BY DATE(created_at)
ORDER BY date DESC

-- Top referrers
SELECT referrer, COUNT(*) as count
FROM analytics_events
WHERE page_path LIKE '/pain-management/%{clinicSlug}%'
  AND created_at > NOW() - INTERVAL '{days} days'
  AND referrer IS NOT NULL
GROUP BY referrer
ORDER BY count DESC
LIMIT 10
```

**Dashboard Page** (`src/app/(owner)/my-clinics/[clinicId]/analytics/page.tsx`):
```tsx
// Access control:
const { clinic } = await requireClinicOwnership(clinicId);
if (clinic.featuredTier !== 'premium') {
  // Show upgrade prompt or redirect
}

// Components:
// - Chart showing views over time (use recharts, already in project)
// - Stats cards: Total views, change %, top referrer
// - Table of referrer sources
```

**Management Page Update** (`src/app/(owner)/my-clinics/[clinicId]/page.tsx`):
- Add Analytics card in quick actions grid
- Only show if Premium tier
```tsx
{clinic.featuredTier === 'premium' && (
  <Card className="cursor-pointer hover:bg-muted/50">
    <Link href={`/my-clinics/${clinicId}/analytics`}>
      <CardContent className="p-4 flex items-center gap-3">
        <BarChart className="h-5 w-5" />
        <span>Analytics</span>
      </CardContent>
    </Link>
  </Card>
)}
```

---

## Phase 6: Premium Photo Uploads [complex]

Implement photo upload functionality with tier-based limits.

### Tasks

- [x] Create photo upload API endpoint
- [x] Create photo upload component with drag & drop
- [x] Update photos page with real upload functionality
- [x] Implement tier-based limits (Basic: 5, Premium: 50)

### Technical Details

**API Endpoint** (`src/app/api/owner/clinics/[clinicId]/photos/route.ts`):
```typescript
// POST - Upload photo
// - Verify ownership
// - Check tier limits
// - Upload to Vercel Blob
// - Update clinic.clinicImageUrls array
// - Return new image URL

// DELETE - Remove photo
// - Verify ownership
// - Remove from Vercel Blob
// - Update clinic.clinicImageUrls

// Limits:
const PHOTO_LIMITS = {
  none: 0,
  basic: 5,
  premium: 50, // "unlimited" but with reasonable cap
};
```

**Vercel Blob Usage**:
```typescript
import { put, del } from '@vercel/blob';

// Upload
const blob = await put(`clinics/${clinicId}/${filename}`, file, {
  access: 'public',
  contentType: file.type,
});

// Delete
await del(imageUrl);
```

**Photo Upload Component** (`src/components/owner/photo-upload.tsx`):
```tsx
interface PhotoUploadProps {
  clinicId: string;
  currentPhotos: string[];
  maxPhotos: number;  // Based on tier
  onUpload: (url: string) => void;
  onDelete: (url: string) => void;
}

// Features:
// - Drag & drop zone
// - File input fallback
// - Upload progress indicator
// - Preview grid
// - Delete confirmation
// - Limit display: "3 of 5 photos used"
```

**Photos Page Update** (`src/app/(owner)/my-clinics/[clinicId]/photos/page.tsx`):
- Remove "Coming Soon" alert
- Determine photo limit based on tier:
  ```typescript
  const photoLimit = clinic.featuredTier === 'premium' ? 50
    : clinic.featuredTier === 'basic' ? 5
    : 0;
  ```
- If limit is 0, show upgrade prompt
- Otherwise render PhotoUpload component

**Schema Update** (optional, if needed):
- `clinicImageUrls` already exists as `text[]` in clinics table
- No schema changes required

---

## Summary

| Phase | Focus | Complexity |
|-------|-------|------------|
| 1 | Email Notifications | Low |
| 2 | Owner Portal Status | Low |
| 3 | Search Visual Enhancements | Medium |
| 4 | Map Verification | Low |
| 5 | Analytics Dashboard | High |
| 6 | Photo Uploads | High |

**Recommended Order**: 1 → 2 → 3 → 4 → 5 → 6

Phases 1-4 can be deployed quickly for immediate value. Phases 5-6 are premium features that can be implemented in a second release.
