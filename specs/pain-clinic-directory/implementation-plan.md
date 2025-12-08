# Implementation Plan: Pain Clinic Directory

## Overview

Build a pain clinic directory UI with an interactive map-based homepage, search results page, and clinic detail pages using Next.js 16, Mapbox GL JS, and shadcn/ui components. This phase focuses purely on UI with mock data (30 clinics across 6 US cities).

---

## Phase 1: Foundation Setup

Set up dependencies, configuration, and project structure for map integration.

### Tasks

- [x] Install Mapbox dependencies (react-map-gl, mapbox-gl, @types/mapbox-gl)
- [x] Update next.config.ts to enable browser geolocation in Permissions-Policy
- [x] Add Mapbox CSS import to root layout
- [x] Add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN placeholder to environment

### Technical Details

**Install dependencies:**
```bash
pnpm add react-map-gl mapbox-gl
pnpm add -D @types/mapbox-gl
```

**Update next.config.ts line 49:**
```typescript
// Change from:
value: "camera=(), microphone=(), geolocation=()"
// To:
value: "camera=(), microphone=(), geolocation=(self)"
```

**Add to src/app/layout.tsx:**
```typescript
import 'mapbox-gl/dist/mapbox-gl.css';
```

**Environment variable (.env.local):**
```
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_token_here
```

---

## Phase 2: Types and Mock Data

Create TypeScript interfaces and realistic mock clinic data.

### Tasks

- [x] Create clinic TypeScript types (Clinic, ServiceType, InsuranceType, etc.)
- [x] Create service definitions with icon mappings
- [x] Create mock clinics data file with 30 realistic entries across 6 cities

### Technical Details

**New file: src/types/clinic.ts**

```typescript
// Service types offered by pain clinics
export type ServiceType =
  | 'injection-therapy'
  | 'physical-therapy'
  | 'medication-management'
  | 'nerve-blocks'
  | 'spinal-cord-stimulation'
  | 'regenerative-medicine'
  | 'acupuncture'
  | 'chiropractic'
  | 'massage-therapy'
  | 'psychological-services';

// Insurance providers
export type InsuranceType =
  | 'medicare'
  | 'medicaid'
  | 'blue-cross'
  | 'aetna'
  | 'cigna'
  | 'united-healthcare'
  | 'humana'
  | 'kaiser'
  | 'tricare'
  | 'workers-comp';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  street: string;
  suite?: string;
  city: string;
  state: string;
  zipCode: string;
  formatted: string;
}

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface OperatingHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  address: Address;
  coordinates: Coordinates;
  phone: string;
  email?: string;
  website?: string;
  hours: OperatingHours;
  services: ServiceType[];
  insuranceAccepted: InsuranceType[];
  rating: number;
  reviewCount: number;
  photos: string[];
  about: string;
  isVerified: boolean;
  isFeatured: boolean;
}

export interface ClinicWithDistance extends Clinic {
  distance: number;
  distanceFormatted: string;
}

export interface UserLocation {
  coordinates: Coordinates;
  city?: string;
  state?: string;
  isDefault: boolean;
}

export interface SearchFilters {
  query?: string;
  services?: ServiceType[];
  insurance?: InsuranceType[];
  maxDistance?: number;
  minRating?: number;
  sortBy: 'distance' | 'rating' | 'name';
}
```

**New file: src/data/services.ts**
- Map each ServiceType to display name and lucide-react icon name
- Icons: Syringe (injection), Activity (physical-therapy), Pill (medication), Zap (nerve-blocks), etc.

**New file: src/data/mock-clinics.ts**
- 30 clinic entries distributed across:
  - Chicago, IL (default - 8 clinics) - center: 41.8781, -87.6298
  - New York, NY (5 clinics) - center: 40.7128, -74.0060
  - Los Angeles, CA (5 clinics) - center: 34.0522, -118.2437
  - Houston, TX (4 clinics) - center: 29.7604, -95.3698
  - Phoenix, AZ (4 clinics) - center: 33.4484, -112.0740
  - Miami, FL (4 clinics) - center: 25.7617, -80.1918
- Ratings between 3.5 and 5.0
- 3-6 services per clinic
- 2-5 insurance types per clinic
- Realistic clinic names like "Chicago Pain Management Center", "Midwest Spine & Pain Institute"

---

## Phase 3: Utility Functions and Hooks

Create reusable hooks for geolocation and clinic data management.

### Tasks

- [x] Create distance calculation utility (Haversine formula)
- [x] Create geolocation hook with permission handling and Chicago fallback
- [x] Create clinics hook for data loading, filtering, and sorting

### Technical Details

**New file: src/lib/distance.ts**
```typescript
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  // Haversine formula - returns distance in miles
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function formatDistance(miles: number): string {
  return miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`;
}
```

**New file: src/hooks/use-geolocation.ts**
- Default fallback: Chicago (41.8781, -87.6298)
- States: loading, location, error, permissionState
- Function: requestLocation() to trigger permission prompt

**New file: src/hooks/use-clinics.ts**
- Accept userLocation and filters
- Calculate distances for all clinics
- Filter by services, insurance, maxDistance, minRating
- Sort by distance/rating/name
- Return ClinicWithDistance[]

---

## Phase 4: Map Components [complex]

Build all map-related components for the directory.

### Tasks

- [x] Create main ClinicMap component (hero map for homepage)
  - [x] Full-width, 60vh height
  - [x] Mapbox light style
  - [x] Render clinic markers
  - [x] Handle marker click to show popup
- [x] Create ClinicMarker component with custom styling
- [x] Create ClinicPopup component (hover/click card)
- [x] Create EmbeddedMap component for detail page
- [x] Create GeolocationPrompt overlay component

### Technical Details

**New file: src/components/map/clinic-map.tsx**
```typescript
'use client';
import Map, { Marker, Popup } from 'react-map-gl/mapbox';
import { useState } from 'react';

// Props: clinics, userLocation, onClinicSelect
// Use mapbox://styles/mapbox/light-v11 style
// Initial viewport from userLocation or Chicago default
// NavigationControl for zoom
```

**New file: src/components/map/clinic-marker.tsx**
- Custom pin using div with Tailwind (rounded-full, bg-primary, etc.)
- Hover state: scale-110 transition
- Selected state: ring-2 ring-primary

**New file: src/components/map/clinic-popup.tsx**
- Uses shadcn Card component
- Content: clinic name, address, phone, distance badge, 3 service icons
- "View Details" Link to /clinics/[slug]
- X close button

**New file: src/components/map/embedded-map.tsx**
- Smaller map (h-[300px])
- Single marker, no interaction
- "Get Directions" button → Google Maps link

**New file: src/components/map/geolocation-prompt.tsx**
- Absolute positioned overlay on map
- Shows when !userLocation or userLocation.isDefault
- Input for city/zip search
- "Enable Location" button

---

## Phase 5: Clinic Components [complex]

Build reusable clinic display components.

### Tasks

- [x] Create ServiceIcons component (maps ServiceType to lucide icons)
- [x] Create ClinicCard component for search results
- [x] Create ClinicCardFeatured component for homepage
- [x] Create ClinicHeader component for detail page
- [x] Create ClinicServices component (services grid)
- [x] Create ClinicHours component (weekly schedule)
- [x] Create ClinicInsurance component (badge list)
- [x] Create ClinicAbout component
- [x] Create ClinicGallery component

### Technical Details

**New file: src/components/clinic/service-icons.tsx**
```typescript
import { Syringe, Activity, Pill, Zap, Cpu, Leaf, Target, Hand, Brain } from 'lucide-react';

const serviceIconMap: Record<ServiceType, LucideIcon> = {
  'injection-therapy': Syringe,
  'physical-therapy': Activity,
  'medication-management': Pill,
  'nerve-blocks': Zap,
  'spinal-cord-stimulation': Cpu,
  'regenerative-medicine': Leaf,
  'acupuncture': Target,
  'chiropractic': Hand,
  'massage-therapy': Hand,
  'psychological-services': Brain,
};
```

**New file: src/components/clinic/clinic-card.tsx**
- Uses Card, CardHeader, CardContent, CardFooter from shadcn
- Badge for distance
- ServiceIcons (max 4)
- Star rating display
- Button as Link to /clinics/[slug]

**New file: src/components/clinic/clinic-card-featured.tsx**
- Larger variant with image placeholder
- "Featured" Badge variant="secondary"
- More prominent styling

**New file: src/components/clinic/clinic-header.tsx**
- Clinic name (h1)
- Verified badge (CheckCircle icon)
- Rating stars + review count
- Address, phone
- Operating status (Open/Closed badge)
- CTA buttons: Call Now, Get Directions

**New file: src/components/clinic/clinic-services.tsx**
- Grid of services with icons
- Each service: icon + name in a card/badge style

**New file: src/components/clinic/clinic-hours.tsx**
- List of days with hours
- Highlight current day with bg-muted
- "Closed" in text-muted-foreground for closed days

**New file: src/components/clinic/clinic-insurance.tsx**
- Flex wrap of Badge components
- Each insurance type as Badge variant="outline"

**New file: src/components/clinic/clinic-about.tsx**
- Simple section with heading and paragraph

**New file: src/components/clinic/clinic-gallery.tsx**
- Grid of placeholder images (gray boxes with image icon)
- Click to enlarge (Dialog component)

---

## Phase 6: Search Components

Build search, filter, and sort components.

### Tasks

- [x] Create SearchBar component with location icon
- [x] Create SearchFilters component (sidebar/sheet)
- [x] Create ViewToggle component (map/list)
- [x] Create SearchSort dropdown component

### Technical Details

**New file: src/components/search/search-bar.tsx**
- Input with Search icon (left)
- MapPin icon button (right) - triggers geolocation
- onChange with 300ms debounce
- Size variants: "default" and "large"

**New file: src/components/search/search-filters.tsx**
- Desktop: visible sidebar
- Mobile: Sheet component (slide from left)
- Sections:
  - Services (checkbox list)
  - Insurance (checkbox list)
  - Distance (radio: 5mi, 10mi, 25mi, 50mi, Any)
  - Rating (radio: 4+, 3+, Any)
- "Clear Filters" button

**New file: src/components/search/view-toggle.tsx**
- Two buttons: Grid3X3 icon (list) and Map icon (map)
- Use Button with variant based on active state

**New file: src/components/search/search-sort.tsx**
- DropdownMenu from shadcn
- Options: "Nearest", "Highest Rated", "A-Z"

---

## Phase 7: Layout Components

Update site header and create trust indicators.

### Tasks

- [x] Create TrustIndicators component
- [x] Update SiteHeader with integrated search bar

### Technical Details

**New file: src/components/layout/trust-indicators.tsx**
```typescript
// Three columns on desktop, stacked on mobile
// Items:
// - Shield icon + "5,500+ Verified Clinics"
// - CheckCircle icon + "Trusted by Patients"
// - Users icon + "Serving All 50 States"
```

**Edit file: src/components/site-header.tsx**
- Add SearchBar component between logo and user menu
- Hide on mobile (show search icon that opens Sheet)
- Keep existing dark mode toggle and auth components

---

## Phase 8: Page Implementation [complex]

Build the three main pages.

### Tasks

- [x] Rebuild homepage with map hero
  - [x] Hero map section (60vh)
  - [x] GeolocationPrompt overlay
  - [x] TrustIndicators section
  - [x] Secondary SearchBar
  - [x] Featured clinics grid (3-4 cards)
  - [x] "View All Clinics" CTA
- [x] Create search results page at /clinics
  - [x] URL params for filters (?q=&services=&sort=)
  - [x] Results header with count and sort
  - [x] Sidebar filters (desktop) / Sheet (mobile)
  - [x] View toggle (map/list)
  - [x] Clinic card grid
- [x] Create clinic detail page at /clinics/[clinicId]
  - [x] Dynamic route with clinic lookup
  - [x] ClinicHeader
  - [x] Two-column layout (content + sidebar)
  - [x] All detail sections

### Technical Details

**Edit file: src/app/page.tsx**
- Remove existing boilerplate content
- Structure:
```tsx
<main>
  <section className="relative w-full h-[60vh] min-h-[400px]">
    <ClinicMap clinics={nearbyClinicsSorted} userLocation={location} />
    {(!location || location.isDefault) && <GeolocationPrompt />}
  </section>

  <TrustIndicators />

  <section className="container py-8">
    <SearchBar size="large" />
  </section>

  <section className="container py-12">
    <h2>Featured Clinics Near You</h2>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {featuredClinics.map(c => <ClinicCardFeatured key={c.id} clinic={c} />)}
    </div>
    <Button asChild><Link href="/clinics">View All Clinics</Link></Button>
  </section>
</main>
```

**New file: src/app/clinics/page.tsx**
- Client component for filter state
- useSearchParams for URL state
- Layout: sidebar (240px) + main content
- Mobile: filters in Sheet triggered by button

**New file: src/app/clinics/[clinicId]/page.tsx**
- Can be Server Component
- Look up clinic by slug from mock data
- Return notFound() if clinic not found
- Two-column grid on lg: screens

---

## Phase 9: Final Polish

Ensure code quality and responsiveness.

### Tasks

- [x] Run lint and fix any errors
- [x] Run typecheck and fix any errors
- [x] Test responsive design at mobile breakpoints
- [x] Verify dark mode works on all pages
- [x] Test map interactions and popups

### Technical Details

**Commands:**
```bash
pnpm run lint
pnpm run typecheck
```

**Responsive breakpoints to test:**
- 320px (small mobile)
- 375px (iPhone)
- 768px (tablet)
- 1024px (desktop)
- 1280px (large desktop)

**Dark mode:** All components should use Tailwind semantic colors (bg-background, text-foreground, bg-card, etc.) which automatically adapt to dark mode.
