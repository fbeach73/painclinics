# Requirements: Pain Clinic Directory

## Overview

Build a pain clinic directory website similar to Zocdoc or Healthgrades, specifically focused on pain management clinics. The site will feature 5,500+ clinic listings and generate revenue through organic search traffic and AdSense. The UI must convey trust and professionalism appropriate for healthcare.

## Core Features

### 1. Homepage with Interactive Map

**Primary Element: "Clinics Near Me" Map**
- Full-width, landscape-oriented interactive map as the hero section
- Browser geolocation prompt on page load
- Map centered on user's location when permission granted
- Clinic markers/pins showing all nearby clinics
- Hover/click on markers shows compact details card with:
  - Clinic name
  - Address
  - Phone number
  - Distance from user
  - 2-3 featured services
  - "More Info" button linking to clinic detail page

**Geolocation Fallback**
- When geolocation denied/unavailable: show map centered on Chicago, IL
- Display search bar overlay prompting "Enter your city or zip code"

**Below Map Content**
- Trust indicators ("5,500+ Verified Clinics", "Trusted by Patients Nationwide")
- Secondary search bar for text-based search
- Featured clinics section (promotional card listings)

### 2. Clinic Search Results Page

**Display Options**
- Card grid view (default)
- Map view with list toggle

**Clinic Card Information**
- Clinic name
- Full address
- Phone number
- Distance from search location
- Featured services icons (3-4 max)
- Rating stars and review count
- "View Details" CTA button

**Filtering & Sorting**
- Filter by services offered
- Filter by insurance accepted
- Filter by distance radius
- Sort by: distance, rating, name

### 3. Clinic Detail Page

**Header Section**
- Clinic name with verified badge
- Full address
- Phone number (click-to-call)
- Operating hours (open/closed indicator)
- Call and Get Directions CTAs

**Main Content**
- About section (clinic description)
- Featured services with icons
- Photo gallery (if available)

**Sidebar**
- Embedded map showing clinic location
- Weekly operating hours (today highlighted)
- Insurance accepted (badge list)

### 4. Global UI Elements

**Site Header**
- Logo/branding
- Integrated search bar (desktop)
- Navigation links
- Mobile-responsive with collapsible search

**Design Requirements**
- Professional, trustworthy medical aesthetic
- Clean, modern UI using shadcn/ui components
- Full dark mode support
- Mobile-first responsive design

## Technical Constraints

- **Framework**: Next.js 16 with App Router
- **Map Provider**: Mapbox GL JS (react-map-gl)
- **UI Components**: shadcn/ui (Card, Badge, Button, Dialog, Sheet, etc.)
- **Styling**: Tailwind CSS 4 with existing theme
- **Data**: Mock data only (30 clinics across 6 US cities)
- **No Backend**: UI-only implementation for this phase

## Acceptance Criteria

1. **Homepage**
   - [ ] Map loads and displays clinic markers
   - [ ] Geolocation prompt appears on first visit
   - [ ] Markers show popup on click with clinic details
   - [ ] Fallback search appears when geolocation denied
   - [ ] Trust indicators display below map
   - [ ] Featured clinics section shows 3-4 clinic cards

2. **Search Results**
   - [ ] Cards display all required clinic information
   - [ ] Map/list view toggle works
   - [ ] Filters update results in real-time
   - [ ] Sort options change result order
   - [ ] Distance calculated from user/search location

3. **Clinic Detail**
   - [ ] All clinic information displays correctly
   - [ ] Embedded map shows clinic location
   - [ ] Operating hours highlight current day
   - [ ] Services display with appropriate icons
   - [ ] Insurance badges render correctly

4. **Responsive Design**
   - [ ] All pages functional on mobile (320px+)
   - [ ] Filters use Sheet component on mobile
   - [ ] Map resizes appropriately
   - [ ] Touch-friendly interactions

5. **Code Quality**
   - [ ] TypeScript types for all data structures
   - [ ] No lint errors
   - [ ] No type errors
   - [ ] Dark mode fully supported

## Out of Scope (This Phase)

- Backend API implementation
- Database integration
- User authentication for clinic features
- Clinic claim/edit functionality
- Reviews and ratings submission
- AdSense integration
- SEO optimization
- Real clinic data import

## Dependencies

- Mapbox account with access token
- Existing shadcn/ui components (already installed)
- Existing Next.js 16 project setup (complete)
