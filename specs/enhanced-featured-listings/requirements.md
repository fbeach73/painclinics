# Requirements: Enhanced Featured Listings System

## Overview

Create a comprehensive featured listings system that gives paying clinic owners premium visibility across the pain management directory. Featured clinics appear prominently in search results, get dedicated carousel placements, and receive visual enhancements that build trust and drive engagement.

## Business Goals

1. **Revenue Generation**: Provide clear value proposition for clinic owners to purchase featured listings
2. **User Trust**: Maintain trust by clearly distinguishing paid promotion (Featured) from identity verification (Verified)
3. **User Experience**: Help users discover quality clinics while respecting their location preferences

## Functional Requirements

### FR-1: Featured Clinics Carousel

A new carousel/slider component that showcases featured clinics:

- **Geo-aware display**: When user allows location, show featured clinics sorted by distance
- **Random fallback**: When location unavailable, show random rotation of featured clinics (shuffled on each load)
- **Responsive design**: Works on mobile, tablet, and desktop
- **Auto-play with pause**: Carousel auto-advances but pauses on hover/touch

### FR-2: Multi-Location Placement

Featured clinics carousel appears in three strategic locations:

| Location | Description | Priority |
|----------|-------------|----------|
| Homepage Hero | Above the interactive map section | Highest visibility |
| Search Results | Above clinic listings on state/city/search pages | Context-relevant |
| Sidebar Widget | Sticky sidebar on individual clinic detail pages | Cross-promotion |

### FR-3: Visual Enhancements

Featured clinic cards receive enhanced styling:

- **Larger cards**: 2x size compared to standard cards in carousel context
- **Animated badges**: Subtle pulse/glow animation on Featured badges
- **Tier distinction**: Premium tier gets more prominent styling than Basic
- **Dual badges**: Featured and Verified badges can appear together (separate concepts)

### FR-4: Badge Separation

Clear distinction between two types of badges:

| Badge | Meaning | Criteria |
|-------|---------|----------|
| Featured (Gold/Yellow) | Paid promotion | Active subscription (Premium or Basic tier) |
| Verified (Blue) | Identity confirmed | Owner has claimed and verified their listing |

## Non-Functional Requirements

### NFR-1: Performance
- Carousel should load in under 200ms
- Lazy load images for off-screen slides
- Minimal layout shift during load

### NFR-2: Accessibility
- Keyboard navigable carousel
- Screen reader announcements for slide changes
- Pause auto-play respects reduced motion preferences

### NFR-3: Mobile Experience
- Touch-friendly swipe navigation
- Appropriately sized touch targets
- Responsive card layouts

## Acceptance Criteria

### AC-1: Homepage Carousel
- [ ] Featured clinics carousel appears above map section on homepage
- [ ] Shows nearby featured clinics when location is enabled
- [ ] Shows random featured clinics when location is unavailable
- [ ] Carousel auto-advances every 5 seconds
- [ ] Pauses on hover/touch interaction

### AC-2: Search Results Integration
- [ ] Featured section appears above search results on `/clinics` page
- [ ] Featured section appears on state pages (`/pain-management/[state]/`)
- [ ] Featured section appears on city pages (`/pain-management/[state]/[city]/`)
- [ ] Featured clinics match the search context (same state/city when applicable)

### AC-3: Sidebar Widget
- [ ] Sticky sidebar widget appears on individual clinic detail pages
- [ ] Shows other featured clinics (not the currently viewed clinic)
- [ ] Prioritizes nearby clinics when location available

### AC-4: Visual Enhancements
- [ ] Featured cards in carousel are visually larger than standard cards
- [ ] Featured badges have subtle pulse animation
- [ ] Premium tier styling is more prominent than Basic
- [ ] Both Featured and Verified badges can display simultaneously

### AC-5: Geo-Location Logic
- [ ] Carousel respects user's location permission
- [ ] Falls back to random rotation without location
- [ ] Distance is displayed on cards when location is available

## Dependencies

- Existing `useGeolocation` hook (`src/hooks/use-geolocation.ts`)
- Existing `useNearbyClinics` hook (`src/hooks/use-nearby-clinics.ts`)
- Existing `FeaturedBadge` component (`src/components/clinic/featured-badge.tsx`)
- Existing featured tier database schema (`isFeatured`, `featuredTier`, `featuredUntil`)
- shadcn/ui carousel component (embla-carousel based)

### FR-5: Admin Manual Featured Control

Administrators need full control to manually set featured status, overriding subscription-based settings:

- **Override capability**: Admin can feature/unfeatured any clinic regardless of subscription status
- **Required expiration**: When manually featuring, admin must set an end date
- **Tier selection**: Admin can choose Basic or Premium tier
- **Subscription awareness**: UI shows if clinic has active Polar subscription with warning
- **Dedicated tab**: New "Featured" tab in admin clinic detail page

| Control | Description |
|---------|-------------|
| Toggle | Enable/disable featured status |
| Tier dropdown | Select Basic or Premium |
| Date picker | Set expiration date (required, must be future) |
| Status display | Shows current featured state, tier, and subscription info |

### AC-6: Admin Featured Control

- [ ] Admin can view current featured status on clinic detail page
- [ ] Admin can toggle featured on/off for any clinic
- [ ] Admin can select tier (Basic/Premium) when featuring
- [ ] Admin must set expiration date when featuring (validation enforced)
- [ ] Expiration date must be in the future (validation enforced)
- [ ] Warning displays when clinic has active Polar subscription
- [ ] Changes persist correctly in database
- [ ] Non-admins cannot access the featured control API

## Out of Scope

- Payment/subscription management (already exists via Polar integration)
- Verified badge claiming flow (already exists)
- Featured tier pricing/packaging decisions
- Analytics/reporting on featured listing performance
