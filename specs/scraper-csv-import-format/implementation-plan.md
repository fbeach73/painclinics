# Implementation Plan: New Scraper CSV Import Format Support

## Overview

Add support for the new scraper CSV format to the clinic transformer. This involves adding format detection, new parsing functions for the scraper's unique column structure, and mapping all fields to the appropriate database columns.

---

## Phase 1: Update Interface and Add Format Detection

Add scraper column names to the `RawClinicCSVRow` interface and implement format detection logic.

### Tasks

- [x] Add scraper format column names to `RawClinicCSVRow` interface
- [x] Add scraper format detection in `transformClinicRow` function
- [x] Add state name lookup constant for address parsing (used existing `getStateName` from us-states module)

### Technical Details

**File**: `src/lib/clinic-transformer.ts`

**Add to RawClinicCSVRow interface** (around line 60-150):
```typescript
// Scraper format columns (lowercase)
place_id?: string;
name?: string;
description?: string;
is_spending_on_ads?: string;
reviews?: string;
rating?: string;
competitors?: string;
website?: string;
phone?: string;
can_claim?: string;
owner_name?: string;
owner_profile_link?: string;
featured_image?: string;
main_category?: string;
categories?: string;
workday_timing?: string;
is_temporarily_closed?: string;
closed_on?: string;
address?: string;
review_keywords?: string;
link?: string;
query?: string;
```

**Add state name lookup** (add near top of file with other constants):
```typescript
const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia"
};
```

**Format detection** (add in `transformClinicRow` function, around line 860):
```typescript
// Detect scraper format: has lowercase name, place_id, and main_category
const isScraperFormat = !!row.name && !!row.place_id && !!row.main_category;
```

---

## Phase 2: Add Scraper-Specific Parsing Functions

Create new parsing functions for the scraper format's unique data structures.

### Tasks

- [x] Create `parseScraperAddress` function to extract address components
- [x] Create `parseScraperHours` function to build hours from workday_timing + closed_on
- [x] Create `parseScraperKeywords` function to parse comma-separated keywords

### Technical Details

**File**: `src/lib/clinic-transformer.ts`

**Add address parser** (add with other parsing functions, around line 400-500):
```typescript
/**
 * Parse scraper format address string into components
 * @example "15 Shrine Club Rd Suite B, Lander, WY 82520, United States"
 */
function parseScraperAddress(address: string | undefined): {
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  stateAbbreviation: string | null;
  postalCode: string | null;
} {
  const empty = { streetAddress: null, city: null, state: null, stateAbbreviation: null, postalCode: null };
  if (!address) return empty;

  // Format: "Street, City, ST ZIP, Country"
  const parts = address.split(",").map(p => p.trim());
  if (parts.length < 3) {
    return { ...empty, streetAddress: address };
  }

  const streetAddress = parts[0] || null;
  const city = parts[1] || null;

  // Parse "ST ZIP" from third part (e.g., "WY 82520")
  const stateZipPart = parts[2] || "";
  const stateZipMatch = stateZipPart.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  const stateAbbreviation = stateZipMatch?.[1] || null;
  const postalCode = stateZipMatch?.[2] || null;
  const state = stateAbbreviation ? STATE_NAMES[stateAbbreviation] || null : null;

  return { streetAddress, city, state, stateAbbreviation, postalCode };
}
```

**Add hours parser**:
```typescript
/**
 * Parse scraper format hours from workday_timing + closed_on
 * @example workdayTiming="8 a.m.-5:30 p.m.", closedOn="Saturday, Sunday"
 */
function parseScraperHours(
  workdayTiming: string | undefined,
  closedOn: string | undefined
): ClinicHour[] | null {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Parse closed days into a set (lowercase for comparison)
  const closedDays = new Set(
    (closedOn || "")
      .split(",")
      .map(d => d.trim().toLowerCase())
      .filter(Boolean)
  );

  // Handle "Open All Days" case
  const isOpenAllDays = closedOn?.toLowerCase().includes("open all days");

  // If no timing info at all, return null
  if (!workdayTiming && !closedOn) return null;

  return days.map(day => ({
    day,
    hours: (isOpenAllDays || !closedDays.has(day.toLowerCase()))
      ? (workdayTiming || "Hours not available")
      : "Closed"
  }));
}
```

**Add keywords parser**:
```typescript
/**
 * Parse scraper format comma-separated keywords into ReviewKeyword array
 * @example "team, compassionate, questions" => [{keyword: "team", count: 1}, ...]
 */
function parseScraperKeywords(keywords: string | undefined): ReviewKeyword[] | null {
  if (!keywords) return null;
  const keywordList = keywords
    .split(",")
    .map(k => k.trim())
    .filter(Boolean);
  if (keywordList.length === 0) return null;
  return keywordList.map(keyword => ({ keyword, count: 1 }));
}
```

---

## Phase 3: Add Scraper Format Transform Branch [complex]

Add the complete scraper format handling to `transformClinicRow` function.

### Tasks

- [x] Add scraper format branch in `transformClinicRow` before Outscraper/WordPress branches
- [x] Map all scraper columns to TransformedClinic fields
- [x] Handle missing/empty fields gracefully

### Technical Details

**File**: `src/lib/clinic-transformer.ts`

**Add scraper format branch** (in `transformClinicRow` function, around line 865, BEFORE the Outscraper format check):

```typescript
// ========== SCRAPER FORMAT ==========
// Detected by: has lowercase name, place_id, and main_category columns
if (isScraperFormat) {
  const title = row.name?.trim();
  if (!title) return null;

  // Parse address components
  const addr = parseScraperAddress(row.address);

  // Validate required fields - need at least title and some location info
  if (!addr.city && !addr.postalCode && !row.address) {
    return null; // Skip rows with no location data
  }

  // Parse categories into array
  const categories = row.categories
    ?.split(",")
    .map(c => c.trim())
    .filter(Boolean) || null;

  return {
    wpId: null,
    placeId: emptyToNull(row.place_id),
    title,
    permalink: `pain-management/${generatePermalinkSlug(title, addr.stateAbbreviation, addr.postalCode)}`,
    postType: "pain-management",
    clinicType: emptyToNull(row.main_category),
    streetAddress: addr.streetAddress,
    city: addr.city,
    state: addr.state,
    stateAbbreviation: addr.stateAbbreviation,
    postalCode: addr.postalCode,
    mapLatitude: 0, // Not provided in scraper format - needs geocoding
    mapLongitude: 0,
    detailedAddress: emptyToNull(row.address),
    phone: emptyToNull(row.phone),
    phones: null,
    website: emptyToNull(row.website),
    emails: null,
    reviewCount: safeParseInt(row.reviews) || 0,
    rating: safeParseFloat(row.rating),
    reviewsPerScore: null,
    reviewKeywords: parseScraperKeywords(row.review_keywords),
    detailedReviews: null,
    allReviewsText: null,
    clinicHours: parseScraperHours(row.workday_timing, row.closed_on),
    closedOn: emptyToNull(row.closed_on),
    popularTimes: null,
    featuredReviews: null,
    priceRange: null,
    businessDescription: emptyToNull(row.description),
    content: null,
    newPostContent: null,
    imageUrl: emptyToNull(row.featured_image),
    imageFeatured: emptyToNull(row.featured_image),
    featImage: null,
    clinicImageUrls: null,
    clinicImageMedia: null,
    qrCode: null,
    amenities: null,
    checkboxFeatures: categories,
    googleListingLink: emptyToNull(row.link),
    questions: null,
    facebook: null,
    instagram: null,
    twitter: null,
    youtube: null,
    linkedin: null,
    tiktok: null,
    pinterest: null,
  };
}
```

**Important**: This block must come BEFORE the existing Outscraper format check (`if (isOutscraperFormat)`) in the function.

---

## Phase 4: Verification and Testing

Verify the implementation works correctly with the new scraper CSV format.

### Tasks

- [x] Run lint and typecheck to ensure no errors
- [x] Test import with `updatedcClinics.csv` via test script
- [x] Verify database has correct values for clinic_type, clinic_hours, image_featured

### Technical Details

**Lint and typecheck commands**:
```bash
pnpm lint
pnpm typecheck
```

**Database verification query**:
```sql
SELECT title, clinic_type, clinic_hours::text, image_featured, street_address, city, state
FROM clinics
WHERE title = 'Pain Care Centers';
```

**Expected results for "Pain Care Centers"**:
- `clinic_type`: "Pain control clinic"
- `clinic_hours`: JSON array with Monday-Friday as "8 a.m.-5:30 p.m." and Saturday/Sunday as "Closed"
- `image_featured`: Google image URL starting with `https://lh3.googleusercontent.com/`
- `street_address`: "15 Shrine Club Rd Suite B"
- `city`: "Lander"
- `state`: "Wyoming"

---

## Summary

| Phase | Focus | Key Files |
|-------|-------|-----------|
| 1 | Interface & Detection | `src/lib/clinic-transformer.ts` |
| 2 | Parsing Functions | `src/lib/clinic-transformer.ts` |
| 3 | Transform Branch | `src/lib/clinic-transformer.ts` |
| 4 | Verification | Database + Admin UI |
