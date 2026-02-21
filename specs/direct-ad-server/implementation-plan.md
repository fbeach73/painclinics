# Implementation Plan: Direct Ad Server

## Overview

Build an internal ad server into painclinics.com that serves direct advertiser campaigns alongside (or instead of) AdSense, with S2S postback conversion tracking and an admin dashboard. A single global percentage controls whether each page load uses hosted ads or AdSense — never mixed on the same page.

---

## Phase 1: Database Schema & Seed Data

Add all ad-related tables to the Drizzle schema and seed the initial placement slots.

### Tasks

- [x] Add ad enums and 8 new tables to `src/lib/schema.ts` (adCampaigns, adCreatives, adPlacements, adCampaignPlacements, adSettings, adImpressions, adClicks, adConversions)
- [x] Run `pnpm db:push` to apply schema changes
- [x] Create seed script `scripts/seed-ad-placements.ts` that inserts the 5 default placements and the adSettings row (depends on db:push)
- [x] Run seed script against production DB

### Technical Details

**New enums:**
```ts
export const adStatusEnum = pgEnum("ad_status", ["active", "paused", "ended"]);
export const adCreativeTypeEnum = pgEnum("ad_creative_type", ["image_banner", "html", "text", "native"]);
export const adPageTypeEnum = pgEnum("ad_page_type", ["clinic", "directory", "blog", "homepage"]);
```

**Table definitions (Drizzle):**

```ts
// adCampaigns
export const adCampaigns = pgTable("ad_campaigns", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  advertiserName: text("advertiser_name").notNull(),
  status: adStatusEnum("status").default("paused").notNull(),
  notes: text("notes"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

// adCreatives — single table with nullable fields per creative type
export const adCreatives = pgTable("ad_creatives", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  campaignId: text("campaign_id").notNull().references(() => adCampaigns.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: adCreativeTypeEnum("type").notNull(),
  weight: integer("weight").default(1).notNull(),
  status: adStatusEnum("status").default("active").notNull(),
  // image_banner fields
  imageUrl: text("image_url"),
  altText: text("alt_text"),
  width: integer("width"),
  height: integer("height"),
  // html fields
  htmlContent: text("html_content"),
  // text fields
  headline: text("headline"),
  description: text("description"),
  displayUrl: text("display_url"),
  // native fields
  logoUrl: text("logo_url"),
  ctaText: text("cta_text"),
  // shared
  destinationUrl: text("destination_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

// adPlacements
export const adPlacements = pgTable("ad_placements", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(), // e.g. "clinic-above-fold"
  pageType: adPageTypeEnum("page_type").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// adCampaignPlacements — junction
export const adCampaignPlacements = pgTable("ad_campaign_placements", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  campaignId: text("campaign_id").notNull().references(() => adCampaigns.id, { onDelete: "cascade" }),
  placementId: text("placement_id").notNull().references(() => adPlacements.id, { onDelete: "cascade" }),
  weight: integer("weight").default(1).notNull(),
}, (table) => [
  uniqueIndex("campaign_placement_unique").on(table.campaignId, table.placementId),
]);

// adSettings — global config, single row
export const adSettings = pgTable("ad_settings", {
  id: integer("id").primaryKey().default(1),
  adServerPercentage: integer("ad_server_percentage").default(0).notNull(), // 0-100
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),
});

// adImpressions
export const adImpressions = pgTable("ad_impressions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  creativeId: text("creative_id").notNull().references(() => adCreatives.id),
  placementId: text("placement_id").notNull().references(() => adPlacements.id),
  clickId: text("click_id").notNull().unique(), // UUID for S2S tracking
  path: text("path").notNull(),
  sessionHash: text("session_hash"),
  eventDate: text("event_date").notNull(), // YYYY-MM-DD in AST
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ad_impressions_event_date_idx").on(table.eventDate),
  index("ad_impressions_creative_idx").on(table.creativeId),
  index("ad_impressions_click_id_idx").on(table.clickId),
]);

// adClicks
export const adClicks = pgTable("ad_clicks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clickId: text("click_id").notNull().references(() => adImpressions.clickId),
  path: text("path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ad_clicks_click_id_idx").on(table.clickId),
]);

// adConversions
export const adConversions = pgTable("ad_conversions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  clickId: text("click_id").notNull().unique(), // one conversion per click
  payout: numeric("payout", { precision: 10, scale: 4 }).notNull(),
  advertiserData: jsonb("advertiser_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("ad_conversions_click_id_idx").on(table.clickId),
]);
```

**Seed placements (scripts/seed-ad-placements.ts):**
```ts
// Uses drizzle-orm/postgres-js like other scripts
// Inserts 5 rows into adPlacements:
// - { name: "clinic-above-fold", pageType: "clinic", description: "Below breadcrumbs on clinic detail page" }
// - { name: "clinic-mid-content", pageType: "clinic", description: "Between content sections on clinic detail page" }
// - { name: "directory-in-list", pageType: "directory", description: "After 3rd clinic card in state/city listings" }
// - { name: "homepage-mid", pageType: "homepage", description: "Between featured section and popular searches" }
// - { name: "blog-mid-content", pageType: "blog", description: "Mid-content in blog posts" }
// Inserts 1 row into adSettings:
// - { id: 1, adServerPercentage: 0 } (starts with 0% = AdSense only)
// Uses ON CONFLICT DO NOTHING for idempotency
```

**Commands:**
```bash
pnpm db:push
pnpm tsx scripts/seed-ad-placements.ts
```

---

## Phase 2: Ad Serving Core (Decision + Selection + Rendering)

Build the server-side logic that decides AdSense vs hosted and renders the appropriate creative.

### Tasks

- [x] Create `src/lib/ad-decision.ts` — `shouldUseHostedAds()` function that reads global percentage and returns boolean
- [x] Create `src/lib/ad-queries.ts` — `getAdForPlacement(placementName, path)` function that selects a creative by weighted random from eligible campaigns, records an impression, returns creative data + clickId
- [x] Create `src/lib/ad-utils.ts` — weighted random selection helper, click URL builder
- [x] Create `src/components/ads/AdSlot.tsx` — server component that receives `placement` + `path` + `useHostedAds`, renders AdSense or hosted creative (depends on ad-queries, ad-decision)
- [x] Create `src/components/ads/creatives/BannerAd.tsx` — image banner with click-tracking link
- [x] Create `src/components/ads/creatives/HtmlAd.tsx` — HTML creative renderer
- [x] Create `src/components/ads/creatives/TextAd.tsx` — text ad layout
- [x] Create `src/components/ads/creatives/NativeAd.tsx` — native card styled to site design

### Technical Details

**`src/lib/ad-decision.ts`:**
```ts
// Fetches adSettings.adServerPercentage from DB (cache with unstable_cache, revalidate: 60)
// Returns: Math.random() * 100 < percentage
// Called ONCE per page render at the page component level
// Result passed as prop to all <AdSlot> instances on that page
// If percentage is 0, short-circuit to false (AdSense only)
```

**`src/lib/ad-queries.ts` — `getAdForPlacement()`:**
```ts
// 1. Fetch placement by name (WHERE name = placementName AND isActive = true)
// 2. Fetch all campaign-placement assignments for that placement
//    JOIN adCampaigns WHERE status = 'active' AND (startDate IS NULL OR startDate <= now) AND (endDate IS NULL OR endDate >= now)
// 3. For each eligible campaign, fetch active creatives
// 4. Build weighted pool: each creative's effective weight = creative.weight * campaignPlacement.weight
// 5. Weighted random select one creative
// 6. Generate clickId (crypto.randomUUID())
// 7. Record impression row (creativeId, placementId, clickId, path, sessionHash, eventDate)
// 8. Return { creative, clickId, clickUrl } or null if no eligible creatives
```

**`src/lib/ad-utils.ts`:**
```ts
export function weightedRandomSelect<T extends { weight: number }>(items: T[]): T | null
// Sum weights, random * total, iterate to find selection

export function buildClickUrl(clickId: string, destinationUrl: string): string
// Returns: /api/ads/click?click_id=${clickId}&dest=${encodeURIComponent(destinationUrl)}
```

**`src/components/ads/AdSlot.tsx`:**
```tsx
// Server component
// Props: { placement: string; path: string; useHostedAds: boolean }
// If !useHostedAds → render <AdPlacement><InPageAd /></AdPlacement> (existing AdSense)
// If useHostedAds → call getAdForPlacement(placement, path)
//   If null (no active creative) → fall back to AdSense
//   If creative → render based on type: BannerAd | HtmlAd | TextAd | NativeAd
// Wrapped in same <AdPlacement> container for consistent "Advertisement" label and sizing
```

**Creative components** all receive `{ creative, clickUrl }` props and render within the existing `AdPlacement` wrapper dimensions. Click-through links all use the `/api/ads/click` redirect URL.

---

## Phase 3: Click Tracking & S2S Postback API

Build the public API endpoints for click tracking and advertiser postback.

### Tasks

- [x] Create `src/app/api/ads/click/route.ts` — GET endpoint that records click + 302 redirects to destination
- [x] Create `src/app/api/ads/postback/route.ts` — GET endpoint that records conversion from advertiser S2S callback

### Technical Details

**`/api/ads/click` (GET):**
```ts
// Query params: click_id (required), dest (required, URL-encoded destination)
// 1. Validate click_id exists in adImpressions
// 2. Insert row into adClicks { clickId, path: request referrer or null }
// 3. Return NextResponse.redirect(decodeURIComponent(dest), { status: 302 })
// No auth required — public endpoint
// Rate limiting: optional, by IP
```

**`/api/ads/postback` (GET):**
```ts
// Query params: click_id (required), payout (required, numeric)
// All other query params stored in advertiserData jsonb
// 1. Validate click_id exists in adImpressions
// 2. INSERT INTO adConversions { clickId, payout, advertiserData }
//    ON CONFLICT (clickId) DO NOTHING — idempotent, first write wins
// 3. Return 200 OK with { success: true }
// No auth required — advertisers fire this URL server-to-server
// Example: https://painclinics.com/api/ads/postback?click_id=abc123&payout=12.50&offer_id=456
```

---

## Phase 4: Replace AdSense Components with AdSlot

Swap existing `<InPageAd>` / `<AdPlacement>` usage on all pages with the new `<AdSlot>` component, threading the page-level decision.

### Tasks

- [x] Update `src/app/pain-management/[...slug]/page.tsx` — call `shouldUseHostedAds()` once, pass result to 2 `<AdSlot>` instances (clinic-above-fold, clinic-mid-content)
- [x] Update state/city directory pages — call `shouldUseHostedAds()` once, pass to `<AdSlot placement="directory-in-list">` [complex]
  - [x] Update `src/app/pain-management/[state]/page.tsx`
  - [x] Update `src/app/pain-management/[state]/[city]/page.tsx`
  - [x] Update any shared directory layout component that currently renders `<InPageAd>`
- [x] Update `src/app/page.tsx` (homepage) — call `shouldUseHostedAds()` once, pass to `<AdSlot placement="homepage-mid">`
- [x] Add `<AdSlot placement="blog-mid-content">` to blog post page `src/app/blog/[slug]/page.tsx`
- [x] Verify existing `<DeferredAdSense>` in layout.tsx still loads only when AdSense slots are active (no change needed if AdSlot handles this)

### Technical Details

**Pattern for each page:**
```tsx
// In each page's server component:
import { shouldUseHostedAds } from "@/lib/ad-decision";
import { AdSlot } from "@/components/ads/AdSlot";

export default async function ClinicPage({ params }) {
  const useHostedAds = await shouldUseHostedAds();
  // ... existing data fetching ...
  return (
    <>
      {/* ... existing content ... */}
      <AdSlot placement="clinic-above-fold" path={permalink} useHostedAds={useHostedAds} />
      {/* ... more content ... */}
      <AdSlot placement="clinic-mid-content" path={permalink} useHostedAds={useHostedAds} />
    </>
  );
}
```

**Files to modify:**
- `src/app/pain-management/[...slug]/page.tsx` — replace 2 `<AdPlacement><InPageAd /></AdPlacement>` blocks
- `src/app/pain-management/[state]/page.tsx` or directory layout component — replace 1 ad block
- `src/app/pain-management/[state]/[city]/page.tsx` — replace 1 ad block
- `src/app/page.tsx` — replace 1 ad block
- `src/app/blog/[slug]/page.tsx` — add new ad block (no existing ad here)

**Important:** Keep `<InPageAd>` and `<AdPlacement>` components intact — `<AdSlot>` renders them internally for AdSense mode.

---

## Phase 5: Admin CRUD — Campaigns & Creatives

Build the admin interface for managing campaigns, creatives, and placement assignments.

### Tasks

- [x] Add "Ads" nav item to `src/components/admin/admin-sidebar.tsx`
- [x] Create `src/app/api/admin/ads/campaigns/route.ts` — GET (list all campaigns with stats) and POST (create campaign)
- [x] Create `src/app/api/admin/ads/campaigns/[id]/route.ts` — GET (detail + creatives), PATCH (update), DELETE
- [x] Create `src/app/api/admin/ads/creatives/route.ts` — POST (create creative under campaign)
- [x] Create `src/app/api/admin/ads/creatives/[id]/route.ts` — PATCH (update), DELETE
- [x] Create `src/app/api/admin/ads/placements/route.ts` — GET (list placements with assignment counts), PATCH (toggle isActive)
- [x] Create `src/app/api/admin/ads/campaign-placements/route.ts` — POST (assign campaign to placement), DELETE (remove assignment)
- [x] Create `src/app/api/admin/ads/settings/route.ts` — GET and PATCH for adSettings (global ad server percentage)
- [x] Create `src/app/admin/ads/campaigns/page.tsx` — campaign list table (server page + client table) [complex]
  - [x] Campaign list with name, advertiser, status, date range, impressions, clicks, CTR columns
  - [x] Status badge (active/paused/ended), create new button
- [x] Create `src/app/admin/ads/campaigns/new/page.tsx` — create campaign form
- [x] Create `src/app/admin/ads/campaigns/[id]/page.tsx` — campaign detail: edit form, creative management, placement assignments, per-creative stats [complex]
  - [x] Edit campaign fields
  - [x] Add/remove creatives with type-specific forms (image, html, text, native)
  - [x] Assign/unassign placements with weight controls
  - [x] Per-creative stats table (impressions, clicks, CTR, conversions, revenue)
- [x] Create `src/app/admin/ads/placements/page.tsx` — placement list with active toggle and global percentage slider

### Technical Details

**Admin auth:** All `/api/admin/ads/*` routes use `checkAdminApi()` from `src/lib/admin-auth.ts` — same pattern as existing admin routes.

**API response patterns follow existing conventions:**
```ts
// List: { campaigns: [...], totalCount: number }
// Detail: { campaign: {...}, creatives: [...], placements: [...] }
// Create: { campaign: {...} }
// Update: { campaign: {...} }
// Delete: { success: true }
```

**Campaign form fields:** name, advertiserName, status (select), notes (textarea), startDate, endDate (date pickers)

**Creative form — type-specific fields:**
- image_banner: imageUrl (text input or file upload), destinationUrl, altText, width, height
- html: htmlContent (textarea/code editor), destinationUrl
- text: headline, description, destinationUrl, displayUrl
- native: logoUrl, headline, description, ctaText, destinationUrl

**Global settings endpoint:**
```ts
// GET /api/admin/ads/settings → { adServerPercentage: number }
// PATCH /api/admin/ads/settings → { adServerPercentage: number } (body: { adServerPercentage: 0-100 })
// Validates 0 <= value <= 100
```

**Sidebar nav item** added to `src/components/admin/admin-sidebar.tsx`:
```ts
{ href: "/admin/ads", label: "Ads", icon: Megaphone }
// Position: after Analytics, before Stats
```

---

## Phase 6: Admin Dashboard & Reporting

Build the analytics dashboard showing ad performance metrics.

### Tasks

- [x] Create `src/lib/ad-stats-queries.ts` — aggregation queries for dashboard stats
- [x] Create `src/app/api/admin/ads/stats/route.ts` — GET endpoint with date range filter
- [x] Create `src/app/admin/ads/page.tsx` — main ads dashboard page [complex]
  - [x] Summary cards: total impressions, clicks, CTR, conversions, revenue, eCPM
  - [x] Line chart: impressions/clicks/revenue over time (daily)
  - [x] Top performing creatives table
  - [x] Global ad server percentage control (slider + save)
- [x] Create `src/app/admin/ads/conversions/page.tsx` — conversion log table with click ID, campaign, creative, payout, timestamp

### Technical Details

**`src/lib/ad-stats-queries.ts`:**
```ts
// getAdOverviewStats(range: "today" | "7d" | "30d" | "all")
// Returns: { impressions, clicks, ctr, conversions, revenue, ecpm }
// Uses same date range pattern as existing analytics queries (AST timezone)

// getAdStatsOverTime(range)
// Returns: [{ date, impressions, clicks, conversions, revenue }]
// GROUP BY eventDate, ordered ascending

// getTopCreatives(range, limit = 10)
// Returns: [{ creativeId, name, campaignName, impressions, clicks, ctr, conversions, revenue }]
// JOIN adImpressions → adCreatives → adCampaigns
// LEFT JOIN adClicks, adConversions
// ORDER BY revenue DESC or clicks DESC

// getCampaignStats(campaignId, range)
// Returns: same shape but filtered to one campaign
```

**Dashboard page** uses same patterns as `src/app/admin/analytics/` — server page fetches data, passes to client component for charts.

**Date range selector** reuses the existing analytics date range pattern ("today", "7d", "30d", "all").

**eCPM calculation:** `(revenue / impressions) * 1000` — key metric for comparing against AdSense.

---

## Verification

1. `pnpm db:push` then run seed script
2. Create 1 test campaign + 1 image banner creative in admin UI
3. Assign creative to `clinic-above-fold` placement
4. Set global ad server percentage to 100% (all pages use hosted ads)
5. Visit a clinic page — should see test creative instead of AdSense
6. Click the ad — verify redirect works, adClicks row created
7. Hit `/api/ads/postback?click_id=xxx&payout=10.00` — verify adConversions row
8. Check admin dashboard shows the impression/click/conversion with correct eCPM
9. Set percentage to 0% — verify AdSense renders on all pages again
10. `pnpm lint && pnpm typecheck`
