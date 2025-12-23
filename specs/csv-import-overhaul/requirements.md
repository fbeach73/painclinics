# Requirements: CSV Import System Overhaul

## Problem Statement

The current Outscraper/Google Places CSV import process only parses 21 of 51 available fields (41% retention). Critical data including hours, images array, detailed reviews, and keywords are either hardcoded to null or improperly parsed, resulting in incomplete clinic profiles that cannot leverage AI content generation.

## Goals

1. **Full Data Extraction**: Parse all 51 Outscraper CSV fields during import
2. **Image Reliability**: Import full images array with fallback placeholder when missing
3. **Review Data Pipeline**: Store all reviews for AI content generation; display featured reviews on frontend
4. **Auto-Categorization**: Automatically set Clinic Type from categories; auto-create service records
5. **Admin Visibility**: Provide admin UI for viewing/editing review data and keywords

## User Requirements (Confirmed)

| Requirement | Decision |
|-------------|----------|
| Fallback Image | Generic placeholder image (not PC logo) |
| Services/Categories | Auto-create services; use FIRST category or pain-related one for Clinic Type |
| Reviews | Import ALL reviews; use featured for display; strip formatting for AI consumption |
| Admin UI | Add Reviews tab showing keywords, featured reviews, rating breakdown |

## Acceptance Criteria

### Data Import
- [ ] All 51 Outscraper CSV columns are mapped and parsed
- [ ] Hours JSON parsed correctly and displays on clinic detail page
- [ ] Full `images` array imported to `clinicImageUrls`
- [ ] `featured_image` OR first image from array used as primary image
- [ ] `detailed_reviews` JSON parsed into structured review objects
- [ ] `reviews_per_score` parsed for rating breakdown display
- [ ] `categories` array parsed for clinic type and services

### Fallback Image
- [ ] Generic placeholder image exists at `/images/clinic-placeholder.png`
- [ ] Clinic header falls back to placeholder when no images
- [ ] Photos section gracefully handles missing images

### Auto-Categorization
- [ ] Clinic Type auto-populated from pain-related category (if found) or first category
- [ ] Service records auto-created for each category during import

### Reviews Pipeline
- [ ] All review text concatenated and stripped of HTML formatting
- [ ] Stripped text stored in `allReviewsText` for AI content generation
- [ ] Featured reviews (top-rated with text) available for frontend display
- [ ] Review keywords stored and editable

### Admin UI
- [ ] Reviews tab added to clinic edit page
- [ ] Keywords displayed as editable tags
- [ ] Rating breakdown visualization (1-5 star counts)
- [ ] Featured reviews selection/management
- [ ] Read-only textarea showing all reviews text for AI reference

## Dependencies

- Existing Outscraper CSV format (51 columns)
- Drizzle ORM for schema migrations
- shadcn/ui components for admin UI

## Related Features

- AI Content Generation (consumes `allReviewsText` for generating amenities/services)
- Clinic Detail Page (displays hours, images, featured reviews)
- Admin Clinics Table (shows import status)
