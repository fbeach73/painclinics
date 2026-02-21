# Requirements: Direct Ad Server

## What & Why

painclinics.com currently monetizes with Google AdSense across clinic, directory, blog, and homepage placements. The site owner has direct relationships with health/pain-niche advertisers and a media buying background. Building an internal ad server allows:

- Running direct advertiser campaigns with higher CPMs (no Google 32% cut)
- S2S (server-to-server) postback tracking for conversion attribution
- A/B comparison of direct ads vs AdSense at the page level
- Full control over creative formats, rotation, and optimization
- An admin dashboard showing impressions, clicks, CTR, conversions, revenue, and eCPM

## Core Concept: Page-Level Ad Source Split

A single global setting (`adServerPercentage`, 0-100) controls which ad source serves an entire page:

- On each page load, one server-side random roll determines the whole page
- If the roll falls within the ad server percentage → **all** ad slots on that page render hosted/direct ads
- Otherwise → **all** ad slots render AdSense (current behavior, unchanged)
- AdSense and hosted ads are **never mixed** on the same page load
- Falls back to AdSense if no active campaigns/creatives exist or on error

## Acceptance Criteria

### Campaign & Creative Management
- [ ] Admin can create campaigns with advertiser name, date range, status, notes
- [ ] Admin can add creatives to campaigns: image banner, HTML, text, or native card format
- [ ] Creatives have configurable rotation weights within a campaign
- [ ] Campaigns can be assigned to specific placement slots with per-assignment weights

### Ad Placements
- [ ] 5 placement slots matching existing AdSense positions: clinic-above-fold, clinic-mid-content, directory-in-list, homepage-mid, blog-mid-content
- [ ] Each placement has an active/inactive toggle
- [ ] New placements can be added without code changes (data-driven)

### Ad Serving
- [ ] `<AdSlot>` server component replaces current `<InPageAd>` / `<AdPlacement>` wrappers
- [ ] Page-level decision (hosted vs AdSense) made once per render, threaded to all slots
- [ ] Weighted random creative selection across eligible campaigns for each slot
- [ ] Impressions recorded server-side on every direct ad serve (one row per serve)
- [ ] Each impression gets a unique `clickId` (UUID) for S2S tracking

### Click Tracking
- [ ] All direct ad links route through `/api/ads/click?click_id=xxx&dest=encodedUrl`
- [ ] Click endpoint records the click and 302-redirects to the destination
- [ ] Click ID is appended to advertiser destination URLs for S2S attribution

### S2S Postback
- [ ] Public endpoint: `GET /api/ads/postback?click_id=xxx&payout=yyy`
- [ ] Records conversion with payout amount against the original click
- [ ] Idempotent by clickId (first write wins)
- [ ] Extra query params stored in `advertiserData` jsonb

### Admin Dashboard
- [ ] Overview page: total impressions, clicks, CTR, conversions, revenue, eCPM — filterable by date range
- [ ] Chart: impressions/clicks/revenue over time
- [ ] Top performing creatives table
- [ ] Campaign list with status, date range, impression/click/conversion counts
- [ ] Campaign detail page: edit campaign, manage creatives, view per-creative stats
- [ ] Placements page: list all slots, toggle active/inactive
- [ ] Global settings: ad server percentage slider (0-100)
- [ ] Conversion log: table of all postback events with click ID, payout, timestamp

### Creative Formats
- [ ] **Image banner**: WebP/PNG/JPG image, destination URL, alt text, width/height
- [ ] **HTML/rich media**: Raw HTML content with destination URL
- [ ] **Text ad**: Headline, description, destination URL, display URL
- [ ] **Native card**: Logo, headline, description, CTA button text, destination URL — styled to blend with site design

## Dependencies

- Existing AdSense setup (`src/components/ads/InPageAd.tsx`, `DeferredAdSense`)
- Existing analytics session hash utility (`src/lib/analytics/`)
- Existing admin auth pattern (`checkAdminApi()`)
- Drizzle ORM schema (`src/lib/schema.ts`)

## Non-Goals (for now)

- Frequency capping per user
- Geographic targeting
- Dayparting / time-of-day scheduling
- Programmatic/RTB integration
- Creative A/B testing within a single slot (handled by weight rotation)
