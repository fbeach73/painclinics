# Implementation Plan: Code Quality Improvements

## Overview

Address 12 identified issues from the multi-phase implementation review. Focus on eliminating code duplication, following Next.js 16 best practices, optimizing database queries, and hardening security.

---

## Phase 1: Consolidate Duplicate Utilities

Eliminate duplicate utility functions created by different developers working on separate phases.

### Tasks

- [x] Update `structured-data.ts` to use `stripHtmlTags()` from `html-utils.ts`
- [x] Update `validators.ts` to use `stripHtmlTags()` from `html-utils.ts`
- [x] Remove `extractSlugFromPermalink()` from `clinic-db-to-type.ts` and use `extractPermalinkSlug()` from `clinic-transformer.ts`
- [x] Add shared `parseTimeRange()` function to `time-utils.ts`
- [x] Update `clinic-db-to-type.ts` to use shared `parseTimeRange()`
- [x] Update `structured-data.ts` to use shared `parseTimeRange()`

### Technical Details

**Files to modify:**

1. `src/lib/structured-data.ts` (lines 47-58)
   - Remove inline HTML stripping:
   ```typescript
   // REMOVE THIS:
   const cleanDescription = description
     .replace(/<[^>]*>/g, "")
     .replace(/&nbsp;/g, " ")
     // ... etc

   // REPLACE WITH:
   import { stripHtmlTags } from "./html-utils";
   const cleanDescription = stripHtmlTags(description);
   ```

2. `src/lib/ai/validators.ts` (line 73)
   - Replace `.replace(/<[^>]*>/g, " ")` with `stripHtmlTags()`
   - Note: Current version replaces with space, utility replaces with empty string - verify behavior is acceptable

3. `src/lib/clinic-db-to-type.ts` (lines 108-111)
   - Remove `extractSlugFromPermalink()` function
   - Import and use `extractPermalinkSlug()` from `clinic-transformer.ts`

4. `src/lib/time-utils.ts` - Add new function:
   ```typescript
   export interface TimeRange {
     open: string;
     close: string;
   }

   export function parseTimeRange(timeString: string): TimeRange | null {
     if (!timeString || timeString.toLowerCase() === "closed") {
       return null;
     }
     const parts = timeString.split("-").map(s => s.trim());
     if (parts.length !== 2) return null;
     return { open: parts[0], close: parts[1] };
   }
   ```

---

## Phase 2: Image Optimization

Replace raw `<img>` tags with Next.js Image component for proper optimization.

### Tasks

- [x] Verify `remotePatterns` in `next.config.ts` includes Google Places photo URLs
- [x] Update `clinic-gallery.tsx` to use Next.js Image component
- [x] Remove `eslint-disable` comments for `@next/next/no-img-element`

### Technical Details

**File:** `src/components/clinic/clinic-gallery.tsx` (lines 57-62, 94-99)

Current code:
```tsx
// eslint-disable-next-line @next/next/no-img-element
<img
  src={photo}
  alt={`${clinicName} photo ${index + 1}`}
  className="w-full h-full object-cover"
/>
```

Replace with:
```tsx
import Image from "next/image";

<Image
  src={photo}
  alt={`${clinicName} photo ${index + 1}`}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

**Note:** Parent container needs `position: relative` for `fill` prop to work.

**Verify in `next.config.ts`:**
```typescript
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "maps.googleapis.com",
      pathname: "/maps/api/place/photo/**",
    },
    {
      protocol: "https",
      hostname: "lh3.googleusercontent.com",
      pathname: "/**",
    },
  ],
},
```

---

## Phase 3: Component Consolidation

Merge similar clinic card components into single component with variant prop.

### Tasks

- [x] Add `variant` prop to `ClinicCard` component [complex]
  - [x] Define variant type: `"default" | "featured"`
  - [x] Add conditional rendering for image section
  - [x] Add conditional rendering for badges
  - [x] Update StarRating variant based on card variant
- [x] Update all usages of `ClinicCardFeatured` to use `ClinicCard` with `variant="featured"`
- [x] Delete `clinic-card-featured.tsx`

### Technical Details

**File:** `src/components/clinic/clinic-card.tsx`

Add to props interface:
```typescript
interface ClinicCardProps {
  clinic: ClinicType;
  variant?: "default" | "featured";
}
```

Conditional sections for featured variant:
- Image placeholder section (lines 23-35 in featured)
- "Featured" badge (line 38 in featured)
- Verification badge (line 50-55 in featured)
- StarRating variant="featured" (line 62 in featured)
- Max services: 4 for default, 5 for featured

**Search for usages:**
```bash
grep -r "ClinicCardFeatured" src/
```

---

## Phase 4: Database Optimization

Add missing indexes and eliminate N+1 query patterns.

### Tasks

- [x] Add composite index on `(stateAbbreviation, city)` to clinics table
- [x] Refactor `getAvailableServicesForClinic()` to single query
- [x] Generate and run database migration

### Technical Details

**File:** `src/lib/schema.ts`

Add to clinics table indexes (around line 197):
```typescript
clinicsStateCity: index("clinics_state_city_idx").on(
  table.stateAbbreviation,
  table.city
),
```

**File:** `src/lib/clinic-services-queries.ts` (lines 249-279)

Current N+1 pattern (2 queries):
```typescript
// Query 1: Get existing service IDs
const existingServices = await db.select(...).from(clinicServices)...
// Query 2: Get all services NOT in that list
const services = await db.select(...).from(services)...
```

Refactor to single query using LEFT JOIN:
```typescript
export async function getAvailableServicesForClinic(clinicId: number) {
  const results = await db
    .select({
      id: services.id,
      name: services.name,
      slug: services.slug,
      category: services.category,
    })
    .from(services)
    .leftJoin(
      clinicServices,
      and(
        eq(clinicServices.serviceId, services.id),
        eq(clinicServices.clinicId, clinicId)
      )
    )
    .where(isNull(clinicServices.id))
    .orderBy(asc(services.name));

  return results;
}
```

**CLI commands:**
```bash
pnpm db:generate
pnpm db:push
```

---

## Phase 5: Performance & Caching

Add ISR caching and optimize React component rendering.

### Tasks

- [x] Add ISR revalidation to home page
- [x] Optimize markdown components in chat page (already implemented correctly - components defined outside ChatPage)

### Technical Details

**File:** `src/app/page.tsx`

Add at top level (after imports):
```typescript
export const revalidate = 3600; // Revalidate every hour
```

**File:** `src/app/chat/page.tsx` (lines 13-106)

Current issue: Markdown components (`H1`, `H2`, etc.) and `markdownComponents` object are recreated on every render.

Option 1 - Move outside component (recommended):
```typescript
// Move OUTSIDE the ChatPage component
const H1: React.FC<...> = (props) => (...)
const H2: React.FC<...> = (props) => (...)
// ... all other components

const markdownComponents: Components = {
  h1: H1,
  h2: H2,
  // ... etc
};

// Inside ChatPage - just use markdownComponents directly
export default function ChatPage() {
  // ... component code
  return <ReactMarkdown components={markdownComponents}>...</ReactMarkdown>
}
```

Option 2 - Use useMemo (if components need props from parent):
```typescript
const markdownComponents = useMemo(() => ({
  h1: H1,
  h2: H2,
  // ...
}), []); // Empty deps since these don't change
```

---

## Phase 6: Security Hardening

Add missing validations and use shared utilities consistently.

### Tasks

- [ ] Add file size limit to CSV upload route
- [ ] Update admin check route to use `checkAdminApi()` utility

### Technical Details

**File:** `src/app/api/admin/import/upload/route.ts`

Add after getting file (around line 40):
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

if (file.size > MAX_FILE_SIZE) {
  return NextResponse.json(
    { error: "File too large. Maximum size is 10MB." },
    { status: 400 }
  );
}
```

**File:** `src/app/api/admin/check/route.ts` (lines 12-24)

Current inline check:
```typescript
const session = await auth.api.getSession({ headers: await headers() });
if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
// ... manual admin check
```

Replace with:
```typescript
import { checkAdminApi } from "@/lib/admin-auth";

export async function GET() {
  const result = await checkAdminApi();
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
    },
  });
}
```

---

## Summary

| Phase | Tasks | Priority |
|-------|-------|----------|
| Phase 1: Consolidate Utilities | 6 | High |
| Phase 2: Image Optimization | 3 | High |
| Phase 3: Component Consolidation | 3 | High |
| Phase 4: Database Optimization | 3 | Medium |
| Phase 5: Performance & Caching | 2 | Medium |
| Phase 6: Security Hardening | 2 | Medium |

**Total: 19 tasks across 6 phases**
