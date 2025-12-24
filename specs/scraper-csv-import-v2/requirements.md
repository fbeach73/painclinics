# Requirements: Scraper CSV Import V2

## Overview

Enhance the scraper CSV import functionality to capture all available fields from the updated scraper export format (`pmv3.csv`), including coordinates, reviews, images, and aggregating unmapped data for AI processing.

## Background

The scraper tool exports 51 columns of data, but the current import only captures ~15 fields. Key data like coordinates (for maps), featured reviews (for display), detailed reviews (for AI), and images are being lost.

## Goals

1. **Parse coordinates** - Enable map display for imported clinics
2. **Display featured reviews** - Show top reviews on clinic listing pages
3. **Aggregate data for AI** - Collect all text data into `allReviewsText` for AI enhancement
4. **Capture additional images** - Store multiple clinic photos
5. **Improve address parsing** - Use structured `detailed_address` JSON when available

## Acceptance Criteria

### Coordinates
- [ ] Coordinates JSON (`{"latitude":X,"longitude":Y}`) is parsed and stored
- [ ] Map displays correctly on clinic detail pages for imported clinics
- [ ] Fallback to 0,0 only when coordinates are missing

### Featured Reviews
- [ ] `featured_reviews` JSON is parsed and stored in `featuredReviews` column
- [ ] Reviews display on clinic detail page with username, rating, and text
- [ ] Review text is also added to `allReviewsText` for AI processing

### AI Processing Data (allReviewsText)
- [ ] Contains stripped text from `featured_reviews`
- [ ] Contains stripped text from `detailed_reviews`
- [ ] Contains `competitors` data as context
- [ ] Contains `about` field content
- [ ] Contains `review_keywords` as context
- [ ] Includes metadata: `cid`, `kgmid`, `time_zone`
- [ ] AI enhancement uses this aggregated data

### Images
- [ ] `images` and `featured_images` JSON arrays are parsed
- [ ] Multiple image URLs stored in `clinicImageUrls` column
- [ ] Images display in clinic photo gallery

### Address Parsing
- [ ] `detailed_address` JSON is parsed when available
- [ ] Falls back to string parsing for `address` field
- [ ] All address components (street, city, state, zip) are captured

### Import Flow
- [ ] CSV validation accepts the new format headers
- [ ] Format detected as "Scraper" in upload preview
- [ ] No validation warnings for expected scraper format
- [ ] Import completes without errors for valid rows

## Out of Scope

- Geocoding for clinics without coordinates
- Real-time review updates from Google
- Image optimization/resizing during import

## Dependencies

- Existing `clinic-transformer.ts` transformation logic
- Existing `parseOutscraperCoordinates()` function (reusable)
- Existing `FeaturedReview` type definition
- Database columns: `featuredReviews`, `allReviewsText`, `clinicImageUrls` already exist

## Related Features

- `specs/scraper-csv-import-format/` - Original scraper import (Phase 1)
