# Requirements: Re-Import Missing Clinics with Full Data from CSV

## Background

524 clinics were imported from WordPress REST API, but the API doesn't return ACF (Advanced Custom Fields) data. As a result, these clinics are missing critical information:

- Images (featured image, gallery)
- Reviews (count, rating, featured reviews)
- Business hours and popular times
- Amenities and features
- Q&A pairs
- Correct coordinates (currently 0,0)

Example affected clinic: `painclinics.com/pain-management/arghiris-n-barbadimos-ct-6902`

## Solution

Re-import the 524 clinics from the original WordPress CSV export files which contain complete data for all fields.

## Data Sources

**CSV Files Location:** `/specs/pain-clinic-directory/data/clinics/`

Files:
- `Pain-Management-Export-2025-December-08-0200-1.csv` through `-10.csv`
- Total: ~33 MB, 4,533 clinics with complete data

## Acceptance Criteria

1. **All 524 clinics are updated with complete data**
   - Clinics identified by `map_latitude = 0` (indicator of minimal import)
   - Matched to CSV data by slug extracted from permalink

2. **All fields are populated:**
   - [ ] Featured image URL
   - [ ] Gallery image URLs
   - [ ] Review count and average rating
   - [ ] Reviews per score breakdown (1-5 stars)
   - [ ] Featured reviews with usernames, text, dates, ratings
   - [ ] Business hours by day
   - [ ] Popular times by hour
   - [ ] Amenities list
   - [ ] Checkbox features
   - [ ] Q&A pairs
   - [ ] Correct lat/lng coordinates
   - [ ] Phone, website, address fields

3. **No data loss**
   - Existing permalink (URL slug) must be preserved
   - Any data already correct should not be overwritten with empty values

4. **Logging and verification**
   - Script reports number of clinics updated
   - Script reports any clinics not found in CSV (for manual review)

## Dependencies

- Existing `src/lib/csv-parser.ts` - CSV parsing utilities
- Existing `src/lib/clinic-transformer.ts` - Data transformation functions
- Database schema in `src/lib/schema.ts`

## Related Features

- `specs/clinic-data-import/` - Original import feature
- `specs/pain-clinic-directory/` - Directory implementation
