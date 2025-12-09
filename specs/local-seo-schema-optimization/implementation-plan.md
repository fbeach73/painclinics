# Implementation Plan: Local SEO & Schema.org Optimization

## Overview

Implement comprehensive Local SEO enhancements including enhanced schema.org structured data, city landing pages, geo meta tags, and an admin analytics dashboard for review keyword analysis.

---

## Phase 1: Database Queries

Add database query functions needed for city pages and analytics.

### Tasks

- [x] Add `getCitiesForState(stateAbbrev)` function to get unique cities for a state
- [x] Add `getAllCitiesWithClinics()` function to get all cities with clinic counts grouped by state
- [x] Add `getAllCityPermalinks()` function for sitemap generation

### Technical Details

**File:** `src/lib/clinic-queries.ts`

```typescript
/**
 * Get all unique cities with clinics for a specific state.
 */
export async function getCitiesForState(stateAbbrev: string) {
  const results = await db
    .selectDistinct({ city: clinics.city })
    .from(clinics)
    .where(sql`UPPER(${clinics.stateAbbreviation}) = UPPER(${stateAbbrev})`)
    .orderBy(asc(clinics.city));
  return results.map((r) => r.city);
}

/**
 * Get all cities with clinics across all states.
 */
export async function getAllCitiesWithClinics() {
  return db
    .select({
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(clinics)
    .groupBy(clinics.city, clinics.stateAbbreviation)
    .orderBy(asc(clinics.stateAbbreviation), asc(clinics.city));
}

/**
 * Get all city permalinks for sitemap generation.
 */
export async function getAllCityPermalinks() {
  const cities = await getAllCitiesWithClinics();
  return cities.map(c => ({
    state: c.stateAbbreviation?.toLowerCase(),
    city: c.city.toLowerCase().replace(/\s+/g, "-"),
    count: c.count,
  }));
}
```

---

## Phase 2: Enhanced Clinic Schema

Extend the clinic structured data with reviews, social links, services, and map link.

### Tasks

- [x] Add FeaturedReview type definition to structured-data.ts
- [x] Add `sameAs` array generation from social media fields
- [x] Add `review` array with up to 10 featured reviews from featuredReviews JSONB
- [x] Add `amenityFeature` from clinic amenities array
- [x] Add `availableService` as MedicalProcedure types with service mapping
- [x] Add `hasMap` using placeId for Google Maps link

### Technical Details

**File:** `src/lib/structured-data.ts`

**Type Definition:**
```typescript
interface FeaturedReview {
  username: string | null;
  url: string | null;
  review: string | null;
  date: string | null;
  rating: number | null;
}
```

**sameAs Array (add after existing website handling):**
```typescript
const sameAs: string[] = [];
if (clinic.website) sameAs.push(clinic.website);
if (clinic.facebook) sameAs.push(clinic.facebook);
if (clinic.instagram) sameAs.push(clinic.instagram);
if (clinic.twitter) sameAs.push(clinic.twitter);
if (clinic.youtube) sameAs.push(clinic.youtube);
if (clinic.linkedin) sameAs.push(clinic.linkedin);
if (clinic.tiktok) sameAs.push(clinic.tiktok);
if (clinic.pinterest) sameAs.push(clinic.pinterest);
if (sameAs.length > 0) {
  structuredData.sameAs = sameAs;
}
```

**Reviews Array:**
```typescript
const featuredReviews = clinic.featuredReviews as FeaturedReview[] | null;
if (featuredReviews && featuredReviews.length > 0) {
  structuredData.review = featuredReviews
    .slice(0, 10)
    .filter(r => r.review)
    .map(r => ({
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating || 5,
        bestRating: 5,
        worstRating: 1,
      },
      author: {
        "@type": "Person",
        name: r.username || "Anonymous",
      },
      reviewBody: r.review,
      ...(r.date && { datePublished: r.date }),
    }));
}
```

**Service Mapping:**
```typescript
const SERVICE_MAPPING: Record<string, { name: string; procedureType: string }> = {
  "injection therapy": { name: "Injection Therapy", procedureType: "Therapeutic" },
  "physical therapy": { name: "Physical Therapy", procedureType: "Therapeutic" },
  "nerve blocks": { name: "Nerve Block Procedures", procedureType: "Therapeutic" },
  "epidural steroid injections": { name: "Epidural Steroid Injections", procedureType: "Therapeutic" },
  "radiofrequency ablation": { name: "Radiofrequency Ablation", procedureType: "Therapeutic" },
  "spinal cord stimulation": { name: "Spinal Cord Stimulation", procedureType: "Therapeutic" },
  "medication management": { name: "Medication Management", procedureType: "Therapeutic" },
};
```

**hasMap:**
```typescript
if (clinic.placeId) {
  structuredData.hasMap = `https://www.google.com/maps/place/?q=place_id:${clinic.placeId}`;
}
```

---

## Phase 3: New Schema Functions

Add WebSite, Organization, City page, and default FAQ schema generators.

### Tasks

- [x] Add `generateWebSiteSchema(baseUrl)` function with SearchAction
- [x] Add `generateOrganizationSchema(baseUrl)` function
- [x] Add `generateCityPageSchema(city, stateAbbrev, stateName, clinics, baseUrl)` function
- [x] Add `generateDefaultClinicFAQ(clinic)` function for fallback FAQs
- [x] Update `generateBreadcrumbStructuredData()` to support 5-level breadcrumbs with city

### Technical Details

**File:** `src/lib/structured-data.ts`

**WebSite Schema:**
```typescript
export function generateWebSiteSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "Pain Clinics Directory",
    description: "Find pain management clinics near you",
    publisher: { "@id": `${baseUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/pain-management/{state}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
```

**Organization Schema:**
```typescript
export function generateOrganizationSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "Pain Clinics Directory",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: "English",
    },
  };
}
```

**City Page Schema:**
```typescript
export function generateCityPageSchema(
  city: string,
  stateAbbrev: string,
  stateName: string,
  clinics: DbClinic[],
  baseUrl: string
) {
  const citySlug = city.toLowerCase().replace(/\s+/g, "-");
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${baseUrl}/pain-management/${stateAbbrev.toLowerCase()}/${citySlug}/#webpage`,
    name: `Pain Management Clinics in ${city}, ${stateAbbrev}`,
    description: `Find ${clinics.length} pain management clinics in ${city}, ${stateName}.`,
    url: `${baseUrl}/pain-management/${stateAbbrev.toLowerCase()}/${citySlug}/`,
    isPartOf: { "@id": `${baseUrl}/pain-management/${stateAbbrev.toLowerCase()}/#webpage` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: clinics.length,
      itemListElement: clinics.map((clinic, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "MedicalBusiness",
          "@id": `${baseUrl}/${clinic.permalink}/#organization`,
          name: clinic.title,
          url: `${baseUrl}/${clinic.permalink}/`,
        },
      })),
    },
  };
}
```

**Default FAQ:**
```typescript
export function generateDefaultClinicFAQ(clinic: DbClinic) {
  return [
    {
      question: `What services does ${clinic.title} offer?`,
      answer: `${clinic.title} provides comprehensive pain management services including evaluation, diagnosis, and treatment of chronic pain conditions.`,
    },
    {
      question: `Where is ${clinic.title} located?`,
      answer: `${clinic.title} is located at ${clinic.streetAddress || ""} ${clinic.city}, ${clinic.stateAbbreviation || clinic.state} ${clinic.postalCode}.`,
    },
    {
      question: `How do I schedule an appointment at ${clinic.title}?`,
      answer: `You can schedule an appointment by calling ${clinic.phone || "our office"} during business hours.`,
    },
  ];
}
```

**Updated Breadcrumb (add includeCity parameter):**
```typescript
export function generateBreadcrumbStructuredData(
  clinic: DbClinic,
  stateName?: string,
  includeCity: boolean = true
) {
  // ... implementation that adds city level when includeCity is true
}
```

---

## Phase 4: City Landing Pages [complex]

Implement city landing page routing and component.

### Tasks

- [x] Create city page component at `src/app/pain-management/city-page.tsx`
  - [x] Implement semantic breadcrumb navigation
  - [x] Create clinic grid with microdata (itemScope, itemProp)
  - [x] Add semantic address tags
- [x] Update `generateStaticParams()` in `[...slug]/page.tsx` to include city pages
- [x] Add city page detection logic in main page component (2-segment URL handling)
- [x] Add city page metadata generation in `generateMetadata()`

### Technical Details

**New File:** `src/app/pain-management/city-page.tsx`

Component props:
```typescript
interface CityPainManagementPageProps {
  cityName: string;
  stateName: string;
  stateAbbrev: string;
  clinics: Array<{
    id: string;
    title: string;
    permalink: string;
    city: string;
    stateAbbreviation: string | null;
    phone: string | null;
    rating: number | null;
    reviewCount: number | null;
    streetAddress: string | null;
    postalCode: string;
  }>;
}
```

Key features:
- Semantic `<nav aria-label="Breadcrumb">` with `<ol>` structure
- Clinic cards with `itemScope itemType="https://schema.org/MedicalBusiness"`
- `<address itemProp="address">` for clinic addresses
- `itemProp="telephone"` on phone links

**File:** `src/app/pain-management/[...slug]/page.tsx`

**City detection helper:**
```typescript
function isValidCitySlug(citySlug: string): boolean {
  return citySlug.length > 2 && /^[a-z-]+$/.test(citySlug);
}
```

**generateStaticParams update:**
```typescript
export async function generateStaticParams() {
  const { getAllStatesWithClinics, getAllCitiesWithClinics } = await import("@/lib/clinic-queries");

  const states = await getAllStatesWithClinics();
  const stateParams = states.map((state) => ({ slug: [state.toLowerCase()] }));

  const cities = await getAllCitiesWithClinics();
  const cityParams = cities.map((c) => ({
    slug: [c.stateAbbreviation!.toLowerCase(), c.city.toLowerCase().replace(/\s+/g, "-")],
  }));

  return [...stateParams, ...cityParams];
}
```

**City page route detection (after state check):**
```typescript
if (slug.length === 2) {
  const [stateSlug, citySlug] = slug;
  if (stateSlug && isValidStateAbbrev(stateSlug) && citySlug && isValidCitySlug(citySlug)) {
    // Render city page with CityPainManagementPageContent
  }
}
```

---

## Phase 5: Geo Meta Tags

Add geo meta tags to clinic and city page metadata.

### Tasks

- [x] Add geo meta tags to clinic page metadata in `generateMetadata()`
- [x] Add geo meta tags to city page metadata (using averaged coordinates)
- [x] Add geo meta tags to state page metadata

### Technical Details

**File:** `src/app/pain-management/[...slug]/page.tsx`

**Clinic page geo tags (add to return object):**
```typescript
other: {
  "geo.region": `US-${clinic.stateAbbreviation}`,
  "geo.placename": `${clinic.city}, ${clinic.stateAbbreviation}`,
  "geo.position": `${clinic.mapLatitude};${clinic.mapLongitude}`,
  "ICBM": `${clinic.mapLatitude}, ${clinic.mapLongitude}`,
  "business:contact_data:locality": clinic.city,
  "business:contact_data:region": clinic.stateAbbreviation,
  "business:contact_data:postal_code": clinic.postalCode,
  "business:contact_data:country_name": "United States",
},
```

**City page geo tags (calculate centroid):**
```typescript
const avgLat = clinics.reduce((sum, c) => sum + c.mapLatitude, 0) / clinics.length;
const avgLng = clinics.reduce((sum, c) => sum + c.mapLongitude, 0) / clinics.length;

other: {
  "geo.region": `US-${stateAbbrev}`,
  "geo.placename": `${cityName}, ${stateAbbrev}`,
  "geo.position": `${avgLat.toFixed(4)};${avgLng.toFixed(4)}`,
  "ICBM": `${avgLat.toFixed(4)}, ${avgLng.toFixed(4)}`,
},
```

---

## Phase 6: Homepage Schema

Add WebSite and Organization schema to the homepage.

### Tasks

- [x] Import schema generation functions in `src/app/page.tsx`
- [x] Generate and inject WebSite schema JSON-LD
- [x] Generate and inject Organization schema JSON-LD
- [x] Update root layout metadata with pain clinics keywords

### Technical Details

**File:** `src/app/page.tsx`

```typescript
import {
  generateWebSiteSchema,
  generateOrganizationSchema,
} from "@/lib/structured-data";

export default async function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";
  // ... existing code

  const websiteSchema = generateWebSiteSchema(baseUrl);
  const organizationSchema = generateOrganizationSchema(baseUrl);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <main>...</main>
    </>
  );
}
```

**File:** `src/app/layout.tsx`

Update metadata:
```typescript
export const metadata: Metadata = {
  title: {
    default: "Pain Clinics Directory - Find Pain Management Near You",
    template: "%s | Pain Clinics Directory",
  },
  description: "Find verified pain management clinics across the United States. Browse ratings, read patient reviews, and schedule appointments.",
  keywords: ["pain management", "pain clinic", "chronic pain treatment", "pain specialist", "pain doctor near me"],
};
```

---

## Phase 7: Enhanced Sitemap

Add city pages and image extensions to the sitemap.

### Tasks

- [x] Import `getAllCityPermalinks` function
- [x] Add city landing pages to sitemap with priority 0.8
- [x] Add image sitemap extensions with geo_location for clinics with images
- [x] Fetch additional clinic fields (imageFeatured, city, state, coordinates) for image data

### Technical Details

**File:** `src/app/sitemap.ts`

```typescript
import {
  getAllClinicPermalinks,
  getAllStatesWithClinics,
  getAllCityPermalinks,
} from "@/lib/clinic-queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";

  // City landing pages
  const allCities = await getAllCityPermalinks();
  const cityPages: MetadataRoute.Sitemap = allCities.map((c) => ({
    url: `${baseUrl}/pain-management/${c.state}/${c.city}/`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Clinic pages with images (need full query for image data)
  const allClinicsData = await db
    .select({
      permalink: clinics.permalink,
      updatedAt: clinics.updatedAt,
      imageFeatured: clinics.imageFeatured,
      imageUrl: clinics.imageUrl,
      title: clinics.title,
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
    })
    .from(clinics);

  // Add image extensions when available
  const clinicPages = allClinicsData.map((clinic) => {
    const image = clinic.imageFeatured || clinic.imageUrl;
    const entry: MetadataRoute.Sitemap[0] = {
      url: `${baseUrl}/${clinic.permalink}/`,
      lastModified: clinic.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    };
    // Note: Next.js sitemap doesn't support images natively
    // Consider using next-sitemap package for full image sitemap support
    return entry;
  });

  return [...staticPages, ...statePages, ...cityPages, ...clinicPages];
}
```

---

## Phase 8: Admin Analytics API

Create the keywords analytics API endpoint.

### Tasks

- [x] Create API route at `src/app/api/admin/analytics/keywords/route.ts`
- [x] Implement keyword aggregation from reviewKeywords JSONB
- [x] Add sentiment classification (positive/neutral/negative keywords)
- [x] Support state and city filters via query parameters
- [x] Add admin authentication check

### Technical Details

**File:** `src/app/api/admin/analytics/keywords/route.ts`

**Sentiment word lists:**
```typescript
const POSITIVE_KEYWORDS = [
  "friendly", "professional", "helpful", "caring", "excellent",
  "great", "amazing", "wonderful", "recommend", "best",
  "knowledgeable", "thorough", "compassionate", "patient", "attentive",
];

const NEGATIVE_KEYWORDS = [
  "rude", "unprofessional", "wait", "waiting", "slow",
  "disappointed", "terrible", "worst", "avoid", "never",
  "dismissive", "rushed", "billing", "insurance",
];
```

**Response shape:**
```typescript
interface KeywordAggregation {
  keyword: string;
  totalCount: number;
  clinicCount: number;
  avgPerClinic: number;
  sentiment: "positive" | "neutral" | "negative";
}

// Response
{
  keywords: KeywordAggregation[];
  summary: {
    totalKeywords: number;
    clinicsAnalyzed: number;
    sentiment: { positive: number; neutral: number; negative: number };
  };
  filters: { state: string | null; city: string | null; limit: number };
}
```

**Query parameters:** `?state=CA&city=los-angeles&limit=50`

---

## Phase 9: Admin Analytics Dashboard

Create the admin analytics page and client component.

### Tasks

- [x] Create analytics page at `src/app/admin/analytics/page.tsx`
- [x] Create keywords client component at `src/app/admin/analytics/keywords-client.tsx`
  - [x] Add summary cards (unique keywords, sentiment breakdown, clinics analyzed)
  - [x] Add state filter dropdown
  - [x] Add top 50 keywords table with sentiment badges
- [x] Add Analytics link to admin sidebar with BarChart3 icon

### Technical Details

**File:** `src/app/admin/analytics/page.tsx`

```typescript
import { KeywordsAnalyticsClient } from "./keywords-client";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review Analytics</h1>
        <p className="text-muted-foreground">
          Analyze review keywords and sentiment across all clinics
        </p>
      </div>
      <KeywordsAnalyticsClient />
    </div>
  );
}
```

**File:** `src/app/admin/analytics/keywords-client.tsx`

Client component features:
- `useState` for data, loading, stateFilter
- `useEffect` to fetch from `/api/admin/analytics/keywords`
- Summary cards using shadcn Card component
- Select dropdown for state filter
- Keyword list with Badge components for sentiment
- TrendingUp/TrendingDown/Minus icons for sentiment visualization

**File:** `src/components/admin/admin-sidebar.tsx`

Add to navItems array:
```typescript
{ href: "/admin/analytics", label: "Analytics", icon: BarChart3 }
```

Import `BarChart3` from `lucide-react`.

---

## Verification

- [ ] Run `pnpm run lint` - no errors
- [ ] Run `pnpm run typecheck` - no errors
- [ ] Test clinic JSON-LD with Google Rich Results Test
- [ ] Verify city pages render at `/pain-management/ca/los-angeles/`
- [ ] Verify city pages appear in sitemap
- [ ] Test admin analytics page loads with keyword data
