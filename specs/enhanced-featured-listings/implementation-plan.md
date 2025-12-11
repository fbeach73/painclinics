# Implementation Plan: Enhanced Featured Listings System

## Overview

Build a multi-location featured clinics carousel system with geo-aware display, random fallback rotation, larger card sizes, and animated badges. The carousel will appear on the homepage hero area, above search results, and as a sidebar widget on clinic detail pages.

## Phase 1: Core Carousel Component & Animated Badges

Create the foundational carousel component and badge animations that will be reused across all placements.

### Tasks

- [x] Install shadcn/ui carousel component (embla-carousel based)
- [x] Create `FeaturedClinicsCarousel` component with responsive card sizing
- [x] Add pulse/glow animation CSS for featured badges
- [x] Update `FeaturedBadge` component to support animated variant
- [x] Create `FeaturedClinicCard` component (larger variant of ClinicCard)

### Technical Details

**Install carousel:**
```bash
npx shadcn@latest add carousel
```

**Carousel component location:** `src/components/featured/featured-clinics-carousel.tsx`

**Featured card component location:** `src/components/featured/featured-clinic-card.tsx`

**Badge animation CSS (add to globals.css):**
```css
@keyframes badge-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(250, 204, 21, 0);
  }
}

.badge-animate {
  animation: badge-pulse 2s ease-in-out infinite;
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .badge-animate {
    animation: none;
  }
}
```

**FeaturedBadge animated prop:**
```typescript
interface FeaturedBadgeProps {
  tier: FeaturedTier;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean; // New prop
}
```

**FeaturedClinicCard sizing:**
- Carousel context: min-width 320px, max-width 400px
- Show clinic photo (if available), name, rating, distance, address
- Display both Featured AND Verified badges when applicable

---

## Phase 2: API & Data Layer for Featured Clinics

Create API endpoints and database queries to fetch featured clinics with geo-awareness and random fallback.

### Tasks

- [x] Create `getFeaturedClinics` query function with geo and random modes
- [x] Create `GET /api/clinics/featured` API endpoint
- [x] Create `useFeaturedClinics` hook for client-side data fetching
- [x] Add query for context-aware featured clinics (by state/city)

### Technical Details

**Query function location:** `src/lib/clinic-queries.ts`

**getFeaturedClinics function signature:**
```typescript
export async function getFeaturedClinics(options: {
  lat?: number;
  lng?: number;
  radiusMiles?: number;
  stateAbbrev?: string;
  city?: string;
  limit?: number;
  excludeClinicId?: string;
  randomize?: boolean;
}): Promise<ClinicWithDistance[]>
```

**Query logic:**
1. Filter: `isFeatured = true` AND `featuredUntil IS NULL OR featuredUntil > NOW()`
2. If lat/lng provided: Calculate distance, sort by `featuredTier DESC, distance ASC`
3. If stateAbbrev provided: Filter to that state
4. If city provided: Filter to that city
5. If randomize=true (no location): Use `ORDER BY RANDOM()`
6. Exclude `excludeClinicId` if provided (for sidebar widget)

**API endpoint location:** `src/app/api/clinics/featured/route.ts`

**API parameters:**
```
GET /api/clinics/featured?lat=&lng=&radius=50&state=&city=&limit=10&exclude=&random=false
```

**Hook location:** `src/hooks/use-featured-clinics.ts`

**Hook signature:**
```typescript
export function useFeaturedClinics(options: {
  stateAbbrev?: string;
  city?: string;
  excludeClinicId?: string;
  limit?: number;
}): {
  clinics: ClinicWithDistance[];
  isLoading: boolean;
  error: Error | null;
}
```

Hook internally uses `useGeolocation()` to determine if location is available, then fetches with appropriate params.

---

## Phase 3: Homepage Featured Section

Integrate the featured carousel into the homepage hero area, above the existing map section.

### Tasks

- [x] Create `HomepageFeaturedSection` wrapper component
- [x] Integrate carousel above `NearbyClinicsSection` in homepage
- [x] Add section heading with "Featured Clinics" or "Featured Near You"
- [x] Handle loading and empty states gracefully

### Technical Details

**Component location:** `src/components/featured/homepage-featured-section.tsx`

**Homepage integration location:** `src/app/page.tsx`

**Section structure:**
```tsx
<section className="py-8 bg-gradient-to-b from-primary/5 to-transparent">
  <div className="container">
    <h2 className="text-2xl font-bold mb-4">
      {hasLocation ? "Featured Clinics Near You" : "Featured Clinics"}
    </h2>
    <FeaturedClinicsCarousel clinics={featuredClinics} />
  </div>
</section>
```

**Placement:** Between hero text and the interactive map section (NearbyClinicsSection)

**Loading state:** Show skeleton carousel with 3 placeholder cards

**Empty state:** Hide section entirely if no featured clinics exist

---

## Phase 4: Search Results Featured Section

Add featured clinics section above search results on clinic listing pages.

### Tasks

- [x] Create `SearchFeaturedSection` component for search result pages
- [x] Integrate into `/clinics` search results page
- [x] Integrate into state pages (`/pain-management/[state]/`)
- [x] Integrate into city pages (`/pain-management/[state]/[city]/`)
- [x] Pass context (state/city) to show relevant featured clinics

### Technical Details

**Component location:** `src/components/featured/search-featured-section.tsx`

**SearchFeaturedSection props:**
```typescript
interface SearchFeaturedSectionProps {
  stateAbbrev?: string;
  city?: string;
  className?: string;
}
```

**Integration files:**
- `src/app/clinics/page.tsx` - Main search results
- `src/app/pain-management/state-page.tsx` - State listing pages
- `src/app/pain-management/city-page.tsx` - City listing pages

**Context-aware behavior:**
- On state page: Show featured clinics from that state
- On city page: Show featured clinics from that city (fallback to state)
- On search page: Show featured based on search query location or user location

**Section styling:**
```tsx
<section className="mb-8 p-4 bg-yellow-50/50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
  <div className="flex items-center gap-2 mb-4">
    <Star className="h-5 w-5 text-yellow-500" />
    <h2 className="text-lg font-semibold">Featured Clinics</h2>
  </div>
  <FeaturedClinicsCarousel clinics={featuredClinics} variant="compact" />
</section>
```

---

## Phase 5: Sidebar Featured Widget

Create a sticky sidebar widget for clinic detail pages showing other featured clinics.

### Tasks

- [x] Create `FeaturedClinicsSidebar` component
- [x] Integrate sidebar into clinic detail page layout
- [x] Exclude current clinic from sidebar results
- [x] Make sidebar sticky on scroll (desktop only)
- [x] Hide sidebar on mobile (show inline section instead)

### Technical Details

**Component location:** `src/components/featured/featured-clinics-sidebar.tsx`

**Integration location:** `src/app/pain-management/[...slug]/page.tsx` (clinic detail pages only)

**FeaturedClinicsSidebar props:**
```typescript
interface FeaturedClinicsSidebarProps {
  currentClinicId: string;
  stateAbbrev: string;
  city?: string;
}
```

**Desktop layout modification:**
Current clinic page uses 2-column grid. Modify to:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
  {/* Main content - currently 2 cols, now spans 8 */}
  <div className="lg:col-span-8">
    {/* Existing clinic detail content */}
  </div>

  {/* Sidebar - new, spans 4 */}
  <aside className="hidden lg:block lg:col-span-4">
    <div className="sticky top-24">
      <FeaturedClinicsSidebar
        currentClinicId={clinic.id}
        stateAbbrev={clinic.stateAbbreviation}
        city={clinic.city}
      />
    </div>
  </aside>
</div>

{/* Mobile: Show inline section instead */}
<div className="lg:hidden mt-8">
  <SearchFeaturedSection
    stateAbbrev={clinic.stateAbbreviation}
    city={clinic.city}
  />
</div>
```

**Sidebar content:**
- Heading: "Other Featured Clinics"
- Show 3-5 featured clinics in vertical stack
- Smaller card variant for sidebar context
- Show distance if location available

---

## Phase 6: Polish & Edge Cases

Handle edge cases, loading states, and polish the overall experience.

### Tasks

- [x] Add carousel auto-play with 5-second interval
- [x] Implement pause on hover/touch for carousel
- [x] Add keyboard navigation support (left/right arrows)
- [x] Ensure dark mode styling works correctly
- [x] Add empty state messaging when no featured clinics exist
- [x] Test responsive behavior across breakpoints
- [x] Verify reduced motion preference is respected

### Technical Details

**Embla carousel auto-play plugin:**
```bash
pnpm add embla-carousel-autoplay
```

**Auto-play configuration:**
```typescript
import Autoplay from "embla-carousel-autoplay"

<Carousel
  plugins={[
    Autoplay({
      delay: 5000,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    }),
  ]}
  opts={{
    align: "start",
    loop: true,
  }}
>
```

**Keyboard navigation:** Embla supports this natively, ensure it's not disabled

**Dark mode verification files:**
- `src/app/globals.css` - badge animation colors
- All featured component files - check bg/text classes

**Empty state component:**
```tsx
// Only show if admin/owner context, otherwise hide section
{featuredClinics.length === 0 && isAdmin && (
  <p className="text-muted-foreground text-center py-8">
    No featured clinics available.
    <Link href="/admin/subscriptions">Manage subscriptions</Link>
  </p>
)}
```

**Responsive breakpoints:**
- Mobile (<640px): 1 card visible, swipe navigation
- Tablet (640-1024px): 2 cards visible
- Desktop (>1024px): 3-4 cards visible

---

## Phase 7: Admin Manual Featured Control

Add a "Featured" tab to the admin clinic detail page that allows administrators to manually control featured status for any clinic, overriding subscription-based settings.

### Tasks

- [x] Create `admin-clinic-queries.ts` with featured query functions
- [x] Create `PATCH /api/admin/clinics/[clinicId]/featured` API endpoint
- [x] Create `ClinicFeaturedTab` client component with form controls
- [x] Add "Featured" tab to admin clinic detail page

### Technical Details

**Query functions location:** `src/lib/admin-clinic-queries.ts`

```typescript
// Get clinic featured status with subscription context
export async function getClinicFeaturedInfo(clinicId: string): Promise<ClinicFeaturedInfo | null>

// Update clinic featured status (admin override)
export async function updateClinicFeaturedStatus(clinicId: string, data: AdminFeaturedUpdateData)

// Remove featured status from clinic
export async function removeClinicFeaturedStatus(clinicId: string)
```

**API endpoint location:** `src/app/api/admin/clinics/[clinicId]/featured/route.ts`

```typescript
// GET - Fetch featured info with subscription context
// PATCH - Update featured status
//   Body: { isFeatured: boolean, featuredTier?: 'basic'|'premium', featuredUntil?: string }
//   Validation: featuredUntil required when isFeatured=true, must be future date
```

**Component location:** `src/components/admin/clinics/clinic-featured-tab.tsx`

UI includes:
- Current status card showing: featured state, tier, expiration, subscription status
- Warning alert when clinic has active Polar subscription
- Checkbox toggle for featured status
- Select dropdown for tier (Basic/Premium with icons)
- Date picker for expiration (required when featuring)
- Save button with loading/success states
- Toast notifications for feedback

**Admin page modification:** `src/app/admin/clinics/[clinicId]/page.tsx`

```tsx
// Add Featured tab to TabsList
<TabsList>
  <TabsTrigger value="services">Services</TabsTrigger>
  <TabsTrigger value="details">Details</TabsTrigger>
  <TabsTrigger value="featured">Featured</TabsTrigger>
</TabsList>

// Add TabsContent for Featured tab
<TabsContent value="featured">
  <ClinicFeaturedTab clinicId={clinic.id} initialData={featuredInfo} />
</TabsContent>
```

**Validation rules:**
- `isFeatured`: Boolean required
- `featuredTier`: Defaults to "basic" if not provided
- `featuredUntil`: Required when featuring, must be valid future date

---

## File Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/featured/featured-clinics-carousel.tsx` | Main carousel component |
| `src/components/featured/featured-clinic-card.tsx` | Larger card for carousel |
| `src/components/featured/featured-sidebar-card.tsx` | Compact card for sidebar |
| `src/components/featured/homepage-featured-section.tsx` | Homepage wrapper |
| `src/components/featured/search-featured-section.tsx` | Search results wrapper |
| `src/components/featured/featured-clinics-sidebar.tsx` | Sidebar widget |
| `src/components/featured/index.ts` | Barrel export |
| `src/app/api/clinics/featured/route.ts` | Featured clinics API |
| `src/hooks/use-featured-clinics.ts` | Client-side hook |
| `src/lib/admin-clinic-queries.ts` | Admin featured query functions |
| `src/app/api/admin/clinics/[clinicId]/featured/route.ts` | Admin featured API endpoint |
| `src/components/admin/clinics/clinic-featured-tab.tsx` | Admin Featured tab UI component |

### Existing Files to Modify

| File | Changes |
|------|---------|
| `src/components/clinic/featured-badge.tsx` | Add `animated` prop |
| `src/app/globals.css` | Add badge animation keyframes |
| `src/lib/clinic-queries.ts` | Add `getFeaturedClinics` function |
| `src/app/page.tsx` | Add HomepageFeaturedSection |
| `src/app/clinics/page.tsx` | Add SearchFeaturedSection |
| `src/app/pain-management/state-page.tsx` | Add SearchFeaturedSection |
| `src/app/pain-management/city-page.tsx` | Add SearchFeaturedSection |
| `src/app/pain-management/[...slug]/page.tsx` | Add sidebar layout + FeaturedClinicsSidebar |
| `src/app/admin/clinics/[clinicId]/page.tsx` | Add "Featured" tab with ClinicFeaturedTab component |
