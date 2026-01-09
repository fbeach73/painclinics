# Implementation Plan: Homepage Map Replacement

## Overview

Replace the heavy Mapbox map on the homepage (~400-500KB JS) with a lightweight state selector component. Add optional lazy-loaded map to state pages for users who want the map experience.

## Phase 1: Create State Combobox Component

Build a reusable state selector using shadcn/ui Command component.

### Tasks

- [x] Create `src/components/home/state-combobox.tsx` with autocomplete functionality
- [x] Add all 50 US states with abbreviations and full names
- [x] Implement fuzzy search (typing "cal" finds "California")
- [x] Navigate to `/pain-management/[state]` on selection

### Technical Details

**Component structure:**
```tsx
// src/components/home/state-combobox.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// US_STATES array with { abbrev: 'CA', name: 'California', slug: 'ca' }
```

**State data:** Include all 50 states as a static array (no API call needed).

**Navigation:** Use `router.push(`/pain-management/${state.slug}`)` on selection.

## Phase 2: Create Find Clinic Section Component

Build the main homepage section that replaces NearbyClinicsSection.

### Tasks

- [x] Create `src/components/home/find-clinic-section.tsx`
- [x] Add "Find Clinics Near Me" button with geolocation handling
- [x] Integrate StateCombobox component
- [x] Add popular states grid (top 6 by clinic count)
- [x] Style with Tailwind to match site design

### Technical Details

**Component props:**
```tsx
interface FindClinicSectionProps {
  popularStates: Array<{
    abbrev: string;
    name: string;
    slug: string;
    count: number;
  }>;
}
```

**Geolocation flow:**
```tsx
const handleNearMe = () => {
  setLoading(true);
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      // Reverse geocode using simple API (not Mapbox)
      // Option 1: Use browser's built-in or
      // Option 2: Simple fetch to free geocoding API
      const state = await reverseGeocodeToState(position.coords);
      router.push(`/pain-management/${state}`);
    },
    (error) => {
      toast.error('Please enable location or select a state below');
      setLoading(false);
    }
  );
};
```

**Reverse geocoding:** Use OpenStreetMap Nominatim (free, no API key):
```tsx
const reverseGeocodeToState = async (coords: GeolocationCoordinates) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`
  );
  const data = await res.json();
  // Extract state from address.state, convert to slug
  return stateNameToSlug(data.address.state);
};
```

**Popular states grid layout:**
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
  {popularStates.map((state) => (
    <Link href={`/pain-management/${state.slug}`} key={state.abbrev}>
      <Card className="hover:border-primary transition-colors">
        <CardContent className="p-4 text-center">
          <p className="font-semibold">{state.name}</p>
          <p className="text-sm text-muted-foreground">
            {state.count.toLocaleString()} clinics
          </p>
        </CardContent>
      </Card>
    </Link>
  ))}
</div>
```

## Phase 3: Update Homepage

Replace NearbyClinicsSection with new FindClinicSection.

### Tasks

- [x] Modify `src/app/page.tsx` to import FindClinicSection
- [x] Remove NearbyClinicsSection import
- [x] Pass popular states data (from existing getClinicCountsByState query)
- [x] Verify no Mapbox imports remain on homepage

### Technical Details

**Homepage changes:**
```tsx
// src/app/page.tsx
import { FindClinicSection } from '@/components/home/find-clinic-section';
// REMOVE: import { NearbyClinicsSection } from '@/components/home/nearby-clinics-section';

// In the component, prepare popular states:
const stateCounts = await getClinicCountsByState();
const popularStates = stateCounts
  .sort((a, b) => b.count - a.count)
  .slice(0, 6)
  .map(s => ({
    abbrev: s.stateAbbrev,
    name: STATE_NAMES[s.stateAbbrev], // Need mapping
    slug: s.stateAbbrev.toLowerCase(),
    count: s.count,
  }));

// Replace:
// <NearbyClinicsSection />
// With:
<FindClinicSection popularStates={popularStates} />
```

**State name mapping:** Add constant or import from state-combobox.

## Phase 4: Add Map Toggle to State Pages

Add optional "View on Map" functionality to state listing pages.

### Tasks

- [x] Modify `src/app/pain-management/[state]/page.tsx` to add map toggle
- [x] Create state for showing/hiding map
- [x] Lazy-load map component when toggle is clicked
- [x] Pass state's clinics to the map component

### Technical Details

**State page modifications:**
```tsx
// src/app/pain-management/[state]/page.tsx
'use client'; // May need client component wrapper for toggle

import { useState } from 'react';
import dynamic from 'next/dynamic';

const LazyStateMap = dynamic(
  () => import('@/components/map/state-clinics-map'),
  { ssr: false, loading: () => <MapSkeleton /> }
);

// In component:
const [showMap, setShowMap] = useState(false);

// UI:
<div className="flex gap-2 mb-6">
  <Button
    variant={showMap ? 'default' : 'outline'}
    onClick={() => setShowMap(!showMap)}
  >
    <Map className="h-4 w-4 mr-2" />
    {showMap ? 'Hide Map' : 'View on Map'}
  </Button>
</div>

{showMap && (
  <div className="mb-8 h-[500px] rounded-lg overflow-hidden">
    <LazyStateMap clinics={clinics} />
  </div>
)}
```

**May need new component:** `src/components/map/state-clinics-map.tsx` that wraps ClinicMap with state-specific defaults, or reuse existing LazyClinicMap.

## Phase 5: Cleanup and Verification

Remove unused code and verify performance improvements.

### Tasks

- [x] Run `pnpm lint && pnpm typecheck`
- [x] Verify build succeeds with `pnpm build`
- [x] Test "Near Me" functionality with location enabled/disabled
- [x] Test state combobox search and navigation
- [x] Test popular states grid links
- [x] Test map toggle on state pages
- [ ] Run PageSpeed test on homepage

### Technical Details

**Expected results:**
- Homepage unused JS reduced from 588KB to ~150-200KB
- PageSpeed score improvement: 47 → 65-75 (estimated)
- LCP improvement: 10.2s → ~5-6s (estimated)

**Testing checklist:**
1. Homepage loads without Mapbox
2. "Near Me" prompts for location, redirects on success
3. "Near Me" shows toast on location denial
4. State combobox searches correctly
5. Popular state cards link correctly
6. State page map toggle works
7. Map only loads after toggle click
