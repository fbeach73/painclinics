# Implementation Plan: Scraper CSV Import V2

## Overview

Update the scraper CSV import to capture all 51 fields from `pmv3.csv`, parse coordinates for maps, store featured reviews for display, and aggregate unmapped data into `allReviewsText` for AI processing.

## Phase 1: Fix Format Detection & Parse Coordinates

Update format detection logic so scraper format is properly identified even when coordinates are present, and parse coordinates for map display.

### Tasks

- [x] Update scraper format detection in `clinic-transformer.ts` to check for `place_id` and `main_category` first
- [x] Parse coordinates using existing `parseOutscraperCoordinates()` function in scraper block
- [x] Parse `detailed_address` JSON using existing `parseOutscraperDetailedAddress()` function
- [x] Update address parsing to use structured data when available, with string fallback

### Technical Details

**File:** `src/lib/clinic-transformer.ts`

**Current detection (lines 980-982):**
```typescript
const isOutscraperFormat = !!row.name && !!row.coordinates;
const isScraperFormat =
  !isOutscraperFormat && !!row.name && !!row.place_id && !!row.main_category;
```

**New detection:**
```typescript
// Scraper format: has place_id + main_category (unique identifiers)
const isScraperFormat = !!row.name && !!row.place_id && !!row.main_category;
// Outscraper format: has coordinates but NOT scraper identifiers
const isOutscraperFormat = !!row.name && !!row.coordinates && !isScraperFormat;
```

**Coordinates parsing (add to scraper block around line 1024):**
```typescript
const coords = parseOutscraperCoordinates(row.coordinates);
// In return object:
mapLatitude: coords?.lat ?? 0,
mapLongitude: coords?.lng ?? 0,
```

**Address parsing (add before return):**
```typescript
const detailedAddr = parseOutscraperDetailedAddress(row.detailed_address);
if (detailedAddr) {
  // Use structured address if available
  addr.streetAddress = detailedAddr.street || addr.streetAddress;
  addr.city = detailedAddr.city || addr.city;
  addr.state = detailedAddr.state || addr.state;
  addr.postalCode = detailedAddr.postal_code || addr.postalCode;
}
```

---

## Phase 2: Parse and Store Featured Reviews

Parse `featured_reviews` JSON and store in database for frontend display.

### Tasks

- [x] Create `parseScraperFeaturedReviews()` function to transform CSV JSON to `FeaturedReview[]`
- [x] Map scraper review fields to frontend type: `review_text`→`review`, `name`→`username`, `review_link`→`url`
- [x] Add `featuredReviews` to scraper format return object

### Technical Details

**File:** `src/lib/clinic-transformer.ts`

**CSV featured_reviews structure:**
```json
[{
  "review_id": "...",
  "review_link": "https://...",
  "name": "Carla",
  "reviewer_id": "...",
  "reviewer_profile": "https://...",
  "rating": 4,
  "review_text": "I'm a new patient..."
}]
```

**Frontend FeaturedReview type (from src/types/clinic.ts):**
```typescript
interface FeaturedReview {
  review: string;
  rating: number;
  username?: string;
  date?: string;
  url?: string;
}
```

**New function:**
```typescript
function parseScraperFeaturedReviews(reviewsJson: string | undefined): FeaturedReview[] | null {
  if (!reviewsJson) return null;

  const parsed = safeParseJSON<Array<{
    review_text?: string;
    rating?: number;
    name?: string;
    review_link?: string;
  }>>(reviewsJson);

  if (!parsed || !Array.isArray(parsed)) return null;

  return parsed
    .filter(r => r.review_text)
    .map(r => ({
      review: r.review_text!,
      rating: r.rating ?? 0,
      username: r.name,
      url: r.review_link,
    }));
}
```

**Usage in scraper block:**
```typescript
featuredReviews: parseScraperFeaturedReviews(row.featured_reviews),
```

---

## Phase 3: Build allReviewsText for AI Processing

Aggregate all text data from reviews, competitors, about, and metadata into `allReviewsText` for AI enhancement.

### Tasks

- [x] Create `buildAllReviewsText()` function to aggregate and strip text from multiple sources
- [x] Extract review text from `featured_reviews` JSON
- [x] Extract review text from `detailed_reviews` JSON
- [x] Include `competitors`, `about`, `review_keywords` as context
- [x] Include metadata: `cid`, `kgmid`, `time_zone`
- [x] Add `allReviewsText` to scraper format return object

### Technical Details

**File:** `src/lib/clinic-transformer.ts`

**New function:**
```typescript
interface AllReviewsTextInput {
  featuredReviews?: string;
  detailedReviews?: string;
  competitors?: string;
  about?: string;
  reviewKeywords?: string;
  cid?: string;
  kgmid?: string;
  timeZone?: string;
}

function buildAllReviewsText(data: AllReviewsTextInput): string | null {
  const parts: string[] = [];

  // Extract featured review texts
  if (data.featuredReviews) {
    const reviews = safeParseJSON<Array<{ review_text?: string }>>(data.featuredReviews);
    if (reviews && Array.isArray(reviews)) {
      const texts = reviews.map(r => r.review_text).filter(Boolean);
      if (texts.length) {
        parts.push(`FEATURED REVIEWS:\n${texts.join('\n\n')}`);
      }
    }
  }

  // Extract detailed review texts
  if (data.detailedReviews) {
    const reviews = safeParseJSON<Array<{ review_text?: string }>>(data.detailedReviews);
    if (reviews && Array.isArray(reviews)) {
      const texts = reviews.map(r => r.review_text).filter(Boolean);
      if (texts.length) {
        parts.push(`DETAILED REVIEWS:\n${texts.join('\n\n')}`);
      }
    }
  }

  // Add competitors context
  if (data.competitors) {
    const competitors = safeParseJSON<Array<{ name?: string; main_category?: string }>>(data.competitors);
    if (competitors && Array.isArray(competitors)) {
      const names = competitors.map(c => `${c.name} (${c.main_category})`).filter(Boolean);
      if (names.length) {
        parts.push(`COMPETITORS:\n${names.join(', ')}`);
      }
    }
  }

  // Add about section
  if (data.about) {
    parts.push(`ABOUT:\n${data.about}`);
  }

  // Add review keywords
  if (data.reviewKeywords) {
    parts.push(`REVIEW KEYWORDS:\n${data.reviewKeywords}`);
  }

  // Add metadata
  const metadata: string[] = [];
  if (data.cid) metadata.push(`CID: ${data.cid}`);
  if (data.kgmid) metadata.push(`KGMID: ${data.kgmid}`);
  if (data.timeZone) metadata.push(`Timezone: ${data.timeZone}`);
  if (metadata.length) {
    parts.push(`METADATA:\n${metadata.join(', ')}`);
  }

  return parts.length ? parts.join('\n\n---\n\n') : null;
}
```

**Usage in scraper block:**
```typescript
allReviewsText: buildAllReviewsText({
  featuredReviews: row.featured_reviews,
  detailedReviews: row.detailed_reviews,
  competitors: row.competitors,
  about: row.about,
  reviewKeywords: row.review_keywords,
  cid: row.cid,
  kgmid: row.kgmid,
  timeZone: row.time_zone,
}),
```

---

## Phase 4: Parse Images and Additional Fields

Capture multiple images and remaining useful fields.

### Tasks

- [x] Create `parseScraperImages()` function to extract URLs from `images` and `featured_images` JSON
- [x] Parse `reviews_per_rating` into `reviewsPerScore` format
- [x] Add `clinicImageUrls` and `reviewsPerScore` to scraper format return object

### Technical Details

**File:** `src/lib/clinic-transformer.ts`

**Images parsing:**
```typescript
function parseScraperImages(
  imagesJson: string | undefined,
  featuredImagesJson: string | undefined
): string[] | null {
  const urls: string[] = [];

  // Parse images array
  if (imagesJson) {
    const images = safeParseJSON<Array<string | { url?: string }>>(imagesJson);
    if (images && Array.isArray(images)) {
      for (const img of images) {
        if (typeof img === 'string') urls.push(img);
        else if (img.url) urls.push(img.url);
      }
    }
  }

  // Parse featured_images array
  if (featuredImagesJson) {
    const featured = safeParseJSON<Array<string | { url?: string }>>(featuredImagesJson);
    if (featured && Array.isArray(featured)) {
      for (const img of featured) {
        if (typeof img === 'string' && !urls.includes(img)) urls.push(img);
        else if (typeof img === 'object' && img.url && !urls.includes(img.url)) urls.push(img.url);
      }
    }
  }

  return urls.length ? urls : null;
}
```

**Reviews per rating parsing:**
```typescript
function parseReviewsPerRating(ratingsJson: string | undefined): ReviewScoreItem[] | null {
  if (!ratingsJson) return null;

  // Format: {"1":5,"2":3,"3":10,"4":25,"5":130}
  const parsed = safeParseJSON<Record<string, number>>(ratingsJson);
  if (!parsed) return null;

  return Object.entries(parsed)
    .map(([score, count]) => ({
      score: parseInt(score, 10),
      count: typeof count === 'number' ? count : 0,
    }))
    .filter(item => !isNaN(item.score))
    .sort((a, b) => b.score - a.score);
}
```

**Usage in scraper block:**
```typescript
clinicImageUrls: parseScraperImages(row.images, row.featured_images),
reviewsPerScore: parseReviewsPerRating(row.reviews_per_rating),
```

---

## Phase 5: Update Type Definitions and Validation

Ensure RawClinicCSVRow type includes all new fields and upload validation is correct.

### Tasks

- [x] Add missing fields to `RawClinicCSVRow` type: `detailed_reviews`, `about`, `reviews_per_rating`, `images`, `featured_images`, `cid`, `kgmid`, `time_zone`
- [x] Update `SCRAPER_HEADERS` in upload route to include `coordinates` as the format now has it
- [x] Run lint and typecheck to verify all changes

### Technical Details

**File:** `src/lib/clinic-transformer.ts` (RawClinicCSVRow interface)

Add to interface around line 101-108:
```typescript
// Scraper format additional fields
detailed_reviews?: string;
about?: string;
reviews_per_rating?: string;
images?: string;
featured_images?: string;
cid?: string;
data_id?: string;
kgmid?: string;
time_zone?: string;
```

**File:** `src/app/api/admin/import/upload/route.ts`

Update SCRAPER_HEADERS (currently at line 26-31):
```typescript
const SCRAPER_HEADERS = [
  "name",
  "place_id",
  "main_category",
  "address",
  // coordinates is now available in scraper format
];
```

---

## Phase 6: Testing and Verification

Verify the import works end-to-end with the new CSV format.

### Tasks

- [x] Import `pmv3.csv` via admin panel
- [x] Verify coordinates populate and maps display correctly
- [x] Verify featured reviews appear on clinic detail pages
- [x] Verify AI enhancement uses aggregated `allReviewsText` data
- [x] Verify multiple images appear in clinic gallery
- [x] Check for any import errors or warnings

### Verification Results

**Test Script:** `scripts-local/test-scraper-import.ts`

**Results (pmv3.csv - 7 rows):**
- Successfully transformed: 7/7 (100%)
- With coordinates: 7/7 (100%)
- With featured reviews: 7/7 (100%)
- With allReviewsText: 7/7 (100%)
- With images: 7/7 (100%)

**Sample Transformation Output (Row 1):**
```json
{
  "title": "Lander Medical Clinic, P.C.",
  "placeId": "ChIJA9gbPusBWYcR3gqQ6UtQipo",
  "permalink": "pain-management/lander-medical-clinic-pc-wy-82520",
  "city": "Lander",
  "state": "Wyoming",
  "postalCode": "82520",
  "mapLatitude": 42.824771999999996,
  "mapLongitude": -108.73116789999999,
  "rating": 3.4,
  "reviewCount": 35,
  "reviewsPerScore": {"1": 10, "2": 4, "3": 0, "4": 4, "5": 17},
  "featuredReviewsCount": 8,
  "allReviewsTextLength": 14321,
  "clinicImageUrlsCount": 4
}
```

**Data Flow Verification:**
1. **Coordinates → Maps:** `mapLatitude`/`mapLongitude` → `clinic.coordinates.lat`/`lng` → `EmbeddedMap` component
2. **Featured Reviews → Display:** `featuredReviews` array → `ClinicReviews` → `ClinicTestimonials` component
3. **allReviewsText → AI:** Available in admin panel's Reviews tab for AI content generation
4. **Images → Gallery:** `clinicImageUrls` → `clinic.photos` → `ClinicGallery` component

**Lint & Typecheck:** ✅ All passing
