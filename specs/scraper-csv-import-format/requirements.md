# Requirements: New Scraper CSV Import Format Support

## Problem Statement

The clinic data import system was built for WordPress WPAll Export Pro format but now needs to support the new scraper application format. When importing CSVs from the new scraper (e.g., `updatedcClinics.csv`), critical fields like `clinic_type`, `clinic_hours`, and `featured_image` remain blank because the transformer doesn't recognize the new column names.

## Background

The codebase currently supports:
1. **WordPress format** - Uses columns like `Title`, `Clinic Type`, `Clinic Hours_day`, `Clinic Hours_hours`, `Image Featured`
2. **Outscraper format** - Uses columns like `name`, `coordinates`, `hours` (JSON)

The new scraper format uses completely different column names:
- `name` instead of `Title`
- `main_category` instead of `Clinic Type`
- `workday_timing` + `closed_on` instead of `Clinic Hours_day/hours`
- `featured_image` instead of `Image Featured`
- `address` (full string) instead of separate city/state/zip columns

## Goals

1. **Support New Format**: Add scraper format detection and parsing to the clinic transformer
2. **Preserve Backwards Compatibility**: Continue supporting WordPress and Outscraper formats
3. **Complete Field Mapping**: Map all scraper columns to appropriate database fields
4. **Address Parsing**: Extract city, state, zip from combined address string

## New Scraper CSV Format

| Column | Description | Example |
|--------|-------------|---------|
| `place_id` | Google Places ID | `ChIJY9Z9nvABWYcRw1LCozZN5ac` |
| `name` | Clinic name | `Pain Care Centers` |
| `description` | Business description | (text) |
| `reviews` | Review count | `173` |
| `rating` | Star rating | `4.9` |
| `website` | Website URL | `http://example.com/` |
| `phone` | Phone number | `+1 307-212-6270` |
| `featured_image` | Primary image URL | `https://lh3.googleusercontent.com/...` |
| `main_category` | Primary category (clinic type) | `Pain control clinic` |
| `categories` | Comma-separated categories | `Pain control clinic, Doctor, Pain management physician` |
| `workday_timing` | Hours for open days | `8 a.m.-5:30 p.m.` |
| `closed_on` | Days closed or "Open All Days" | `Saturday, Sunday` |
| `address` | Full address string | `15 Shrine Club Rd Suite B, Lander, WY 82520, United States` |
| `review_keywords` | Comma-separated keywords | `team, compassionate, questions` |
| `link` | Google Maps link | `https://www.google.com/maps/place/...` |

## Acceptance Criteria

### Data Import
- [ ] Scraper format CSVs are automatically detected (has `name`, `place_id`, `main_category`)
- [ ] `main_category` maps to `clinicType` database field
- [ ] `workday_timing` + `closed_on` are parsed into `clinicHours` JSON array
- [ ] `featured_image` maps to `imageFeatured` database field
- [ ] `address` is parsed into `streetAddress`, `city`, `state`, `stateAbbreviation`, `postalCode`
- [ ] `categories` are parsed into `checkboxFeatures` array
- [ ] `review_keywords` are parsed into `reviewKeywords` array format
- [ ] Existing WordPress and Outscraper formats continue to work

### Address Parsing
- [ ] Handles format: `"Street, City, ST ZIP, Country"`
- [ ] Extracts state abbreviation and expands to full name
- [ ] Handles missing or malformed addresses gracefully

### Hours Parsing
- [ ] Creates 7-day hours array from `workday_timing` + `closed_on`
- [ ] Handles "Open All Days" case
- [ ] Handles missing hours gracefully

## Dependencies

- Existing `src/lib/clinic-transformer.ts` transformer system
- Admin CSV import UI at `/admin/import`
- Database schema in `src/lib/schema.ts`

## Related Features

- Admin import interface (`/admin/import`)
- Clinic detail pages (display hours, images, etc.)
- Clinic directory listings

## Notes

- **Coordinates**: New scraper format doesn't include lat/lng. Initial import will set to 0,0 - geocoding can be added as a separate feature.
- **Multiple Images**: Only `featured_image` is provided, no gallery images in this format.
