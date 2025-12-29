# Implementation Plan: AdSense Manual Ad Placements (Data-Optimized)

## Overview

Implement manual AdSense ad placements based on **actual performance data** from Nov 28 - Dec 27, 2025. This plan prioritizes what's proven to work:

### Key Data Insights Driving This Plan

| Finding | Data | Action |
|---------|------|--------|
| **Mobile dominates** | $398 (74% revenue), 5.7x higher RPM than desktop | Mobile-first placements |
| **Anchor ads = #1 performer** | $245 earnings, 95% viewability, $18.58 RPM | Keep on AUTO-ADS (can't create manually) |
| **Dynamic sizing wins** | $481 vs poor fixed-size performance | All responsive formats |
| **Vignettes work on auto** | $72, $20.97 RPM, 90% viewability | Keep auto-ads for these |
| **In-page needs help** | $221 but only 39% viewability | Better positioning needed |
| **Desktop sidebar = low ROI** | Desktop RPM only $8.96 vs mobile $51.63 | Skip desktop-only ads |

### Ad Unit Created

| Unit Name | Type | Slot ID | Format |
|-----------|------|---------|--------|
| painclinics-in-page | Display | `9665261047` | Responsive |

**Note:** Anchor ads are AUTO-AD only formats - cannot be created as manual units. Keep auto-ads enabled for Anchor and Vignette (they perform well).

---

## Phase 1: Update Ad Components

Update the existing ad component with the new slot ID and create focused components.

### Tasks

- [x] Ad unit created in AdSense dashboard (slot: 9665261047)
- [ ] Update adsense.tsx with new InPageAd component and slot ID
- [ ] Update index.ts exports
- [ ] Remove unused legacy components

### Technical Details

**File:** `src/components/ads/adsense.tsx`

```typescript
"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

// Ad slot IDs from AdSense dashboard
export const AD_SLOTS = {
  inPage: "9665261047", // painclinics-in-page (Display, responsive)
} as const;

/**
 * In-Page Display Ad - Responsive format
 * Data: $221 earnings, but only 39% viewability (needs better positioning)
 * Using responsive format because dynamic sizing earned $481
 */
export function InPageAd({ className = "" }: { className?: string }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <div className={`w-full ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-5028121986513144"
        data-ad-slot={AD_SLOTS.inPage}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

/**
 * Ad Placement Wrapper
 * - Shows "Ad" label on desktop only (cleaner mobile experience)
 * - Mobile is 74% of revenue, keep it clean
 */
interface AdPlacementProps {
  children: React.ReactNode;
  className?: string;
  showLabel?: boolean;
}

export function AdPlacement({
  children,
  className = "",
  showLabel = true,
}: AdPlacementProps) {
  return (
    <div className={`my-4 ${className}`}>
      {showLabel && (
        <p className="hidden sm:block text-xs text-muted-foreground text-center mb-1">
          Advertisement
        </p>
      )}
      {children}
    </div>
  );
}
```

---

## Phase 2: Clinic Detail Pages (Highest Value)

Clinic pages are your money pages - optimize these first.

### Tasks

- [ ] Add InPageAd above clinic header (high viewability position)
- [ ] Add InPageAd between About and Reviews sections

### Technical Details

**File:** `src/app/pain-management/[...slug]/page.tsx`

**Import:**
```typescript
import { InPageAd, AdPlacement } from "@/components/ads";
```

**Placement 1 - Above Hero (HIGH viewability position):**
Insert after breadcrumb nav, around line 660:
```tsx
</nav>

{/* In-Page Ad - Above fold for better viewability */}
<AdPlacement className="mt-4 mb-6">
  <InPageAd />
</AdPlacement>

<ClinicHeader clinic={clinic} />
```

**Placement 2 - Between About and FAQ (content break):**
Around line 690:
```tsx
{/* About Section */}
{(clinic.about || clinic.enhancedAbout) && (
  <ClinicAbout about={clinic.about} enhancedAbout={clinic.enhancedAbout} />
)}

{/* In-Page Ad - Content break */}
<AdPlacement>
  <InPageAd />
</AdPlacement>

{/* FAQ Section */}
{clinic.questions && clinic.questions.length > 0 && (
  <ClinicFAQ questions={clinic.questions} />
)}
```

---

## Phase 3: State & City Pages

Add in-page ads to listing pages. Keep it simple.

### Tasks

- [ ] Add InPageAd below header on state pages
- [ ] Add InPageAd below header on city pages

### Technical Details

**File:** `src/app/pain-management/state-page.tsx`

```typescript
import { InPageAd, AdPlacement } from "@/components/ads";
```

**Placement - After stats grid, before cities:**
Around line 152:
```tsx
</div> {/* End of stats grid */}

{/* In-Page Ad */}
<AdPlacement className="my-8">
  <InPageAd />
</AdPlacement>

{/* Featured Clinics Section */}
<SearchFeaturedSection stateAbbrev={stateAbbrev} />
```

**File:** `src/app/pain-management/city-page.tsx`

Same pattern - single InPageAd after header section.

---

## Phase 4: Homepage

Minimal ads on homepage - focus on user experience to drive traffic to clinic pages.

### Tasks

- [ ] Add single InPageAd after Featured section

### Technical Details

**File:** `src/app/page.tsx`

```typescript
import { InPageAd, AdPlacement } from "@/components/ads";
```

**Single placement after Featured:**
```tsx
<HomepageFeaturedSection />

{/* Single In-Page Ad */}
<section className="container mx-auto py-6">
  <AdPlacement>
    <InPageAd />
  </AdPlacement>
</section>

<NearbyClinicsSection />
```

---

## Phase 5: Testing & Verification

### Tasks

- [ ] Run lint and typecheck
- [ ] Test on mobile device (74% of revenue)
- [ ] Verify auto anchor/vignette ads still appear
- [ ] Monitor AdSense dashboard for impression/viewability changes

### Technical Details

**Commands:**
```bash
pnpm lint
pnpm typecheck
```

**Mobile Testing Priority:**
Mobile is 74% of revenue with 5.7x higher RPM. Test on actual mobile devices.

**Metrics to Watch (Week 1):**
| Metric | Baseline | Target |
|--------|----------|--------|
| In-page viewability | 39% | 60%+ |
| Mobile RPM | $51.63 | Maintain or improve |
| Overall earnings | ~$18/day | Increase |

---

## Summary: What This Plan Does

| Component | Action |
|-----------|--------|
| **Manual in-page ads** | Add to clinic, state, city, homepage with better positioning |
| **Auto anchor ads** | Keep enabled (can't create manually, they're your #1 performer) |
| **Auto vignettes** | Keep enabled ($20.97 RPM) |
| **Sidebar ads** | Skip (desktop ROI too low) |
| **Ad sizing** | Responsive only (dynamic = $481) |
