# Implementation Plan: Custom Analytics System

## Overview

Build a privacy-first analytics system with:
- Database table for analytics events
- Tracking API with bot filtering
- Client-side tracker component
- Admin dashboard with charts
- Clinic owner widget

**Estimated Time:** 5-7 hours

---

## Phase 1: Database & Core Infrastructure

Set up the database schema and core utility functions for analytics.

### Tasks

- [x] Add `analyticsEvents` table to database schema
- [x] Run database migration
- [x] Create bot filtering utility (`src/lib/analytics/bot-filter.ts`)
- [x] Create referrer categorization utility (`src/lib/analytics/referrer-utils.ts`)
- [x] Create session hash utility (`src/lib/analytics/session-hash.ts`)
- [x] Create analytics query functions (`src/lib/analytics/queries.ts`)

### Technical Details

**Database Schema** (`src/lib/schema.ts`):

```typescript
export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    eventType: text("event_type").notNull(), // "pageview" | "clinic_view"
    path: text("path").notNull(),
    clinicId: text("clinic_id").references(() => clinics.id, { onDelete: "set null" }),
    referrer: text("referrer"),
    referrerSource: text("referrer_source"), // "google" | "direct" | "facebook" | etc.
    referrerDomain: text("referrer_domain"),
    sessionHash: text("session_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    eventDate: text("event_date").notNull(), // YYYY-MM-DD for grouping
  },
  (table) => [
    index("analytics_events_event_type_idx").on(table.eventType),
    index("analytics_events_path_idx").on(table.path),
    index("analytics_events_clinic_idx").on(table.clinicId),
    index("analytics_events_referrer_source_idx").on(table.referrerSource),
    index("analytics_events_session_hash_idx").on(table.sessionHash),
    index("analytics_events_created_at_idx").on(table.createdAt),
    index("analytics_events_event_date_idx").on(table.eventDate),
  ]
);
```

**Migration Commands:**
```bash
pnpm db:generate
pnpm db:push
```

**Bot Filter Patterns** (`src/lib/analytics/bot-filter.ts`):
```typescript
const BOT_UA_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /slurp/i, /googlebot/i,
  /bingbot/i, /yandex/i, /baidu/i, /duckduckbot/i,
  /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
  /applebot/i, /semrush/i, /ahrefs/i, /mj12bot/i,
  /dotbot/i, /petalbot/i, /bytespider/i,
  /headless/i, /phantom/i, /selenium/i, /puppeteer/i,
];

export function isBot(userAgent: string | null): boolean {
  if (!userAgent) return true;
  return BOT_UA_PATTERNS.some(pattern => pattern.test(userAgent));
}
```

**Referrer Categorization** (`src/lib/analytics/referrer-utils.ts`):
- `google` - google.com domains
- `bing` - bing.com
- `facebook` - facebook.com, fb.com
- `twitter` - twitter.com, t.co, x.com
- `linkedin`, `instagram`, `pinterest`, `reddit`, `tiktok`, `youtube`
- `direct` - no referrer
- `internal` - same domain
- `referral` - other domains

**Session Hash** (`src/lib/analytics/session-hash.ts`):
```typescript
// Combine fingerprint + IP + date for daily unique visitor tracking
// SHA-256 hash, truncated to 32 chars
```

---

## Phase 2: Tracking API

Create the API endpoint that receives and records analytics events.

### Tasks

- [x] Create tracking API route (`src/app/api/analytics/track/route.ts`)
- [x] Implement request validation
- [x] Implement bot filtering
- [x] Implement referrer categorization
- [x] Implement session hashing
- [x] Insert events to database

### Technical Details

**API Endpoint:** `POST /api/analytics/track`

**Request Body:**
```typescript
interface TrackRequest {
  eventType: "pageview" | "clinic_view";
  path: string;
  clinicId?: string; // Required for clinic_view
  referrer?: string;
  fingerprint: string; // Client-generated
}
```

**Response:**
```typescript
{ success: boolean }
```

**Implementation Flow:**
1. Parse request body
2. Get user agent from headers
3. If `isBot(userAgent)` → return success (silently ignore)
4. Categorize referrer → `{ source, domain }`
5. Generate session hash from fingerprint + IP + date
6. Insert event with `eventDate` = YYYY-MM-DD format
7. Return success

**File:** `src/app/api/analytics/track/route.ts`

---

## Phase 3: Client Tracker

Create the client-side component that sends tracking data.

### Tasks

- [x] Create PageTracker component (`src/components/analytics/page-tracker.tsx`)
- [x] Implement browser fingerprint generation
- [x] Implement deduplication (same page in same session)
- [x] Add PageTracker to root layout (`src/app/layout.tsx`)
- [x] Add PageTracker with clinicId to clinic detail page (`src/app/pain-management/[...slug]/page.tsx`)

### Technical Details

**Component:** `src/components/analytics/page-tracker.tsx`

```typescript
"use client";

interface PageTrackerProps {
  clinicId?: string;
}

export function PageTracker({ clinicId }: PageTrackerProps) {
  // Uses useEffect to track on mount
  // Generates fingerprint from: UA, language, screen size, timezone
  // Prevents duplicate tracking with useRef Set
  // Uses fetch with keepalive: true (fire and forget)
  // Delays 100ms to not block initial paint
  return null;
}
```

**Fingerprint Generation:**
```typescript
const generateFingerprint = (): string => {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
  ];
  return btoa(components.join("|")).slice(0, 32);
};
```

**Root Layout Integration** (`src/app/layout.tsx`):
```tsx
import { PageTracker } from "@/components/analytics/page-tracker";
// Add near end of body: <PageTracker />
```

**Clinic Page Integration** (`src/app/pain-management/[...slug]/page.tsx`):
```tsx
<PageTracker clinicId={clinic.id} />
```

---

## Phase 4: Install Charts

Install Recharts and shadcn/ui chart component.

### Tasks

- [x] Install Recharts package
- [x] Add shadcn/ui chart component

### Technical Details

**Commands:**
```bash
pnpm add recharts
pnpm dlx shadcn@latest add chart
```

The shadcn/ui chart component provides:
- `ChartContainer` - Wrapper with theme support
- `ChartTooltip` / `ChartTooltipContent` - Styled tooltips
- `ChartLegend` / `ChartLegendContent` - Styled legends

---

## Phase 5: Admin Dashboard [complex]

Create the admin analytics dashboard with all visualizations.

### Tasks

- [x] Create admin analytics API route (`src/app/api/admin/analytics/route.ts`)
- [x] Create admin analytics page (`src/app/admin/analytics/page.tsx`)
- [x] Create analytics client component (`src/app/admin/analytics/traffic-analytics-client.tsx`) [complex]
  - [x] Stats cards (pageviews, visitors)
  - [x] Date range selector
  - [x] Top referrers table
  - [x] Top pages table
  - [x] Line chart (views over time)
- [x] Add Analytics link to admin sidebar

### Technical Details

**API Endpoint:** `GET /api/admin/analytics`

**Query Parameters:**
- `range`: "today" | "7d" | "30d" | "all" (default: "30d")

**Response:**
```typescript
{
  overview: {
    totalPageviews: number;
    uniqueVisitors: number;
    clinicViews: number;
  };
  referrers: { source: string; count: number }[];
  topPages: { path: string; views: number; uniqueVisitors: number }[];
  viewsOverTime: { date: string; views: number; uniqueVisitors: number }[];
}
```

**Page Structure:**
```
/admin/analytics/
  page.tsx              # Server component with requireAdmin()
  analytics-client.tsx  # Client component with all UI
```

**Client Component Features:**
- Date range tabs: Today | 7 Days | 30 Days | All Time
- Stats cards grid (following pattern from stats-client.tsx)
- Tables using shadcn/ui Table component
- Line chart using Recharts LineChart

**Admin Sidebar** (`src/components/admin/admin-sidebar.tsx`):
Add navigation item:
```tsx
{ href: "/admin/analytics", icon: BarChart3, label: "Analytics" }
```

---

## Phase 6: Owner Widget

Create the clinic analytics widget for the owner dashboard.

### Tasks

- [x] Create owner analytics API route (`src/app/api/owner/analytics/route.ts`)
- [x] Create clinic analytics widget (`src/components/owner/clinic-analytics-widget.tsx`)
- [x] Add widget to clinic overview page (`src/app/(owner)/my-clinics/[clinicId]/page.tsx`)

### Technical Details

**API Endpoint:** `GET /api/owner/analytics`

**Query Parameters:**
- `clinicId`: string (required)

**Authentication:** Uses `requireClinicOwnership(clinicId)` pattern

**Response:**
```typescript
{
  totalViews: number;
  uniqueVisitors: number;
  referrers: { source: string; count: number }[];
  viewsOverTime: { date: string; views: number }[];
}
```

**Widget Component:** `src/components/owner/clinic-analytics-widget.tsx`

Features:
- Stats row: Total views, unique visitors (30d)
- Sparkline: Recharts LineChart, 48px height, no axes
- Referrer badges: Top 5 sources as shadcn/ui Badge components

**Integration Point** (`src/app/(owner)/my-clinics/[clinicId]/page.tsx`):
Add after the Quick Actions grid, before Contact Information card:
```tsx
<ClinicAnalyticsWidget clinicId={clinicId} />
```

---

## Phase 7: Finalize

Run validation and verify everything works.

### Tasks

- [x] Run lint and typecheck
- [x] Manually test tracking (check database for events)
- [x] Test admin dashboard with date filters
- [x] Test owner widget with owned clinic

### Technical Details

**Validation Commands:**
```bash
pnpm lint
pnpm typecheck
```

**Manual Testing:**
1. Visit several pages, check `analytics_events` table
2. Visit a clinic page, verify `clinic_view` event with clinicId
3. Open admin dashboard, verify data displays
4. Open owner dashboard for a clinic, verify widget shows data
