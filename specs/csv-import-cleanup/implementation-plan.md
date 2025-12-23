# Implementation Plan: CSV Import Cleanup & Code Consolidation

## Overview

Address security vulnerabilities, consolidate duplicate code, and add missing database optimizations identified during the code review of the Outscraper CSV import feature.

## Phase 1: Security - HTML Sanitization

Fix the critical XSS vulnerability by implementing proper HTML sanitization for content rendered with `dangerouslySetInnerHTML`.

### Tasks

- [x] Install isomorphic-dompurify package
- [x] Create reusable sanitization utility
- [x] Update clinic-about.tsx to sanitize HTML content
- [x] Update post-preview.tsx to use sanitization utility (if not already)

### Technical Details

**Package Installation:**
```bash
pnpm add isomorphic-dompurify
pnpm add -D @types/dompurify
```

**Create sanitization utility at `src/lib/sanitize-html.ts`:**
```typescript
import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Safe to use on both server and client.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'strong', 'b', 'em', 'i', 'u',
      'a', 'span', 'div',
      'blockquote', 'pre', 'code',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
  });
}
```

**Files to update:**
- `src/components/clinic/clinic-about.tsx:35` - Add sanitization before `dangerouslySetInnerHTML`
- `src/components/admin/blog/post-preview.tsx:121` - Verify using sanitization

---

## Phase 2: Type Consolidation

Consolidate duplicate interface definitions into a single source of truth.

### Tasks

- [x] Update `src/types/clinic.ts` with canonical type definitions
- [x] Export types from `src/lib/clinic-transformer.ts` (already done, verify)
- [x] Update `src/lib/structured-data.ts` to import types instead of re-declaring
- [x] Update `src/components/admin/clinics/clinic-reviews-tab.tsx` to import types
- [x] Update `src/scripts/update-missing-clinic-data.ts` to import types
- [x] Remove duplicate interface definitions from all updated files

### Technical Details

**Canonical types to export from `src/lib/clinic-transformer.ts` (already exported):**
- `ReviewKeyword`
- `FeaturedReview`
- `DetailedReview`
- `ClinicHour`
- `PopularTime`
- `ReviewsPerScore`

**Files with duplicate definitions to fix:**

1. `src/lib/structured-data.ts` - Lines 7-18:
   - Remove local `ClinicHour` interface (lines 7-10)
   - Remove local `FeaturedReview` interface (lines 12-18)
   - Add import: `import type { ClinicHour, FeaturedReview } from "./clinic-transformer";`

2. `src/components/admin/clinics/clinic-reviews-tab.tsx` - Lines 32-58:
   - Remove local `ReviewKeyword` interface (lines 32-35)
   - Remove local `FeaturedReview` interface (lines 37-43)
   - Remove local `DetailedReview` interface (lines 45-54)
   - Add import: `import type { ReviewKeyword, FeaturedReview, DetailedReview } from "@/lib/clinic-transformer";`

3. `src/scripts/update-missing-clinic-data.ts`:
   - Remove local `FeaturedReview` interface
   - Remove local `ReviewKeyword` interface
   - Add import from clinic-transformer

4. `src/types/clinic.ts` - Reconcile `FeaturedReview` (lines 64-70) and `ReviewKeywordItem` (lines 78-82):
   - Either deprecate in favor of clinic-transformer exports OR
   - Re-export from clinic-transformer for backwards compatibility

---

## Phase 3: Utility Function Consolidation

Create shared utility functions and remove duplicates.

### Tasks

- [x] Create `src/lib/parsers.ts` with shared parsing utilities
- [x] Create `src/lib/slug.ts` with unified slug generation
- [x] Remove duplicate `getStateName` from clinic-transformer.ts
- [x] Update clinic-transformer.ts to import from us-states.ts
- [x] Remove duplicate `stripHtmlTags` from wordpress-api.ts
- [x] Update wordpress-api.ts to import from html-utils.ts
- [x] Update import execute route to use shared slug utility
- [x] Update blog publish-settings to use shared slug utility
- [x] Update service-form to use shared slug utility

### Technical Details

**Create `src/lib/parsers.ts`:**
```typescript
/**
 * Safely parse a JSON string, returning null on failure
 */
export function safeParseJSON<T>(value: string | undefined | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Safely parse an integer, returning null on failure
 */
export function safeParseInt(value: string | undefined | null): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Safely parse a float, returning null on failure
 */
export function safeParseFloat(value: string | undefined | null): number | null {
  if (!value) return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Convert empty strings to null
 */
export function emptyToNull(value: string | undefined | null): string | null {
  if (!value || value.trim() === "") return null;
  return value;
}
```

**Create `src/lib/slug.ts`:**
```typescript
/**
 * Generate a URL-safe slug from a string
 * @param text - The text to convert to a slug
 * @returns URL-safe slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-")         // Replace spaces with hyphens
    .replace(/-+/g, "-")          // Collapse multiple hyphens
    .replace(/^-|-$/g, "");       // Trim leading/trailing hyphens
}
```

**Files to update:**

1. `src/lib/clinic-transformer.ts`:
   - Remove local `getStateName` function (lines 1067-1082)
   - Add import: `import { getStateName } from "./us-states";`
   - Import parsers from `./parsers` instead of local definitions
   - Update `generatePermalinkSlug` to use shared `generateSlug`

2. `src/lib/blog/wordpress-api.ts`:
   - Remove `stripHtmlTags` function (line 190+)
   - Add import: `import { stripHtmlTags } from "../html-utils";`

3. `src/app/api/admin/import/execute/route.ts`:
   - Remove `generateServiceSlug` function (lines 30-37)
   - Add import: `import { generateSlug } from "@/lib/slug";`
   - Use `generateSlug` instead of `generateServiceSlug`

4. `src/components/admin/blog/publish-settings.tsx`:
   - Remove local `generateSlug` function (lines 38-45)
   - Add import: `import { generateSlug } from "@/lib/slug";`

5. `src/components/admin/services/service-form.tsx`:
   - Remove local `generateSlug` function (lines 37-44)
   - Add import: `import { generateSlug } from "@/lib/slug";`

---

## Phase 4: Database Index Optimization

Add missing database index for the `createdAt` column used in admin clinic sorting.

### Tasks

- [x] Add `createdAt` index to clinics table in schema.ts
- [x] Generate database migration
- [x] Push schema changes to database

### Technical Details

**Update `src/lib/schema.ts` clinics table indexes (around line 265-276):**

Add to the existing indexes array:
```typescript
index("clinics_created_at_idx").on(table.createdAt),
```

Full indexes section should look like:
```typescript
(table) => [
  index("clinics_place_id_idx").on(table.placeId),
  index("clinics_city_idx").on(table.city),
  index("clinics_state_idx").on(table.state),
  index("clinics_state_city_idx").on(table.stateAbbreviation, table.city),
  index("clinics_postal_code_idx").on(table.postalCode),
  index("clinics_rating_idx").on(table.rating),
  index("clinics_import_batch_idx").on(table.importBatchId),
  index("clinics_owner_idx").on(table.ownerUserId),
  index("clinics_featured_idx").on(table.isFeatured),
  index("clinics_status_idx").on(table.status),
  index("clinics_created_at_idx").on(table.createdAt), // NEW
]
```

**Migration commands:**
```bash
pnpm db:generate
pnpm db:push
```

---

## Phase 5: Verification & Cleanup

Verify all changes work correctly and clean up any remaining issues.

### Tasks

- [x] Run `pnpm typecheck` and fix any errors
- [x] Run `pnpm lint` and fix any errors
- [x] Verify clinic detail page renders HTML content correctly
- [x] Verify admin clinics table sorting works
- [x] Verify CSV import still functions correctly
- [x] Create checkpoint commit

### Technical Details

**Verification commands:**
```bash
pnpm typecheck
pnpm lint
```

**Manual testing checklist:**
1. Navigate to a clinic detail page with HTML content in the about section
2. Verify HTML renders correctly and is styled properly
3. Go to Admin > Clinics and sort by different columns
4. Verify sorting by Created Date works correctly
5. Test CSV import with a small Outscraper file
6. Verify services are created from categories

**Commit message template:**
```
fix: consolidate duplicate code and add HTML sanitization

- Add isomorphic-dompurify for XSS protection
- Consolidate duplicate type definitions (FeaturedReview, DetailedReview, etc.)
- Create shared utility functions (parsers.ts, slug.ts)
- Remove duplicate getStateName and stripHtmlTags functions
- Add missing createdAt index to clinics table

Addresses security and code quality issues from implementation review.
```
