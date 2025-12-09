# Implementation Plan: SEO/URL Preservation

## Overview

Preserve WordPress URL structure (`/pain-management/[slug]/`) during Next.js migration to protect organic Google rankings and AdSense revenue. Implements dynamic routing, SEO metadata, structured data, sitemap generation, and URL normalization middleware.

---

## Phase 1: Verify Existing Permalinks ✅

Confirm database permalinks are in the correct format before building routes.

### Tasks

- [x] Query database to check permalink format of existing clinics
- [x] Verify permalinks contain `pain-management/` prefix
- [x] Document any permalinks that need correction

### Findings & Fixes Applied

**Issue Found:** The `extractPermalinkSlug` function in `src/lib/clinic-transformer.ts` was only extracting the final slug segment, losing the `pain-management/` prefix.

**CSV Data Format:** Full URLs like `https://painclinics.com/pain-management/alabama-pain-physicians-birmingham-al-35243/`

**Fix Applied:**
1. Added new `extractPermalinkPath` function that preserves the `pain-management/` prefix
2. Updated `transformClinicRow` (line 427) to use `extractPermalinkPath` instead of `extractPermalinkSlug`
3. Added fallback to generate proper path: `pain-management/${slug}` when URL is missing

**Verified Output:**
- Input: `https://painclinics.com/pain-management/alabama-pain-physicians-birmingham-al-35243/`
- Output: `pain-management/alabama-pain-physicians-birmingham-al-35243`

### Technical Details

**Database query to verify permalink format:**
```sql
SELECT permalink, title FROM clinics LIMIT 10;
```

**Expected format:**
```
pain-management/alabama-pain-physicians-birmingham-al-35243
```

**If permalinks are just slugs (missing prefix), update `src/lib/clinic-transformer.ts` line 397:**
```typescript
// Current (extracts only slug):
permalink: extractPermalinkSlug(row.Permalink) || title.toLowerCase().replace(/\s+/g, "-"),

// Should be (preserves path):
permalink: extractPermalinkPath(row.Permalink) || `pain-management/${title.toLowerCase().replace(/\s+/g, "-")}`,
```

---

## Phase 2: Database Query Utilities ✅

Create utilities to fetch clinic data by permalink and for sitemap generation.

### Tasks

- [x] Create `src/lib/clinic-queries.ts` with database query functions
- [x] Implement `getClinicByPermalink()` with case-insensitive lookup
- [x] Implement `getAllClinicPermalinks()` for sitemap generation
- [x] Implement `getClinicsByState()` for state landing pages
- [x] Add database index on `permalink` column if not already present

### Implementation Notes

**File created:** `src/lib/clinic-queries.ts`

The file includes:
- `getClinicByPermalink(slug)` - Case-insensitive lookup with automatic `pain-management/` prefix
- `getAllClinicPermalinks()` - Returns all permalinks with updatedAt for sitemap generation
- `getClinicsByState(stateAbbrev)` - Fetches clinics by state, ordered by city and title
- `getAllStatesWithClinics()` - Returns unique state abbreviations for state landing pages
- `getClinicCountsByState()` - Returns clinic counts per state for statistics
- `getClinicsByCity(city, stateAbbrev?)` - Search clinics by city with optional state filter

**Index note:** The `permalink` column already has a unique constraint which automatically creates an index in PostgreSQL. For case-insensitive lookups with `LOWER()`, a functional index could be added via SQL migration if performance becomes an issue at scale.

### Technical Details

**File:** `src/lib/clinic-queries.ts`

```typescript
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function getClinicByPermalink(slug: string) {
  const permalinkPath = `pain-management/${slug}`;

  const results = await db
    .select()
    .from(clinics)
    .where(sql`LOWER(${clinics.permalink}) = LOWER(${permalinkPath})`)
    .limit(1);

  return results[0] || null;
}

export async function getAllClinicPermalinks() {
  return db
    .select({
      permalink: clinics.permalink,
      updatedAt: clinics.updatedAt,
    })
    .from(clinics);
}

export async function getClinicsByState(stateAbbrev: string) {
  return db
    .select()
    .from(clinics)
    .where(sql`UPPER(${clinics.stateAbbreviation}) = UPPER(${stateAbbrev})`)
    .orderBy(clinics.city, clinics.title);
}
```

**Database index (add to `src/lib/schema.ts` if not present):**
```typescript
// In clinics table indexes array:
index("clinics_permalink_idx").on(table.permalink),
```

---

## Phase 3: Type Transformer ✅

Create utility to transform database clinic records to the existing Clinic type used by components.

### Tasks

- [x] Create `src/lib/clinic-db-to-type.ts` with transformer function
- [x] Map database fields to Clinic interface from `src/types/clinic.ts`
- [x] Handle JSONB fields (clinicHours, reviewKeywords, etc.)
- [x] Handle null values appropriately

### Implementation Notes

**File created:** `src/lib/clinic-db-to-type.ts`

The transformer includes:
- `transformDbClinicToType(dbClinic)` - Main transformer function
- `transformDbClinicsToType(dbClinics)` - Batch transform for arrays
- `mapInsuranceToTypes(insuranceStrings)` - Utility for future insurance data

**Key mappings:**
- `dbClinic.title` → `clinic.name`
- `dbClinic.permalink` → extracts slug portion for `clinic.slug`
- `dbClinic.clinicHours` (JSONB) → `clinic.hours` (OperatingHours)
- `dbClinic.amenities` → `clinic.services` (mapped to ServiceType enum)
- `dbClinic.content` → `clinic.about` (with HTML tags stripped)
- `dbClinic.clinicImageUrls` → `clinic.photos`

**HTML stripping:** Content is stripped of HTML tags and common entities decoded.

**Optional properties:** Uses conditional spread (`...(email ? { email } : {})`) for TypeScript `exactOptionalPropertyTypes` compliance.

### Technical Details

**File:** `src/lib/clinic-db-to-type.ts`

```typescript
import type { Clinic, OperatingHours, DayHours } from "@/types/clinic";
import type { ClinicHour } from "./clinic-transformer";

type DbClinic = typeof import("./schema").clinics.$inferSelect;

export function transformDbClinicToType(dbClinic: DbClinic): Clinic {
  return {
    id: dbClinic.id,
    name: dbClinic.title,
    slug: extractSlugFromPermalink(dbClinic.permalink),
    address: {
      street: dbClinic.streetAddress || "",
      city: dbClinic.city,
      state: dbClinic.stateAbbreviation || dbClinic.state,
      zipCode: dbClinic.postalCode,
      formatted: formatAddress(dbClinic),
    },
    coordinates: {
      lat: dbClinic.mapLatitude,
      lng: dbClinic.mapLongitude,
    },
    phone: dbClinic.phone || "",
    website: dbClinic.website || undefined,
    hours: transformClinicHours(dbClinic.clinicHours as ClinicHour[] | null),
    services: [], // Map from amenities if needed
    insuranceAccepted: [],
    rating: dbClinic.rating || 0,
    reviewCount: dbClinic.reviewCount || 0,
    photos: dbClinic.clinicImageUrls || [],
    about: dbClinic.content || "",
    isVerified: true,
    isFeatured: false,
  };
}

function extractSlugFromPermalink(permalink: string): string {
  const parts = permalink.split("/");
  return parts[parts.length - 1] || permalink;
}

function formatAddress(clinic: DbClinic): string {
  const parts = [
    clinic.streetAddress,
    clinic.city,
    `${clinic.stateAbbreviation || clinic.state} ${clinic.postalCode}`,
  ].filter(Boolean);
  return parts.join(", ");
}

function transformClinicHours(hours: ClinicHour[] | null): OperatingHours {
  const defaultClosed: DayHours = { open: "", close: "", closed: true };
  const result: OperatingHours = {
    monday: defaultClosed,
    tuesday: defaultClosed,
    wednesday: defaultClosed,
    thursday: defaultClosed,
    friday: defaultClosed,
    saturday: defaultClosed,
    sunday: defaultClosed,
  };

  if (!hours) return result;

  const dayMap: Record<string, keyof OperatingHours> = {
    Monday: "monday",
    Tuesday: "tuesday",
    Wednesday: "wednesday",
    Thursday: "thursday",
    Friday: "friday",
    Saturday: "saturday",
    Sunday: "sunday",
  };

  for (const { day, hours: timeStr } of hours) {
    const key = dayMap[day];
    if (!key) continue;

    if (timeStr === "Closed" || !timeStr) {
      result[key] = { open: "", close: "", closed: true };
    } else {
      const [open, close] = timeStr.split("-").map((t) => t.trim());
      result[key] = { open: open || "", close: close || "", closed: false };
    }
  }

  return result;
}
```

---

## Phase 4: Structured Data Generator ✅

Create Schema.org structured data for clinic pages.

### Tasks

- [x] Create `src/lib/structured-data.ts` with generator function
- [x] Implement MedicalBusiness/LocalBusiness schema
- [x] Include address, geo, rating, hours
- [x] Handle missing/null fields gracefully

### Implementation Notes

**File created:** `src/lib/structured-data.ts`

The file includes:
- `generateClinicStructuredData(clinic)` - Main generator for MedicalBusiness/LocalBusiness schema
- `generateBreadcrumbStructuredData(clinic, stateName?)` - BreadcrumbList for navigation SEO
- `generateFAQStructuredData(questions)` - FAQPage schema for Q&A content
- `formatOpeningHours(hours)` - Internal helper for OpeningHoursSpecification
- `formatTime24(time12)` - Converts 12-hour to 24-hour format for Schema.org

**Key Features:**
- Graceful handling of null/undefined fields (conditionally adds properties only when data exists)
- HTML tag stripping from content for clean descriptions
- Support for aggregate ratings when reviewCount > 0
- Opening hours converted to ISO 24-hour format
- Breadcrumb structured data for better SERP display
- FAQ schema support for Q&A content

### Technical Details

**File:** `src/lib/structured-data.ts`

```typescript
type DbClinic = typeof import("./schema").clinics.$inferSelect;

interface ClinicHour {
  day: string;
  hours: string;
}

export function generateClinicStructuredData(clinic: DbClinic) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";

  return {
    "@context": "https://schema.org",
    "@type": ["MedicalBusiness", "LocalBusiness"],
    "@id": `${baseUrl}/${clinic.permalink}/#organization`,
    name: clinic.title,
    description: clinic.content?.substring(0, 200) ||
      `${clinic.title} provides pain management services in ${clinic.city}, ${clinic.state}.`,
    url: `${baseUrl}/${clinic.permalink}/`,
    telephone: clinic.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: clinic.streetAddress,
      addressLocality: clinic.city,
      addressRegion: clinic.stateAbbreviation || clinic.state,
      postalCode: clinic.postalCode,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: clinic.mapLatitude,
      longitude: clinic.mapLongitude,
    },
    image: clinic.imageFeatured || clinic.imageUrl,
    aggregateRating: clinic.rating && clinic.reviewCount ? {
      "@type": "AggregateRating",
      ratingValue: clinic.rating,
      reviewCount: clinic.reviewCount,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
    openingHoursSpecification: formatOpeningHours(clinic.clinicHours as ClinicHour[] | null),
    medicalSpecialty: "Pain Medicine",
    priceRange: "$$",
  };
}

function formatOpeningHours(hours: ClinicHour[] | null) {
  if (!hours) return undefined;

  return hours
    .filter(h => h.hours && h.hours !== "Closed")
    .map(h => {
      const [open, close] = h.hours.split("-").map(t => t.trim());
      return {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: h.day,
        opens: formatTime24(open),
        closes: formatTime24(close),
      };
    });
}

function formatTime24(time12: string): string {
  if (!time12) return "09:00";

  const match = time12.match(/(\d+):?(\d*)?\s*(AM|PM)?/i);
  if (!match) return "09:00";

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3]?.toUpperCase();

  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}
```

---

## Phase 5: Dynamic Pain Management Route [complex] ✅

Create the main `/pain-management/[...slug]` route with SEO metadata and structured data.

### Tasks

- [x] Create `src/app/pain-management/[...slug]/page.tsx` dynamic route
- [x] Implement `generateMetadata()` for dynamic SEO tags
- [x] Add structured data injection via script tag
- [x] Integrate existing clinic components for rendering
- [x] Handle `notFound()` for missing clinics
- [x] Create proper 404 page at `src/app/pain-management/[...slug]/not-found.tsx`

### Implementation Notes

**Files created:**
- `src/app/pain-management/[...slug]/page.tsx` - Main dynamic route with SEO metadata and structured data
- `src/app/pain-management/[...slug]/not-found.tsx` - Custom 404 page for missing clinics

**Key Features:**
- `generateMetadata()` - Generates dynamic title, description, canonical URL, OpenGraph, and Twitter metadata
- Schema.org structured data (MedicalBusiness/LocalBusiness + BreadcrumbList) injected via JSON-LD script tags
- Integrated existing components: ClinicHeader, ClinicAbout, ClinicServices, ClinicInsurance, ClinicGallery, ClinicHours, EmbeddedMap
- Responsive grid layout with sidebar for contact info, map, and hours
- Proper 404 handling with `notFound()` from next/navigation
- Custom not-found page with helpful suggestions for users

### Technical Details

**File:** `src/app/pain-management/[...slug]/page.tsx`

```typescript
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClinicByPermalink } from "@/lib/clinic-queries";
import { transformDbClinicToType } from "@/lib/clinic-db-to-type";
import { generateClinicStructuredData } from "@/lib/structured-data";
import { ClinicHeader } from "@/components/clinic/clinic-header";
import { ClinicAbout } from "@/components/clinic/clinic-about";
import { ClinicServices } from "@/components/clinic/clinic-services";
import { ClinicInsurance } from "@/components/clinic/clinic-insurance";
import { ClinicGallery } from "@/components/clinic/clinic-gallery";
import { ClinicHours } from "@/components/clinic/clinic-hours";
import { EmbeddedMap } from "@/components/map/embedded-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const clinic = await getClinicByPermalink(slugPath);

  if (!clinic) return {};

  const title = `${clinic.title} - Pain Management in ${clinic.city}, ${clinic.stateAbbreviation || clinic.state}`;
  const description = clinic.content?.substring(0, 160).replace(/<[^>]*>/g, "") ||
    `${clinic.title} provides pain management services in ${clinic.city}, ${clinic.state}. Call ${clinic.phone} for appointments.`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";
  const canonicalUrl = `${baseUrl}/${clinic.permalink}/`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      images: clinic.imageFeatured ? [{ url: clinic.imageFeatured }] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PainManagementClinicPage({ params }: Props) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const dbClinic = await getClinicByPermalink(slugPath);

  if (!dbClinic) {
    notFound();
  }

  const clinic = transformDbClinicToType(dbClinic);
  const structuredData = generateClinicStructuredData(dbClinic);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="flex-1">
        <div className="container py-8">
          <ClinicHeader clinic={clinic} className="mb-8" />

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <ClinicAbout about={clinic.about} />
              <ClinicServices services={clinic.services} />
              <ClinicInsurance insurance={clinic.insuranceAccepted} />
              <ClinicGallery photos={clinic.photos} clinicName={clinic.name} />
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmbeddedMap clinic={clinic} className="h-[250px]" />
                </CardContent>
              </Card>

              <ClinicHours hours={clinic.hours} />

              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p className="text-sm">{clinic.address.formatted}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <a href={`tel:${clinic.phone}`} className="text-sm text-primary hover:underline">
                      {clinic.phone}
                    </a>
                  </div>
                  {clinic.website && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Website</p>
                      <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                        {clinic.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
```

---

## Phase 6: URL Normalization Middleware ✅

Create middleware for trailing slash normalization, case normalization, and legacy redirects.

### Tasks

- [x] Create `middleware.ts` at project root
- [x] Implement trailing slash redirect (add if missing)
- [x] Implement case normalization (lowercase)
- [x] Implement `/clinics/[slug]` → `/pain-management/[slug]/` redirect
- [x] Configure matcher for relevant paths

### Implementation Notes

**File created:** `middleware.ts` (project root)

The middleware handles URL normalization in this order:
1. **Legacy redirects:** `/clinics/[slug]` → `/pain-management/[slug]/` (301)
2. **Case normalization:** Mixed-case paths like `/Pain-Management/...` → lowercase (301)
3. **Trailing slash:** Adds trailing slash if missing for clinic detail pages (301)

**Key Features:**
- Skips static files (`/_next`, `.`) and API routes (`/api`)
- Uses 301 (permanent) redirects for SEO benefits
- Case-insensitive pattern matching in config
- Handles edge cases like `/clinics` without trailing slug

### Technical Details

**File:** `middleware.ts` (project root)

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Redirect /clinics/[slug] to /pain-management/[slug]/
  if (pathname.startsWith("/clinics/") && pathname !== "/clinics") {
    const slug = pathname.replace("/clinics/", "");
    const url = request.nextUrl.clone();
    url.pathname = `/pain-management/${slug}/`;
    return NextResponse.redirect(url, 301);
  }

  // 2. Case normalization for /pain-management/ paths
  if (pathname.startsWith("/pain-management/") || pathname.startsWith("/Pain-Management/")) {
    const lowerPath = pathname.toLowerCase();
    if (pathname !== lowerPath) {
      const url = request.nextUrl.clone();
      url.pathname = lowerPath;
      return NextResponse.redirect(url, 301);
    }
  }

  // 3. Trailing slash normalization (add if missing)
  if (pathname.startsWith("/pain-management/") && !pathname.endsWith("/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname + "/";
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/pain-management/:path*",
    "/Pain-Management/:path*",
    "/clinics/:path+",
  ],
};
```

---

## Phase 7: Dynamic Sitemap Generation ✅

Update sitemap to include all clinic URLs with proper metadata.

### Tasks

- [x] Update `src/app/sitemap.ts` to fetch all clinic permalinks
- [x] Generate URLs with correct format and trailing slash
- [x] Include `lastModified` from database `updatedAt`
- [x] Set appropriate priority and changeFrequency
- [x] Update `src/app/robots.ts` to allow `/pain-management/` and reference sitemap

### Implementation Notes

**Files modified:**
- `src/app/sitemap.ts` - Converted to async function, fetches all clinic permalinks from database
- `src/app/robots.ts` - Added `/pain-management/` and `/clinics` to allowed paths, added `/admin/` to disallowed

**Key Features:**
- Static pages: Homepage (priority 1.0, daily) and /clinics (priority 0.9, daily)
- Dynamic clinic pages: All permalinks from database (priority 0.8, weekly)
- URLs include trailing slash for SEO consistency
- `lastModified` uses database `updatedAt` timestamp
- Default production URL set to `https://painclinics.com`

### Technical Details

**File:** `src/app/sitemap.ts`

```typescript
import type { MetadataRoute } from "next";
import { getAllClinicPermalinks } from "@/lib/clinic-queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/clinics`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Dynamic clinic pages
  const allClinics = await getAllClinicPermalinks();

  const clinicPages: MetadataRoute.Sitemap = allClinics.map((clinic) => ({
    url: `${baseUrl}/${clinic.permalink}/`,
    lastModified: clinic.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...clinicPages];
}
```

**File:** `src/app/robots.ts`

```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pain-management/", "/clinics"],
        disallow: ["/api/", "/admin/", "/dashboard/", "/profile/", "/chat/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

---

## Phase 8: State Landing Pages ✅

Create state-level aggregation pages for location SEO.

### Tasks

- [x] Create `src/app/pain-management/[state]/page.tsx` for state pages
- [x] Implement `generateStaticParams()` for all states with clinics
- [x] Group clinics by city for display
- [x] Add state-specific SEO metadata

### Implementation Notes

**Approach:** Integrated state pages into the existing `[...slug]` catch-all route rather than creating a separate `[state]` folder. This avoids routing conflicts since both clinic slugs and state abbreviations are single-segment paths.

**Files created/modified:**
- `src/app/pain-management/state-page.tsx` - Client component for rendering state landing page content
- `src/app/pain-management/[...slug]/page.tsx` - Modified to detect 2-character state abbreviations and render state pages
- `src/app/sitemap.ts` - Updated to include state landing pages with priority 0.85

**Key Features:**
- State detection using `US_STATES_REVERSE` lookup for valid 2-character abbreviations
- `generateStaticParams()` pre-renders all state pages at build time
- Clinics grouped by city with expandable cards showing clinic details
- Statistics cards showing total clinics and cities served
- Quick navigation for states with many cities (>5)
- Schema.org CollectionPage structured data with ItemList for SEO
- BreadcrumbList structured data for navigation
- Full SEO metadata: title, description, canonical URL, OpenGraph, Twitter cards
- Responsive grid layout: 1 column mobile, 2 columns tablet, 3 columns desktop

**URL Format:** `/pain-management/[state-abbrev]/` (e.g., `/pain-management/al/`, `/pain-management/ca/`)

### Technical Details

**File:** `src/app/pain-management/[state]/page.tsx`

```typescript
import { Metadata } from "next";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { getStateName } from "@/lib/us-states";
import Link from "next/link";

interface Props {
  params: Promise<{ state: string }>;
}

export async function generateStaticParams() {
  const states = await db
    .selectDistinct({ state: clinics.stateAbbreviation })
    .from(clinics);

  return states
    .filter((s) => s.state)
    .map((s) => ({ state: s.state!.toLowerCase() }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const stateName = getStateName(state.toUpperCase()) || state.toUpperCase();

  return {
    title: `Pain Management Clinics in ${stateName} | Find Relief Near You`,
    description: `Find top-rated pain management clinics in ${stateName}. Browse verified clinics, read reviews, and book appointments.`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL}/pain-management/${state.toLowerCase()}/`,
    },
  };
}

export default async function StatePainManagementPage({ params }: Props) {
  const { state } = await params;
  const stateAbbrev = state.toUpperCase();
  const stateName = getStateName(stateAbbrev) || stateAbbrev;

  const stateClinics = await db
    .select()
    .from(clinics)
    .where(sql`UPPER(${clinics.stateAbbreviation}) = ${stateAbbrev}`)
    .orderBy(clinics.city, clinics.title);

  // Group by city
  const byCity = stateClinics.reduce((acc, clinic) => {
    const city = clinic.city;
    if (!acc[city]) acc[city] = [];
    acc[city].push(clinic);
    return acc;
  }, {} as Record<string, typeof stateClinics>);

  return (
    <main className="flex-1">
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">
          Pain Management Clinics in {stateName}
        </h1>
        <p className="text-muted-foreground mb-8">
          {stateClinics.length} pain management clinics in {stateName}
        </p>

        {Object.entries(byCity).map(([city, cityClinics]) => (
          <section key={city} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{city}</h2>
            <ul className="space-y-2">
              {cityClinics.map((clinic) => (
                <li key={clinic.id}>
                  <Link
                    href={`/${clinic.permalink}/`}
                    className="text-primary hover:underline"
                  >
                    {clinic.title}
                  </Link>
                  {clinic.rating && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({clinic.rating.toFixed(1)} stars)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
```

---

## Phase 9: Admin URL Validation Tool ✅

Create admin tool to validate URL integrity before launch.

### Tasks

- [x] Create `src/app/api/admin/validate-urls/route.ts` API endpoint
- [x] Check all permalinks match expected format
- [x] Identify duplicates or malformed URLs
- [x] Return validation report

### Implementation Notes

**File created:** `src/app/api/admin/validate-urls/route.ts`

The endpoint includes two HTTP methods:

**GET /api/admin/validate-urls** - Validates all clinic permalinks and returns a detailed report:
- Checks for missing `pain-management/` prefix
- Validates URL format matches expected pattern (`pain-management/slug-state-zipcode`)
- Identifies duplicate permalinks (case-insensitive)
- Detects empty permalinks, trailing slashes, and invalid URL characters
- Returns categorized issue counts and first 100 issues
- Includes sample permalinks for verification

**POST /api/admin/validate-urls** - Automated fixes with actions:
- `fix-prefix`: Adds `pain-management/` prefix to permalinks missing it
- `remove-trailing-slash`: Removes trailing slashes from permalinks
- `lowercase`: Converts all permalinks to lowercase

**Security:** Both endpoints require admin authentication using the existing `checkAdmin()` pattern.

**Response format:**
```json
{
  "total": 4575,
  "validCount": 4500,
  "issueCount": 75,
  "categories": {
    "missingPrefix": 0,
    "formatMismatch": 50,
    "duplicates": 0,
    "emptyPermalinks": 0,
    "trailingSlash": 25,
    "invalidCharacters": 0
  },
  "issues": [...],
  "samplePermalinks": [...]
}
```

### Technical Details

**File:** `src/app/api/admin/validate-urls/route.ts`

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allClinics = await db
    .select({
      id: clinics.id,
      title: clinics.title,
      permalink: clinics.permalink,
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
      postalCode: clinics.postalCode,
    })
    .from(clinics);

  const issues: Array<{
    clinicId: string;
    title: string;
    issue: string;
    actual: string;
    expected?: string;
  }> = [];

  const permalinkCounts = new Map<string, number>();

  for (const clinic of allClinics) {
    // Check for pain-management prefix
    if (!clinic.permalink.startsWith("pain-management/")) {
      issues.push({
        clinicId: clinic.id,
        title: clinic.title,
        issue: "Missing pain-management prefix",
        actual: clinic.permalink,
        expected: `pain-management/${clinic.permalink}`,
      });
    }

    // Check format pattern
    const expectedPattern = /^pain-management\/[\w-]+-[a-z]{2}-\d{5}$/i;
    if (!expectedPattern.test(clinic.permalink)) {
      issues.push({
        clinicId: clinic.id,
        title: clinic.title,
        issue: "Permalink format mismatch",
        actual: clinic.permalink,
        expected: `pain-management/slug-${clinic.stateAbbreviation?.toLowerCase()}-${clinic.postalCode}`,
      });
    }

    // Track duplicates
    const lower = clinic.permalink.toLowerCase();
    permalinkCounts.set(lower, (permalinkCounts.get(lower) || 0) + 1);
  }

  // Report duplicates
  for (const [permalink, count] of permalinkCounts) {
    if (count > 1) {
      const dupes = allClinics.filter(
        (c) => c.permalink.toLowerCase() === permalink
      );
      for (const dupe of dupes) {
        issues.push({
          clinicId: dupe.id,
          title: dupe.title,
          issue: `Duplicate permalink (${count} occurrences)`,
          actual: dupe.permalink,
        });
      }
    }
  }

  return NextResponse.json({
    total: allClinics.length,
    issueCount: issues.length,
    issues: issues.slice(0, 100),
    samplePermalinks: allClinics.slice(0, 10).map((c) => c.permalink),
  });
}
```

---

## Files Summary

### New Files

| Path | Purpose |
|------|---------|
| `src/lib/clinic-queries.ts` | Database query utilities |
| `src/lib/clinic-db-to-type.ts` | Transform DB record to Clinic type |
| `src/lib/structured-data.ts` | Schema.org structured data generator |
| `src/app/pain-management/[...slug]/page.tsx` | Main clinic detail route + state pages |
| `src/app/pain-management/[...slug]/not-found.tsx` | 404 page for clinics |
| `src/app/pain-management/state-page.tsx` | State landing page component |
| `src/app/api/admin/validate-urls/route.ts` | URL validation API (Phase 9) |
| `middleware.ts` | URL normalization and redirects |

### Modified Files

| Path | Change |
|------|--------|
| `src/app/sitemap.ts` | Add dynamic clinic URLs and state pages |
| `src/app/robots.ts` | Update allowed paths |
| `src/lib/schema.ts` | Add permalink index (if needed) |

---

## Validation Checklist

- [ ] `/pain-management/alabama-pain-physicians-birmingham-al-35243/` returns correct clinic
- [ ] Case-insensitive: `/Pain-Management/...` redirects 301 to lowercase
- [ ] Trailing slash: `/pain-management/slug` redirects to `/pain-management/slug/`
- [ ] Legacy redirect: `/clinics/slug` redirects 301 to `/pain-management/slug/`
- [ ] Sitemap.xml contains all 4,575+ clinic URLs
- [ ] Structured data validates in Google Rich Results Test
- [ ] Meta title/description/canonical render correctly
- [ ] 404 page returns proper HTTP status for missing clinics
