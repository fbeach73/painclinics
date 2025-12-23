# Implementation Plan: Clinic Discovery Tool

## Overview

Build an admin page to discover new pain management clinics via Google Places API. The tool searches by city/state, shows results with duplicate detection, and allows selective bulk import. Leverages existing Google Places infrastructure.

---

## Phase 1: Backend - Types and Client Updates

Extend the existing Google Places client to return additional fields in search results.

### Tasks

- [ ] Extend `PlaceSearchItem` type with rating, reviews, website, phone fields
- [ ] Update `searchPlaces()` field mask to request additional fields
- [ ] Update `/api/admin/places/lookup` response to include new fields

### Technical Details

**File: `src/lib/google-places/types.ts`**

Update `PlaceSearchItem` interface (currently lines 130-135):

```typescript
export interface PlaceSearchItem {
  id: string;
  displayName: LocalizedText;
  formattedAddress: string;
  location?: LatLng;
  // ADD THESE:
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  nationalPhoneNumber?: string;
}
```

**File: `src/lib/google-places/client.ts`**

Update field mask in `searchPlaces()` method (lines 94-99):

```typescript
const fieldMask = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",              // NEW
  "places.userRatingCount",     // NEW
  "places.websiteUri",          // NEW
  "places.nationalPhoneNumber", // NEW
].join(",");
```

**File: `src/app/api/admin/places/lookup/route.ts`**

Update response mapping (lines 76-82):

```typescript
return NextResponse.json({
  places: results.places.map((place) => ({
    id: place.id,
    name: place.displayName?.text || "Unknown",
    address: place.formattedAddress || "",
    location: place.location || null,
    rating: place.rating,           // NEW
    reviewCount: place.userRatingCount, // NEW
    website: place.websiteUri,      // NEW
    phone: place.nationalPhoneNumber, // NEW
  })),
});
```

---

## Phase 2: Backend - Database Queries

Add queries for duplicate detection and new clinic insertion.

### Tasks

- [ ] Add `getExistingPlaceIds()` query to check for duplicates
- [ ] Add `insertNewClinic()` function for importing discovered clinics
- [ ] Add `getCoverageByState()` query for stats display

### Technical Details

**File: `src/lib/sync/sync-queries.ts`**

Add these new functions:

```typescript
import { inArray } from "drizzle-orm";

/**
 * Check which place_ids already exist in the database
 */
export async function getExistingPlaceIds(placeIds: string[]): Promise<string[]> {
  if (placeIds.length === 0) return [];

  const result = await db
    .select({ placeId: clinics.placeId })
    .from(clinics)
    .where(inArray(clinics.placeId, placeIds));

  return result
    .map(r => r.placeId)
    .filter((id): id is string => id !== null);
}

/**
 * Insert a new clinic from discovered Places data
 */
export async function insertNewClinic(data: {
  placeId: string;
  title: string;
  streetAddress?: string;
  city: string;
  state: string;
  postalCode: string;
  mapLatitude: number;
  mapLongitude: number;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
}): Promise<string> {
  const id = generateClinicId(); // Use existing ID generation
  const permalink = generatePermalink(data.title, data.city, data.state);

  await db.insert(clinics).values({
    id,
    placeId: data.placeId,
    title: data.title,
    permalink,
    streetAddress: data.streetAddress,
    city: data.city,
    state: data.state,
    postalCode: data.postalCode,
    mapLatitude: data.mapLatitude,
    mapLongitude: data.mapLongitude,
    phone: data.phone,
    website: data.website,
    rating: data.rating,
    reviewCount: data.reviewCount ?? 0,
    clinicType: "Pain Management",
  });

  return id;
}

/**
 * Get clinic count by state for coverage display
 */
export async function getCoverageByState(): Promise<Array<{ state: string; count: number }>> {
  const result = await db
    .select({
      state: clinics.state,
      count: sql<number>`count(*)::int`,
    })
    .from(clinics)
    .groupBy(clinics.state)
    .orderBy(desc(sql`count(*)`));

  return result;
}
```

---

## Phase 3: Backend - API Routes

Create new API routes for discovery search and import.

### Tasks

- [ ] Create `/api/admin/discover/search` route for searching with duplicate detection
- [ ] Create `/api/admin/discover/import` route for bulk importing selected clinics

### Technical Details

**File: `src/app/api/admin/discover/search/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getServerEnv } from "@/lib/env";
import { GooglePlacesClient } from "@/lib/google-places";
import { getExistingPlaceIds } from "@/lib/sync/sync-queries";

// City coordinates lookup (subset - expand as needed)
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Austin, Texas": { lat: 30.2672, lng: -97.7431 },
  "Chicago, Illinois": { lat: 41.8781, lng: -87.6298 },
  "Los Angeles, California": { lat: 34.0522, lng: -118.2437 },
  // ... add more cities
};

export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) return adminErrorResponse(adminCheck);

  const body = await request.json();
  const { city, state, filters } = body;

  const env = getServerEnv();
  const client = new GooglePlacesClient(env.GOOGLE_PLACES_API_KEY!);

  // Build search query
  const query = `pain management clinic near ${city}, ${state}`;

  // Get city coordinates for location bias
  const cityKey = `${city}, ${state}`;
  const coords = CITY_COORDS[cityKey];

  const results = await client.searchPlaces(query, {
    maxResultCount: 20,
    locationBias: coords ? {
      latitude: coords.lat,
      longitude: coords.lng,
      radiusMeters: 50000,
    } : undefined,
  });

  // Check for existing place_ids
  const placeIds = results.places.map(p => p.id);
  const existingIds = await getExistingPlaceIds(placeIds);
  const existingSet = new Set(existingIds);

  // Apply filters and mark duplicates
  let places = results.places.map(place => ({
    ...place,
    exists: existingSet.has(place.id),
  }));

  if (filters?.minRating) {
    places = places.filter(p => (p.rating ?? 0) >= filters.minRating);
  }
  if (filters?.minReviews) {
    places = places.filter(p => (p.userRatingCount ?? 0) >= filters.minReviews);
  }
  if (filters?.hasWebsite) {
    places = places.filter(p => !!p.websiteUri);
  }

  return NextResponse.json({
    places,
    stats: {
      total: places.length,
      new: places.filter(p => !p.exists).length,
      existing: places.filter(p => p.exists).length,
    },
  });
}
```

**File: `src/app/api/admin/discover/import/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getServerEnv } from "@/lib/env";
import { GooglePlacesClient } from "@/lib/google-places";
import { insertNewClinic, getExistingPlaceIds } from "@/lib/sync/sync-queries";
import { mapPlaceToClinic, buildApiFieldList } from "@/lib/google-places";

export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) return adminErrorResponse(adminCheck);

  const body = await request.json();
  const { places, fetchFullDetails = true } = body;

  const env = getServerEnv();
  const client = new GooglePlacesClient(env.GOOGLE_PLACES_API_KEY!);

  // Filter out existing
  const placeIds = places.map((p: any) => p.id);
  const existingIds = await getExistingPlaceIds(placeIds);
  const existingSet = new Set(existingIds);
  const newPlaces = places.filter((p: any) => !existingSet.has(p.id));

  const results = {
    imported: 0,
    skipped: existingSet.size,
    errors: [] as string[],
  };

  for (const place of newPlaces) {
    try {
      let clinicData = {
        placeId: place.id,
        title: place.displayName?.text || place.name,
        city: extractCity(place.formattedAddress),
        state: extractState(place.formattedAddress),
        postalCode: extractPostalCode(place.formattedAddress),
        mapLatitude: place.location?.latitude,
        mapLongitude: place.location?.longitude,
        phone: place.nationalPhoneNumber || place.phone,
        website: place.websiteUri || place.website,
        rating: place.rating,
        reviewCount: place.userRatingCount || place.reviewCount,
      };

      // Optionally fetch full details for richer data
      if (fetchFullDetails) {
        const fields = buildApiFieldList(["contact", "location", "reviews"]);
        const details = await client.getPlaceDetails(place.id, fields);
        const mapped = mapPlaceToClinic(details, ["contact", "location", "reviews"]);
        clinicData = { ...clinicData, ...mapped };
      }

      await insertNewClinic(clinicData);
      results.imported++;
    } catch (error) {
      results.errors.push(`${place.name}: ${error.message}`);
    }
  }

  return NextResponse.json(results);
}

// Helper functions to parse address
function extractCity(address: string): string {
  // Parse city from formatted address
  const parts = address.split(",");
  return parts[1]?.trim() || "Unknown";
}

function extractState(address: string): string {
  const parts = address.split(",");
  const stateZip = parts[2]?.trim() || "";
  return stateZip.split(" ")[0] || "Unknown";
}

function extractPostalCode(address: string): string {
  const match = address.match(/\b\d{5}(-\d{4})?\b/);
  return match?.[0] || "00000";
}
```

---

## Phase 4: Frontend - Admin Page

Create the admin discover page with search form, results table, and import functionality.

### Tasks

- [ ] Create `/admin/discover/page.tsx` main page component
- [ ] Create `search-form.tsx` component with city/state inputs and filters
- [ ] Create `results-table.tsx` component with checkboxes and status badges
- [ ] Create `import-dialog.tsx` component for import confirmation and progress
- [ ] Add "Discover" link to admin navigation

### Technical Details

**File: `src/app/admin/discover/page.tsx`**

```typescript
"use client";

import { useState } from "react";
import { SearchForm } from "@/components/admin/discover/search-form";
import { ResultsTable } from "@/components/admin/discover/results-table";
import { ImportDialog } from "@/components/admin/discover/import-dialog";

export default function DiscoverPage() {
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, new: 0, existing: 0 });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const handleSearch = async (params: { city: string; state: string; filters: any }) => {
    setIsSearching(true);
    try {
      const res = await fetch("/api/admin/discover/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      setResults(data.places);
      setStats(data.stats);
      setSelected(new Set());
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async () => {
    const selectedPlaces = results.filter(p => selected.has(p.id));
    // ImportDialog handles the actual import
    setShowImport(true);
  };

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Discover New Clinics</h1>

      <SearchForm onSearch={handleSearch} isLoading={isSearching} />

      {results.length > 0 && (
        <>
          <div className="my-4 text-sm text-muted-foreground">
            Found {stats.total} results ({stats.new} new, {stats.existing} existing)
          </div>

          <ResultsTable
            results={results}
            selected={selected}
            onSelectionChange={setSelected}
          />

          <div className="mt-4">
            <Button
              onClick={handleImport}
              disabled={selected.size === 0}
            >
              Import Selected ({selected.size})
            </Button>
          </div>
        </>
      )}

      <ImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        places={results.filter(p => selected.has(p.id))}
      />
    </div>
  );
}
```

**File: `src/components/admin/discover/search-form.tsx`**

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", /* ... all 50 states */
];

interface SearchFormProps {
  onSearch: (params: { city: string; state: string; filters: any }) => void;
  isLoading: boolean;
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [minRating, setMinRating] = useState<number | undefined>();
  const [minReviews, setMinReviews] = useState<number | undefined>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      city,
      state,
      filters: { minRating, minReviews },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Austin"
            required
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Select value={state} onValueChange={setState}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minRating">Min Rating</Label>
          <Input
            id="minRating"
            type="number"
            min="1"
            max="5"
            step="0.5"
            value={minRating || ""}
            onChange={(e) => setMinRating(e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="3.5"
          />
        </div>
        <div>
          <Label htmlFor="minReviews">Min Reviews</Label>
          <Input
            id="minReviews"
            type="number"
            min="0"
            value={minReviews || ""}
            onChange={(e) => setMinReviews(e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="5"
          />
        </div>
      </div>

      <Button type="submit" disabled={isLoading || !city || !state}>
        {isLoading ? "Searching..." : "Search"}
      </Button>
    </form>
  );
}
```

**File: `src/components/admin/discover/results-table.tsx`**

```typescript
"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ResultsTableProps {
  results: any[];
  selected: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
}

export function ResultsTable({ results, selected, onSelectionChange }: ResultsTableProps) {
  const toggleAll = () => {
    if (selected.size === results.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(results.map(r => r.id)));
    }
  };

  const toggle = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange(newSelected);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={selected.size === results.length}
              onCheckedChange={toggleAll}
            />
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>Reviews</TableHead>
          <TableHead>Website</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((place) => (
          <TableRow key={place.id} className={place.exists ? "opacity-50" : ""}>
            <TableCell>
              <Checkbox
                checked={selected.has(place.id)}
                onCheckedChange={() => toggle(place.id)}
                disabled={place.exists}
              />
            </TableCell>
            <TableCell>
              <Badge variant={place.exists ? "secondary" : "default"}>
                {place.exists ? "Exists" : "New"}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">
              {place.displayName?.text || place.name}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {place.formattedAddress || place.address}
            </TableCell>
            <TableCell>{place.rating?.toFixed(1) || "-"}</TableCell>
            <TableCell>{place.userRatingCount || place.reviewCount || "-"}</TableCell>
            <TableCell>
              {(place.websiteUri || place.website) && (
                <a
                  href={place.websiteUri || place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Link
                </a>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

**Admin Navigation Update**

Add to `src/app/admin/layout.tsx` or navigation component:

```typescript
<Link href="/admin/discover">Discover</Link>
```

---

## Files Summary

| Action | File |
|--------|------|
| MODIFY | `src/lib/google-places/types.ts` |
| MODIFY | `src/lib/google-places/client.ts` |
| MODIFY | `src/app/api/admin/places/lookup/route.ts` |
| MODIFY | `src/lib/sync/sync-queries.ts` |
| CREATE | `src/app/api/admin/discover/search/route.ts` |
| CREATE | `src/app/api/admin/discover/import/route.ts` |
| CREATE | `src/app/admin/discover/page.tsx` |
| CREATE | `src/components/admin/discover/search-form.tsx` |
| CREATE | `src/components/admin/discover/results-table.tsx` |
| CREATE | `src/components/admin/discover/import-dialog.tsx` |
| MODIFY | Admin navigation (add Discover link) |
