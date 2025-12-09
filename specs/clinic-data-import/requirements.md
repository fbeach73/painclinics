# Requirements: Clinic Data Import System

## Overview

Migrate 4,575 WordPress pain clinic listings from CSV files to PostgreSQL with an admin-only import tool. This is a backend-only data migration with no public-facing UI changes.

## Background

- **Data Source**: 10 CSV files in `/specs/pain-clinic-directory/data/clinics/` (~500 clinics each)
- **Original Platform**: WordPress with WP ALL Export PRO
- **Purpose**: Preserve SEO content and clinic data for Google rankings and AdSense revenue

## Functional Requirements

### Database Storage
- Store ALL CSV fields exactly as-is (no data modification)
- Preserve HTML content formatting in Content field
- Store complex data as JSONB (reviews, hours, keywords)
- Store lists as PostgreSQL arrays (phones, images, amenities)
- Track import batches for rollback capability

### Admin Access Control
- Admin-only access to import tool
- Use ADMIN_EMAIL environment variable for auto-promotion
- Protect all import endpoints and UI

### Import Features
1. **Batch Import**: Process all 10 CSV files automatically
2. **Single File Upload**: Support future CSV additions
3. **Preview Mode**: Show first 10 rows before import
4. **Progress Tracking**: Real-time display showing current file and overall progress
5. **Duplicate Handling**: Update existing records when Place ID matches
6. **Error Logging**: Capture malformed data with specific error messages
7. **Rollback**: Reverse entire import batches by batch ID

### Image Processing
- Download images from external URLs (Google, WordPress)
- Re-upload to Vercel Blob storage
- Store new URLs in database (own all assets)

### Data Transformation
- Auto-derive state abbreviations from state names
- Parse pipe-separated parallel arrays into JSONB
- Parse comma-separated lists into arrays
- Extract permalink slugs from full URLs
- Validate coordinates and ratings

### Post-Import Verification
- Verify unique permalinks and Place IDs
- Identify clinics missing coordinates
- Count clinics by state
- Calculate average rating and total reviews
- List clinics with broken images or missing required data

## Acceptance Criteria

1. [ ] All 4,575 clinics imported with zero data loss
2. [ ] Every CSV field preserved in database
3. [ ] HTML content intact and renderable
4. [ ] All images stored in Vercel Blob
5. [ ] Admin UI accessible only to admin role users
6. [ ] Import progress visible in real-time
7. [ ] Rollback successfully removes all records from a batch
8. [ ] Post-import verification passes all checks
9. [ ] No public-facing UI changes (backend only)

## Dependencies

- Existing BetterAuth authentication system
- Existing Drizzle ORM + PostgreSQL setup
- Existing storage abstraction (Vercel Blob)
- CSV files in `/specs/pain-clinic-directory/data/clinics/`

## Out of Scope

- Public clinic listing pages (separate feature)
- Content optimization/modification (Prompt 2B)
- SEO enhancements
- Search functionality
