# Requirements: Import Missing Clinic Data from CSVs

## Overview

Multiple JSONB and array fields in the clinics database are empty due to column name case mismatches during the initial data import. The source CSV files contain rich data that needs to be migrated into the database.

## Business Goals

1. **Complete Data Population**: Ensure all available clinic data from CSVs is properly stored in the database
2. **Enable Features**: Hours display, review analytics, social links, and popular times depend on this data
3. **Future-Proof Imports**: Fix the transformer to prevent this issue on future imports

## Current Database Status

| Field | Records Populated | Expected (from CSVs) | Status |
|-------|-------------------|----------------------|--------|
| clinic_hours | 0 | ~4,400 | Missing |
| review_keywords | 0 | ~3,980 | Missing |
| reviews_per_score | 0 | ~4,990 | Missing |
| featured_reviews | 0 | ~4,880 | Missing |
| popular_times | 0 | ~2,000 | Missing |
| google_listing_link | 0 | varies | Missing |
| facebook | 0 | ~530 | Missing |
| instagram | 0 | ~450 | Missing |
| linkedin | 0 | ~470 | Missing |
| twitter | 0 | varies | Missing |
| youtube | 0 | varies | Missing |
| tiktok | 0 | varies | Missing |
| pinterest | 0 | varies | Missing |
| questions | 0 | varies | Missing |
| amenities | 4,498 | N/A | Already Populated |
| checkbox_features | 4,500 | N/A | Already Populated |

## Root Cause

Column name case mismatch between CSV headers and transformer expectations:

| CSV Column (actual) | Transformer Expected |
|---------------------|---------------------|
| `Clinic Hours_day` | `Clinic Hours_Days` |
| `Clinic Hours_hours` | `Clinic Hours_Hours` |
| Similar mismatches for other fields |

## Functional Requirements

### FR-1: Data Migration Script

Create a migration script that:
- Reads all 10 CSV files from `specs/pain-clinic-directory/data/clinics/`
- Parses pipe-delimited multi-value fields into proper JSONB arrays
- Matches clinics by permalink (case-insensitive)
- Updates all missing fields in a single transaction per clinic
- Provides progress logging and summary statistics

### FR-2: Transformer Fix

Update the clinic transformer to use correct column names for future imports:
- Fix all column name case mismatches
- Ensure consistency between CSV export format and import expectations

### FR-3: Data Validation

After migration:
- Verify record counts match expectations
- Spot-check data integrity for each field type
- Ensure hours display correctly on clinic detail pages

## Data Source

**Location:** `specs/pain-clinic-directory/data/clinics/`

**Files:**
1. Pain-Management-Export-2025-December-08-0200-1.csv
2. Pain-Management-Export-2025-December-08-0200-2.csv
3. Pain-Management-Export-2025-December-08-0200-3.csv
4. Pain-Management-Export-2025-December-08-0200-4.csv
5. Pain-Management-Export-2025-December-08-0200-5.csv
6. Pain-Management-Export-2025-December-08-0200-6.csv
7. Pain-Management-Export-2025-December-08-0200-7.csv
8. Pain-Management-Export-2025-December-08-0200-8.csv
9. Pain-Management-Export-2025-December-08-0200-9.csv
10. Pain-Management-Export-2025-December-08-0200-10.csv

**Total Records:** ~92,600 rows (including headers)

## CSV to Database Field Mapping

| CSV Column(s) | DB Column | Type | Format |
|---------------|-----------|------|--------|
| `Clinic Hours_day` + `Clinic Hours_hours` | `clinic_hours` | JSONB | `[{day, hours}, ...]` |
| `Review Keywords_keyword` + `_keyword_count` | `review_keywords` | JSONB | `[{keyword, count}, ...]` |
| `Reviews Per Score Rating_review_score_number` + `_count` | `reviews_per_score` | JSONB | `[{score, count}, ...]` |
| `Featured Reviews_*` (5 columns) | `featured_reviews` | JSONB | `[{username, review, rating, ...}, ...]` |
| `Popular times_hour_of_day` + `_average_popularity` | `popular_times` | JSONB | `[{hour, popularity}, ...]` |
| `Question` + `Answer` | `questions` | JSONB | `[{question, answer}, ...]` |
| `Google Listing Link` | `google_listing_link` | text | URL string |
| `facebook`, `instagram`, etc. | individual columns | text | URL strings |

## Acceptance Criteria

### AC-1: Migration Execution
- [ ] Script processes all 10 CSV files without errors
- [ ] Script matches clinics by permalink correctly
- [ ] Script logs progress every 500 records
- [ ] Script provides final summary with update counts per field

### AC-2: Data Integrity
- [ ] clinic_hours contains valid day/hours pairs
- [ ] review_keywords contains keyword/count pairs with numeric counts
- [ ] reviews_per_score contains score/count pairs (scores 1-5)
- [ ] featured_reviews contains complete review objects
- [ ] Social links are valid URLs where present

### AC-3: Application Functionality
- [ ] Hours widget displays actual business hours instead of "Closed"
- [ ] Closed/Open status reflects real data
- [ ] No regressions in existing functionality

### AC-4: Transformer Fix
- [ ] Column names updated in clinic-transformer.ts
- [ ] Future imports will correctly populate all fields

## Out of Scope

- Populating amenities (already populated)
- Populating checkbox_features (already populated)
- Modifying the UI components (already working, just need data)
- Creating new database columns (schema already has all needed columns)
