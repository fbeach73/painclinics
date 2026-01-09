# Requirements: Homepage Map Replacement

## Overview

Replace the heavy interactive Mapbox map on the homepage with a lightweight state selector and "Find Clinics Near Me" CTA to dramatically improve PageSpeed scores.

## Problem Statement

The current homepage includes a `NearbyClinicsSection` component that loads Mapbox GL, which adds **~400-500KB of JavaScript**:
- `mapbox-gl`: ~340-400KB
- `react-map-gl`: ~50-80KB
- Plus geocoding API calls and geolocation prompts

This is the largest contributor to poor PageSpeed scores (currently 47 on mobile) with 588KB of unused JavaScript and 10.2s LCP in lab tests.

## Solution

Replace the interactive map with:
1. **"Find Clinics Near Me" button** - Uses browser geolocation to redirect to the user's state page
2. **State autocomplete dropdown** - Search/select any state for instant navigation
3. **Popular states grid** - Quick links to top 6 states by clinic count
4. **Optional map on state pages** - "View on Map" toggle loads map lazily when requested

## User Stories

### As a visitor on the homepage
- I want to quickly find clinics in my area without waiting for a heavy map to load
- I can click "Find Clinics Near Me" to be redirected to my state's clinic listings
- I can search for or select any state from a dropdown
- I can click popular state shortcuts to browse immediately

### As a visitor on a state page
- I can view clinics in a fast-loading list by default
- I can optionally click "View on Map" to see an interactive map
- The map only loads when I explicitly request it

## Acceptance Criteria

### Homepage
- [ ] Map section replaced with lightweight state selector component
- [ ] "Find Clinics Near Me" button triggers geolocation and redirects to state page
- [ ] State combobox allows searching all 50 states with autocomplete
- [ ] Popular states grid shows top 6 states with clinic counts
- [ ] No Mapbox JavaScript loaded on homepage
- [ ] Component is server-rendered where possible (state counts)

### State Pages
- [ ] Default view is clinic list (no map loaded)
- [ ] "View on Map" toggle/button visible
- [ ] Clicking toggle lazy-loads the map component
- [ ] Map shows all clinics in that state

### Performance
- [ ] Homepage unused JavaScript reduced by ~300-400KB
- [ ] PageSpeed score improves by 15-20 points
- [ ] LCP improves significantly (target: under 4s lab)

## Dependencies

- Existing `LazyClinicMap` component for state page map toggle
- shadcn/ui Command component for state autocomplete
- Existing state data from `getClinicCountsByState()` query

## Out of Scope

- Adding filters to state pages (separate feature)
- Removing map from individual clinic detail pages
- Mobile app considerations
