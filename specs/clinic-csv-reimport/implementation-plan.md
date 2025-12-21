# Implementation Plan: Re-Import Missing Clinics with Full CSV Data

## Overview

Create a script that re-imports 524 clinics from CSV files to populate missing data (images, reviews, hours, etc.) that the WordPress REST API didn't provide.

## Phase 1: Create Re-Import Script

Build a script that matches minimal-data clinics to CSV records and updates them with complete data.

### Tasks

- [ ] Create `src/scripts/reimport-from-csv.ts` script
- [ ] Query database for clinics with `map_latitude = 0` (minimal import indicator)
- [ ] Load and parse all 10 CSV files from `/specs/pain-clinic-directory/data/clinics/`
- [ ] Build slug-to-CSV-row mapping from CSV permalink field
- [ ] Match database records to CSV rows by slug
- [ ] Transform CSV data using existing `clinic-transformer.ts` functions
- [ ] Update database records with complete data (preserve permalink)
- [ ] Add progress logging and summary report

### Technical Details

**Database Query - Find Minimal Imports:**
```typescript
const minimalClinics = await db
  .select({ id: clinics.id, permalink: clinics.permalink })
  .from(clinics)
  .where(eq(clinics.mapLatitude, 0));
```

**Extract Slug from CSV Permalink:**
```typescript
// CSV Permalink: "https://painclinics.com/pain-management/arghiris-n-barbadimos-ct-6902/"
// Extract: "arghiris-n-barbadimos-ct-6902"
const extractSlug = (permalink: string) => {
  const match = permalink.match(/\/pain-management\/([^/]+)\/?$/);
  return match?.[1] || null;
};
```

**CSV Files to Parse:**
```
/specs/pain-clinic-directory/data/clinics/Pain-Management-Export-2025-December-08-0200-1.csv
/specs/pain-clinic-directory/data/clinics/Pain-Management-Export-2025-December-08-0200-2.csv
... through -10.csv
```

**Key CSV Columns (from header):**
- `ID`, `Title`, `Content`, `Permalink`
- `Image URL`, `Image Featured`, `Feat Image`, `Clinic Image URLS`
- `Reviews`, `Rating`, `Reviews Per Score Rating_*`
- `Featured Reviews_username`, `Featured Reviews_profile_url`, `Featured Reviews_review`, `Featured Reviews_date_review_left`, `Featured Reviews_rating`
- `Clinic Hours_day`, `Clinic Hours_hours`, `Closed On`
- `Popular times_hour_of_day`, `Popular times_average_popularity`
- `Amenities`, `Checkbox Features`
- `Question`, `Answer`
- `City`, `State`, `State Abbreviation`, `Postal Code`
- `Map Latitude`, `Map Longitude`
- `Phone`, `Website`

**Data Transformation - Use Existing Functions:**
```typescript
import {
  parseReviewKeywords,
  parseClinicHours,
  parseFeaturedReviews,
  parsePopularTimes,
  parseReviewsPerScore,
  parseAmenities,
  parseImageUrls,
  parseCheckboxFeatures,
  parseQuestions,
} from "@/lib/clinic-transformer";
```

**Update Query (preserve permalink):**
```typescript
await db
  .update(clinics)
  .set({
    // Location
    city: csvRow.City,
    state: csvRow.State,
    stateAbbreviation: csvRow["State Abbreviation"],
    postalCode: csvRow["Postal Code"],
    streetAddress: csvRow["Street Address"],
    mapLatitude: parseFloat(csvRow["Map Latitude"]),
    mapLongitude: parseFloat(csvRow["Map Longitude"]),

    // Images
    imageFeatured: csvRow["Image Featured"] || csvRow["Feat Image"],
    clinicImageUrls: parseImageUrls(csvRow["Clinic Image URLS"]),

    // Reviews
    reviewCount: parseInt(csvRow.Reviews) || 0,
    rating: parseFloat(csvRow.Rating) || null,
    reviewsPerScore: parseReviewsPerScore(csvRow),
    featuredReviews: parseFeaturedReviews(csvRow),
    reviewKeywords: parseReviewKeywords(csvRow),

    // Hours
    clinicHours: parseClinicHours(csvRow),
    closedOn: csvRow["Closed On"],
    popularTimes: parsePopularTimes(csvRow),

    // Features
    amenities: parseAmenities(csvRow.Amenities),
    checkboxFeatures: parseCheckboxFeatures(csvRow["Checkbox Features"]),
    questions: parseQuestions(csvRow),

    // Contact
    phone: csvRow.Phone,
    website: csvRow.Website,

    // Content
    content: csvRow.Content,
  })
  .where(eq(clinics.id, clinicId));
```

**Run Command:**
```bash
POSTGRES_URL="postgresql://neondb_owner:npg_C6dToLlw7qDx@ep-holy-sound-a4l291cj-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require" pnpm tsx src/scripts/reimport-from-csv.ts
```

## Phase 2: Verification

Verify the re-import was successful.

### Tasks

- [ ] Query database to confirm no clinics have `map_latitude = 0`
- [ ] Spot-check specific clinic pages (e.g., `arghiris-n-barbadimos-ct-6902`)
- [ ] Verify images, reviews, hours display correctly on frontend

### Technical Details

**Verification Query:**
```bash
psql "postgresql://..." -c "SELECT COUNT(*) FROM clinics WHERE map_latitude = 0;"
# Expected: 0
```

**Spot Check URLs:**
- `painclinics.com/pain-management/arghiris-n-barbadimos-ct-6902`
- `painclinics.com/pain-management/brenner-gary-j-md-phd-ma-2114`
- `painclinics.com/pain-management/samuel-spanbauer-mt-594054324`

**Verify Fields Present:**
```bash
psql "postgresql://..." -c "
SELECT title, city, rating, review_count,
       array_length(clinic_image_urls, 1) as image_count
FROM clinics
WHERE permalink LIKE '%arghiris%'
LIMIT 1;"
```
