# Implementation Plan: Clinic Data Import System

## Overview

Build a complete data migration system to import 4,575 WordPress pain clinic listings into PostgreSQL. Includes database schema, CSV parsing utilities, admin-protected API routes, and admin UI for managing imports.

---

## Phase 1: Database Schema ✅

Add admin role support and create clinic storage tables.

### Tasks

- [x] Add `role` field to existing user table in schema
- [x] Create `clinics` table with all fields matching CSV structure [complex]
  - [x] Add identification fields (id, wpId, placeId, title, permalink)
  - [x] Add location fields (streetAddress, city, state, postalCode, coordinates)
  - [x] Add contact fields (phone, phones array, website, emails array)
  - [x] Add review fields (reviewCount, rating, JSONB for reviews data)
  - [x] Add hours fields (JSONB for clinicHours, popularTimes)
  - [x] Add content fields (HTML content, images arrays)
  - [x] Add social media fields (facebook, instagram, twitter, etc.)
  - [x] Add indexes for common queries (placeId, city, state, rating)
- [x] Create `importBatches` table for tracking imports
- [x] Generate and run database migration

### Technical Details

**User table role field** (`src/lib/schema.ts`):
```typescript
role: text("role").default("user").notNull(), // "user" | "admin"
```

**Clinics table schema** (`src/lib/schema.ts`):
```typescript
export const clinics = pgTable("clinics", {
  // Primary identification
  id: text("id").primaryKey().$defaultFn(() => createId()),
  wpId: integer("wp_id"),
  placeId: text("place_id").unique(),
  title: text("title").notNull(),
  permalink: text("permalink").notNull().unique(),
  postType: text("post_type").default("pain-management"),
  clinicType: text("clinic_type"),

  // Location
  streetAddress: text("street_address"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  stateAbbreviation: text("state_abbreviation"),
  postalCode: text("postal_code").notNull(),
  mapLatitude: doublePrecision("map_latitude").notNull(),
  mapLongitude: doublePrecision("map_longitude").notNull(),
  detailedAddress: text("detailed_address"),

  // Contact
  phone: text("phone"),
  phones: text("phones").array(),
  website: text("website"),
  emails: text("emails").array(),

  // Reviews & Ratings
  reviewCount: integer("review_count").default(0),
  rating: doublePrecision("rating"),
  reviewsPerScore: jsonb("reviews_per_score"),
  reviewKeywords: jsonb("review_keywords"),
  featuredReviews: jsonb("featured_reviews"),

  // Business Hours
  clinicHours: jsonb("clinic_hours"),
  closedOn: text("closed_on"),
  popularTimes: jsonb("popular_times"),

  // Content
  content: text("content"),
  newPostContent: text("new_post_content"),

  // Images
  imageUrl: text("image_url"),
  imageFeatured: text("image_featured"),
  featImage: text("feat_image"),
  clinicImageUrls: text("clinic_image_urls").array(),
  clinicImageMedia: text("clinic_image_media").array(),
  qrCode: text("qr_code"),

  // Amenities & Features
  amenities: text("amenities").array(),
  checkboxFeatures: text("checkbox_features").array(),
  googleListingLink: text("google_listing_link"),

  // Q&A
  questions: jsonb("questions"),

  // Social Media
  facebook: text("facebook"),
  instagram: text("instagram"),
  twitter: text("twitter"),
  youtube: text("youtube"),
  linkedin: text("linkedin"),
  tiktok: text("tiktok"),
  pinterest: text("pinterest"),

  // Metadata
  importBatchId: text("import_batch_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  index("clinics_place_id_idx").on(table.placeId),
  index("clinics_city_idx").on(table.city),
  index("clinics_state_idx").on(table.state),
  index("clinics_postal_code_idx").on(table.postalCode),
  index("clinics_rating_idx").on(table.rating),
  index("clinics_import_batch_idx").on(table.importBatchId),
]);
```

**Import batches table** (`src/lib/schema.ts`):
```typescript
export const importBatches = pgTable("import_batches", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  fileName: text("file_name"),
  status: text("status").default("pending"), // pending, processing, completed, failed, rolled_back
  totalRecords: integer("total_records").default(0),
  successCount: integer("success_count").default(0),
  errorCount: integer("error_count").default(0),
  skipCount: integer("skip_count").default(0),
  errors: jsonb("errors"),
  importedBy: text("imported_by").references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});
```

**Migration commands**:
```bash
pnpm db:generate
pnpm db:migrate
```

---

## Phase 2: Core Utilities ✅

Create utilities for CSV parsing, data transformation, admin auth, and image processing.

### Tasks

- [x] Install papaparse dependency for CSV parsing
- [x] Create US states abbreviation mapping utility
- [x] Create CSV parser utility with BOM handling
- [x] Create clinic data transformer [complex]
  - [x] Implement pipe-separated array parsing (reviews, hours, keywords)
  - [x] Implement comma-separated list parsing (phones, images, amenities)
  - [x] Implement coordinate validation
  - [x] Implement permalink slug extraction
- [x] Create image processor for download and re-upload
- [x] Add requireAdmin() utility to session helpers
- [x] Update auth config with ADMIN_EMAIL auto-promotion callback

### Technical Details

**Install dependency**:
```bash
pnpm add papaparse
pnpm add -D @types/papaparse
```

**US States mapping** (`src/lib/us-states.ts`):
```typescript
export const US_STATES: Record<string, string> = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
  "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
  "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
  "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
  "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
  "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
  "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
  "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
  "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
  "Wisconsin": "WI", "Wyoming": "WY", "District of Columbia": "DC"
};

export function getStateAbbreviation(stateName: string): string {
  return US_STATES[stateName] || stateName.substring(0, 2).toUpperCase();
}
```

**CSV Parser** (`src/lib/csv-parser.ts`):
```typescript
import Papa from "papaparse";

export function parseCSV<T>(content: string): T[] {
  // Remove BOM if present
  const cleanContent = content.replace(/^\uFEFF/, "");

  const result = Papa.parse<T>(cleanContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  return result.data;
}
```

**Clinic Transformer** (`src/lib/clinic-transformer.ts`):
- `parseReviewKeywords(keywords: string, counts: string)` → `{keyword, count}[]`
- `parseClinicHours(days: string, hours: string)` → `{day, hours}[]`
- `parseFeaturedReviews(usernames, urls, reviews, dates, ratings)` → `FeaturedReview[]`
- `parsePopularTimes(hours: string, popularity: string)` → `{hour, popularity}[]`
- `parsePhones(phones: string)` → `string[]` (comma-split)
- `parseAmenities(amenities: string)` → `string[]` (comma-split)
- `parseImageUrls(urls: string)` → `string[]` (comma-split)
- `parseCheckboxFeatures(features: string)` → `string[]` (pipe-split)
- `validateCoordinates(lat: string, lng: string)` → `{lat, lng} | null`
- `extractPermalinkSlug(fullUrl: string)` → `string`

**Image Processor** (`src/lib/image-processor.ts`):
```typescript
import { upload } from "@/lib/storage";

export async function processClinicImages(clinic: CSVRow, clinicId: string): Promise<ProcessedImages> {
  const images: ProcessedImages = { imageUrl: null, clinicImageUrls: [] };

  if (clinic["Image URL"]) {
    images.imageUrl = await downloadAndUpload(clinic["Image URL"], clinicId, "featured");
  }

  if (clinic["Clinic Image URLS"]) {
    const urls = clinic["Clinic Image URLS"].split(",").map(u => u.trim()).filter(Boolean);
    for (let i = 0; i < urls.length; i++) {
      const uploaded = await downloadAndUpload(urls[i], clinicId, `gallery-${i}`);
      if (uploaded) images.clinicImageUrls.push(uploaded);
    }
  }

  return images;
}

async function downloadAndUpload(url: string, clinicId: string, suffix: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const ext = url.split(".").pop()?.split("?")[0] || "jpg";
    const result = await upload(buffer, `clinics/${clinicId}/${suffix}.${ext}`, "clinic-images");
    return result.url;
  } catch {
    return null;
  }
}
```

**Admin auth utility** (`src/lib/session.ts`):
```typescript
export async function requireAdmin() {
  const session = await requireAuth();
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, session.user.id)
  });
  if (user?.role !== "admin") redirect("/unauthorized");
  return session;
}
```

**Auth callback for ADMIN_EMAIL** (`src/lib/auth.ts`):
```typescript
callbacks: {
  session: async ({ session, user }) => {
    const dbUser = await db.query.user.findFirst({
      where: eq(schema.user.id, user.id)
    });

    if (process.env.ADMIN_EMAIL === user.email && dbUser?.role !== "admin") {
      await db.update(schema.user)
        .set({ role: "admin" })
        .where(eq(schema.user.id, user.id));
    }

    return { ...session, user: { ...session.user, role: dbUser?.role || "user" } };
  }
}
```

---

## Phase 3: Import API Routes ✅

Create admin-protected API endpoints for import operations.

### Tasks

- [x] Create batch import endpoint for processing all CSV files
- [x] Create single file upload endpoint with validation
- [x] Create import execution endpoint with streaming progress [complex]
  - [x] Implement batched database inserts (100 records per batch)
  - [x] Implement Server-Sent Events for progress updates
  - [x] Implement duplicate detection and update logic
- [x] Create import status endpoint for batch tracking
- [x] Create rollback endpoint for reversing imports
- [x] Create verification endpoint for post-import checks

### Technical Details

**File paths**:
- `src/app/api/admin/import/batch/route.ts` - Batch process all CSV files
- `src/app/api/admin/import/upload/route.ts` - Single file upload
- `src/app/api/admin/import/execute/route.ts` - Execute import with streaming
- `src/app/api/admin/import/[batchId]/route.ts` - Status & rollback
- `src/app/api/admin/import/verify/route.ts` - Verification checks

**Batch import endpoint** (`/api/admin/import/batch`):
- POST: Start batch import of all files in `/specs/pain-clinic-directory/data/clinics/`
- GET: Get batch import status
- Reads all CSV files, creates import batch, processes sequentially

**Upload endpoint** (`/api/admin/import/upload`):
- POST: Upload CSV file, validate headers, return preview
- Returns: `{ preview: first10Rows[], columns: string[], validationErrors: string[] }`

**Execute endpoint** (`/api/admin/import/execute`):
- POST: Start import with options `{ batchId, duplicateHandling: "skip" | "update" | "overwrite" }`
- Returns: Server-Sent Events stream with progress updates
- Progress format: `{ currentFile, currentRecord, totalRecords, errors: [] }`

**Status/Rollback endpoint** (`/api/admin/import/[batchId]`):
- GET: Return batch status, counts, errors
- DELETE: Rollback - delete all clinics with matching `importBatchId`, update batch status

**Verification endpoint** (`/api/admin/import/verify`):
- GET: Run all verification checks, return results
- Checks: unique permalinks, unique placeIds, missing coordinates, broken images, clinics by state

**Duplicate handling logic**:
```typescript
// Check for existing clinic by Place ID
const existing = await db.query.clinics.findFirst({
  where: eq(schema.clinics.placeId, clinic.placeId)
});

if (existing) {
  // Default: UPDATE existing record
  await db.update(schema.clinics)
    .set({ ...clinicData, updatedAt: new Date() })
    .where(eq(schema.clinics.id, existing.id));
} else {
  await db.insert(schema.clinics).values(clinicData);
}
```

---

## Phase 4: Admin UI ✅

Build admin-protected UI for managing imports.

### Tasks

- [x] Create admin layout with role check and navigation
- [x] Create import dashboard page with batch/upload options
- [x] Create import progress component with real-time updates
- [x] Create preview modal with data table and validation display
- [x] Create import results component with statistics and charts

### Technical Details

**File paths**:
- `src/app/admin/layout.tsx` - Admin layout with auth
- `src/app/admin/import/page.tsx` - Import dashboard
- `src/components/admin/import-progress.tsx` - Progress display
- `src/components/admin/import-preview.tsx` - Preview modal
- `src/components/admin/import-results.tsx` - Results summary

**Admin layout** (`src/app/admin/layout.tsx`):
```typescript
export default async function AdminLayout({ children }) {
  await requireAdmin(); // Redirects non-admins
  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

**Import dashboard features**:
- "Start Batch Import" button - process all 10 CSV files
- File upload dropzone for additional CSV files
- Import history table with status, counts, timestamps
- Links to view details or rollback each import

**Progress component display**:
- Current file name: "Processing clinics-part-03.csv"
- Overall progress bar: "1,200 / 4,575 clinics"
- Per-file progress bar
- Real-time error count
- Current record being processed
- Time elapsed / estimated remaining

**Preview modal contents**:
- Data table showing first 10 rows
- Column header mapping display
- Validation warnings (missing required fields, invalid coordinates)
- "Start Import" button

**Results summary**:
- Total imported / errors / skipped counts
- Download error CSV button
- Clinics by state breakdown (table or chart)
- Average rating across all clinics
- Total reviews imported
- Verification check results (pass/fail with details)

---

## Phase 5: Testing & Verification ✅

Verify the import system works correctly with real data.

### Tasks

- [x] Configure ADMIN_EMAIL environment variable
- [x] Login and verify admin role assignment
- [x] Test single file upload and preview functionality
- [x] Test batch import with all 10 CSV files
- [x] Verify data integrity in Drizzle Studio
- [x] Test rollback functionality
- [x] Run post-import verification checks
- [x] Verify image upload to storage

### Results

**Import completed successfully on 2025-12-08:**
- **4,515 clinics** imported from 10 CSV files
- **Average rating:** 4.03
- **Total reviews:** 441,186
- **0 duplicate place_ids** ✅
- **0 duplicate permalinks** ✅
- **0 missing coordinates** ✅
- Clinics distributed across all 50 states

### Technical Details

**Environment setup** (`.env.local`):
```env
ADMIN_EMAIL=your-email@example.com
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token  # For production image storage
```

**Verification queries** (run in Drizzle Studio):
```sql
-- Total clinic count
SELECT COUNT(*) FROM clinics;

-- Clinics by state
SELECT state, COUNT(*) as count FROM clinics GROUP BY state ORDER BY count DESC;

-- Average rating
SELECT AVG(rating) as avg_rating, SUM(review_count) as total_reviews FROM clinics;

-- Check for missing coordinates
SELECT COUNT(*) FROM clinics WHERE map_latitude IS NULL OR map_longitude IS NULL;

-- Check unique constraints
SELECT permalink, COUNT(*) FROM clinics GROUP BY permalink HAVING COUNT(*) > 1;
SELECT place_id, COUNT(*) FROM clinics GROUP BY place_id HAVING COUNT(*) > 1;
```

**Expected results**:
- 4,575 total clinics imported
- 0 duplicate permalinks
- 0 duplicate Place IDs
- 0 clinics missing coordinates
- All images accessible in Vercel Blob

---

## CSV Field → Database Column Mapping

| CSV Field | Database Column | Type | Transform |
|-----------|-----------------|------|-----------|
| ID | wp_id | integer | Direct |
| Title | title | text | Direct |
| Place ID | place_id | text | Direct |
| Permalink | permalink | text | Extract slug |
| Post Type | post_type | text | Direct |
| Clinic Type | clinic_type | text | Keep pipe-separated |
| Street Address | street_address | text | Direct |
| City | city | text | Direct |
| State | state | text | Direct |
| State Abbreviation | state_abbreviation | text | Auto-derive if empty |
| Postal Code | postal_code | text | Direct |
| Map Latitude | map_latitude | double | Parse float |
| Map Longitude | map_longitude | double | Parse float |
| Phone | phone | text | Direct |
| phones | phones | text[] | Split comma |
| Website | website | text | Direct |
| emails | emails | text[] | Split comma |
| Reviews | review_count | integer | Parse int |
| Rating | rating | double | Parse float |
| Reviews Per Score Rating_* | reviews_per_score | jsonb | Combine arrays |
| Review Keywords_* | review_keywords | jsonb | Combine arrays |
| Clinic Hours_* | clinic_hours | jsonb | Combine arrays |
| Popular times_* | popular_times | jsonb | Combine arrays |
| Featured Reviews_* | featured_reviews | jsonb | Combine 5 arrays |
| Content | content | text | Direct (HTML) |
| Image URL | image_url | text | Download & re-upload |
| Clinic Image URLS | clinic_image_urls | text[] | Split comma, re-upload |
| Amenities | amenities | text[] | Split comma |
| Checkbox Features | checkbox_features | text[] | Split pipe |
| Social media fields | respective columns | text | Direct |
