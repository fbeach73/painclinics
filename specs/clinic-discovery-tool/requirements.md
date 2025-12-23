# Requirements: Clinic Discovery Tool

## Overview

Build an admin tool to discover new pain management clinics via Google Places API, compare against existing database, and selectively import new listings.

## Problem Statement

- The site currently has ~5,026 clinic listings imported 4 years ago
- Data is aging and there are geographic gaps
- Need a way to find NEW clinics that don't exist in the database
- Need to avoid duplicates when importing

## User Goals

1. **Fill geographic gaps** - Find clinics in underserved states/cities
2. **Replace stale data** - Refresh existing listings with current Google data
3. **Maximize coverage** - Add as many clinics as possible nationwide
4. **Quality over quantity** - Focus on high-rated clinics with complete data

## Feature Description

An admin page (`/admin/discover`) that allows:

1. **Search by location** - Enter city/state to search Google Places for "pain management" clinics
2. **View results with duplicate detection** - See which results are new vs already in database
3. **Filter by quality** - Filter by minimum rating, review count, has website
4. **Selective import** - Checkbox selection to import only desired clinics
5. **Bulk import with progress** - Import multiple clinics with progress tracking

## Acceptance Criteria

- [ ] Admin can search for clinics by city and state
- [ ] Search results show name, address, rating, review count, website
- [ ] Results are flagged as "New" or "Exists" based on place_id matching
- [ ] Admin can filter results by minimum rating and review count
- [ ] Admin can select multiple clinics via checkboxes
- [ ] Admin can import selected clinics with one click
- [ ] Import shows progress and reports success/error counts
- [ ] Imported clinics appear in the main clinics list

## Dependencies

### Existing Infrastructure (Reuse)

- `src/lib/google-places/client.ts` - GooglePlacesClient with `searchPlaces()` method
- `src/lib/google-places/types.ts` - TypeScript types for Places API
- `src/lib/google-places/field-mapper.ts` - `mapPlaceToClinic()` function
- `src/lib/sync/sync-service.ts` - Patterns for bulk operations
- `src/lib/sync/sync-queries.ts` - Database query patterns

### Environment

- `GOOGLE_PLACES_API_KEY` - Already configured

## Out of Scope

- Automatic/scheduled discovery (manual only for now)
- Coverage dashboard/map visualization (future enhancement)
- State-by-state gap analysis (future enhancement)

## Cost Considerations

- Google Places Text Search: ~$32 per 1,000 searches
- Google Places Details: ~$17 per 1,000 calls
- Estimated cost for full US scan: ~$100
