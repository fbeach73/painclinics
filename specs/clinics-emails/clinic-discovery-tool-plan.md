# Clinic Discovery Tool - Implementation Plan

## Overview

Build an admin tool to discover new pain management clinics via Google Places API, compare against existing database, and selectively import new listings.

## User Flow

```
1. Admin visits /admin/discover
2. Select search method:
   - By state (auto-search major cities)
   - By city (manual entry)
   - By coverage gaps (auto-suggest underserved areas)
3. Click "Search" → calls Google Places Text Search API
4. Results display in table:
   - Clinic name, address, rating, reviews
   - Status badge: "New" | "Exists" | "Needs Update"
   - Checkbox for selection
5. Select clinics to import
6. Click "Import Selected" → adds to database
7. Optional: Auto-sync details from Places API
```

## Key Features

### 1. Smart Search
- Pre-populated list of major US cities by state
- Search query: "pain management clinic near [city, state]"
- Radius: 50km from city center
- Returns up to 20 results per search

### 2. Duplicate Detection
- Compare `place_id` against existing clinics
- Visual indicator: green (new), yellow (exists but outdated), gray (exact match)
- Show side-by-side comparison for "needs update" cases

### 3. Quality Filters
- Minimum rating (e.g., 3.5+)
- Minimum reviews (e.g., 5+)
- Must have website
- Must have phone number

### 4. Bulk Import
- Select multiple clinics
- Choose what to import:
  - Basic info only (name, address, coordinates)
  - Full sync (includes reviews, hours, contact)
- Progress indicator during import

### 5. Coverage Dashboard
- Map or table showing clinics per state
- Highlight gaps (states/cities below threshold)
- Suggested search targets

## Technical Implementation

### New Files Required

```
src/app/admin/discover/
├── page.tsx                    # Main discovery page
├── components/
│   ├── search-panel.tsx        # Search form (state/city selection)
│   ├── results-table.tsx       # Results with checkboxes
│   ├── clinic-comparison.tsx   # Side-by-side for duplicates
│   ├── import-dialog.tsx       # Import confirmation + options
│   └── coverage-stats.tsx      # Coverage gap visualization
```

### API Routes

```
src/app/api/admin/discover/
├── search/route.ts             # POST: Search Google Places
├── compare/route.ts            # POST: Compare results with DB
└── import/route.ts             # POST: Bulk import selected
```

### Database Queries

```typescript
// Check existing by place_id
SELECT id, place_id, title, rating, updated_at
FROM clinics
WHERE place_id = ANY($1);

// Get coverage stats
SELECT state, COUNT(*) as count
FROM clinics
GROUP BY state;

// Get cities in state
SELECT DISTINCT city, COUNT(*) as clinic_count
FROM clinics
WHERE state = $1
GROUP BY city
ORDER BY clinic_count DESC;
```

## Google Places API Usage

### Text Search (New)
```typescript
POST https://places.googleapis.com/v1/places:searchText
{
  "textQuery": "pain management clinic near Austin, Texas",
  "locationBias": {
    "circle": {
      "center": { "latitude": 30.2672, "longitude": -97.7431 },
      "radius": 50000
    }
  },
  "maxResultCount": 20
}
```

**Cost**: $0.032 per request (Contact data tier)

### Fields to Request
```
id, displayName, formattedAddress, location,
rating, userRatingCount, websiteUri,
nationalPhoneNumber, googleMapsUri
```

## UI Mockup

```
┌─────────────────────────────────────────────────────────────┐
│ Clinic Discovery                                    [Stats] │
├─────────────────────────────────────────────────────────────┤
│ Search Method: ○ By State  ○ By City  ○ Coverage Gaps      │
│                                                             │
│ State: [Texas          ▼]  City: [Austin        ]          │
│                                                             │
│ Filters:  Min Rating [3.5]  Min Reviews [5]                │
│           ☑ Has Website  ☑ Has Phone                       │
│                                                     [Search]│
├─────────────────────────────────────────────────────────────┤
│ Results (18 found, 12 new, 4 exist, 2 need update)         │
│                                                             │
│ ☑ | Status      | Name                | Rating | Reviews   │
│ ──┼─────────────┼─────────────────────┼────────┼───────────│
│ ☑ | 🟢 New      | Austin Pain Clinic  | 4.8    | 127       │
│ ☑ | 🟢 New      | Texas Pain Relief   | 4.5    | 89        │
│ ☐ | ⚪ Exists   | Capital Pain Mgmt   | 4.2    | 156       │
│ ☑ | 🟡 Update   | Lone Star Pain      | 4.6    | 234       │
│   |             |                     |        |           │
│                                                             │
│ Selected: 3                    [Import Selected (3)]        │
└─────────────────────────────────────────────────────────────┘
```

## Cost Estimates

| Scenario | Searches | Details | Est. Cost |
|----------|----------|---------|-----------|
| 1 state (10 cities) | 10 | ~100 | $2.00 |
| 10 states | 100 | ~1,000 | $20.00 |
| Full US scan | 500 | ~5,000 | $100.00 |

## Implementation Order

1. **Phase 1**: Basic search + results table
   - State/city selector
   - Google Places text search integration
   - Results table with new/exists badges

2. **Phase 2**: Duplicate detection + comparison
   - Place ID matching
   - Side-by-side comparison view
   - "Needs update" detection

3. **Phase 3**: Bulk import
   - Checkbox selection
   - Import confirmation dialog
   - Progress tracking

4. **Phase 4**: Coverage dashboard
   - Stats by state
   - Gap detection
   - Suggested search targets

## Questions to Resolve

1. Should "Update" import overwrite or merge data?
2. Auto-sync reviews/hours after import, or manual trigger?
3. Store search history for audit trail?
4. Rate limiting: how many searches per session?
