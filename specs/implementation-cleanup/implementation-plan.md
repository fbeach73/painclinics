# Implementation Plan: Implementation Cleanup

## Overview

Consolidate duplicate code, remove unused files, and fix inconsistencies in the pain clinic directory implementation.

## Phase 1: Remove Unused Routes and Mock Data

Remove the `/clinics` routes and mock data since all traffic redirects to `/pain-management` via middleware.

### Tasks

- [x] Delete `src/app/clinics/page.tsx`
- [x] Delete `src/app/clinics/[clinicId]/page.tsx`
- [x] Delete `src/data/mock-clinics.ts`
- [x] Delete `src/hooks/use-clinics.ts`
- [x] Update `src/components/clinic/index.ts` if it exports from deleted files
- [x] Run lint and typecheck to verify no broken imports

**Additional work completed:**
- [x] Updated `src/app/page.tsx` to remove mock data dependency and use real database queries
- [x] Home page now displays real clinic counts by state from the database
- [x] Converted home page from client component to server component

### Technical Details

Files to delete:
- `src/app/clinics/page.tsx` (201 lines) - Client component using mock data
- `src/app/clinics/[clinicId]/page.tsx` (107 lines) - Detail page using mock data
- `src/data/mock-clinics.ts` (920 lines) - Mock clinic data
- `src/hooks/use-clinics.ts` (165 lines) - Hooks using mock data

The middleware at `middleware.ts` already handles redirects:
- `/clinics` -> `/pain-management/`
- `/clinics/[slug]` -> `/pain-management/[slug]/`

## Phase 2: Fix Component Links

Update all clinic links to use `/pain-management/` directly instead of `/clinics/` (which triggers a 301 redirect).

### Tasks

- [x] Update `src/components/clinic/clinic-card.tsx` line 60
- [x] Update `src/components/clinic/clinic-card-featured.tsx` line 92
- [x] Update `src/components/map/clinic-popup.tsx` lines 58 and 119
- [x] Verify links work correctly

### Technical Details

Current pattern (causes 301 redirect):
```tsx
<Link href={`/clinics/${clinic.slug}`}>View Details</Link>
```

New pattern (direct link):
```tsx
<Link href={`/pain-management/${clinic.slug}/`}>View Details</Link>
```

Note: The `clinic.slug` from transformed data should map to the correct permalink path. If using database data, use the full `permalink` field instead.

## Phase 3: Extract Admin Auth Utility [complex]

Create a shared admin authentication utility to replace the 14 duplicate `checkAdmin()` functions in API routes.

### Tasks

- [x] Create `src/lib/admin-auth.ts` with `checkAdminApi()` function
- [x] Update `src/app/api/admin/import/upload/route.ts`
- [x] Update `src/app/api/admin/import/batch/route.ts`
- [x] Update `src/app/api/admin/import/execute/route.ts`
- [x] Update `src/app/api/admin/import/verify/route.ts`
- [x] Update `src/app/api/admin/import/[batchId]/route.ts`
- [x] Update `src/app/api/admin/optimize/route.ts`
- [x] Update `src/app/api/admin/optimize/[batchId]/route.ts`
- [x] Update `src/app/api/admin/optimize/[batchId]/execute/route.ts`
- [x] Update `src/app/api/admin/optimize/[batchId]/pause/route.ts`
- [x] Update `src/app/api/admin/optimize/[batchId]/rollback/route.ts`
- [x] Update `src/app/api/admin/optimize/content/route.ts`
- [x] Update `src/app/api/admin/optimize/content/[versionId]/route.ts`
- [x] Update `src/app/api/admin/optimize/content/bulk/route.ts`
- [x] Update `src/app/api/admin/validate-urls/route.ts`
- [x] Run lint and typecheck

### Technical Details

New file `src/lib/admin-auth.ts`:
```typescript
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

export type AdminCheckResult =
  | { error: string; status: 401 | 403 }
  | {
      session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
      user: typeof schema.user.$inferSelect
    };

/**
 * Check admin status for API routes.
 * Returns session and user if admin, or error object if not.
 */
export async function checkAdminApi(): Promise<AdminCheckResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, session.user.id),
  });

  if (!user || user.role !== "admin") {
    return { error: "Forbidden - Admin access required", status: 403 };
  }

  return { session, user };
}

/**
 * Helper to create error response from admin check result.
 */
export function adminErrorResponse(result: { error: string; status: number }) {
  return new Response(JSON.stringify({ error: result.error }), {
    status: result.status,
    headers: { "Content-Type": "application/json" },
  });
}
```

Usage in API routes:
```typescript
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }
  const { session, user } = adminCheck;
  // ... rest of handler
}
```

## Phase 4: Extract Shared Components [complex]

Create shared StarRating component and utility functions to replace duplicates.

### Tasks

- [x] Create `src/components/clinic/star-rating.tsx` with variant prop
- [x] Update `src/components/clinic/clinic-card.tsx` to use shared StarRating
- [x] Update `src/components/clinic/clinic-header.tsx` to use shared StarRating
- [x] Update `src/components/clinic/clinic-card-featured.tsx` to use shared StarRating
- [x] Create `src/lib/time-utils.ts` with formatTime function
- [x] Update `src/components/clinic/clinic-hours.tsx` to use shared formatTime
- [x] Update `src/components/clinic/clinic-header.tsx` to use shared formatTime
- [x] Create `src/lib/day-constants.ts` with day utilities
- [x] Update components to use shared day constants
- [x] Run lint and typecheck

### Technical Details

**StarRating Component** (`src/components/clinic/star-rating.tsx`):
```tsx
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  reviewCount: number;
  variant?: 'compact' | 'full';
  className?: string;
}

export function StarRating({
  rating,
  reviewCount,
  variant = 'compact',
  className
}: StarRatingProps) {
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">{rating.toFixed(1)}</span>
        <span className="text-muted-foreground text-sm">({reviewCount})</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-5 w-5',
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted'
            )}
          />
        ))}
      </div>
      <span className="text-lg font-semibold">{rating.toFixed(1)}</span>
      <span className="text-muted-foreground">({reviewCount} reviews)</span>
    </div>
  );
}
```

**Time Utils** (`src/lib/time-utils.ts`):
```typescript
/**
 * Format 24-hour time string to 12-hour format with AM/PM.
 * @param time - Time string in HH:MM format
 * @returns Formatted time string (e.g., "9:00 AM")
 */
export function formatTime(time: string): string {
  const parts = time.split(':');
  const hours = parseInt(parts[0] ?? '0', 10);
  const minutes = parseInt(parts[1] ?? '0', 10);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}
```

**Day Constants** (`src/lib/day-constants.ts`):
```typescript
export type DayName = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export const DAY_ORDER: DayName[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

export const DAY_LABELS: Record<DayName, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

export const WEEKDAY_INDEX_TO_NAME: DayName[] = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
];

export function getCurrentDay(): DayName {
  return WEEKDAY_INDEX_TO_NAME[new Date().getDay()] as DayName;
}
```

## Phase 5: Code Quality Improvements

Standardize patterns and extract remaining duplicate utilities.

### Tasks

- [x] Create `src/lib/html-utils.ts` with stripHtmlTags function
- [x] Update `src/lib/clinic-db-to-type.ts` to use shared stripHtmlTags
- [x] Update `src/app/pain-management/[...slug]/page.tsx` to use shared stripHtmlTags
- [x] Create `src/lib/maps-utils.ts` with Google Maps URL builder
- [x] Update `src/components/clinic/clinic-header.tsx` to use shared maps util
- [x] Update `src/components/map/embedded-map.tsx` to use shared maps util
- [x] Audit API routes and standardize on NextResponse.json() pattern
- [x] Run final lint and typecheck

### Technical Details

**HTML Utils** (`src/lib/html-utils.ts`):
```typescript
/**
 * Strip HTML tags from content string.
 * @param html - HTML content string
 * @returns Plain text content
 */
export function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
```

**Maps Utils** (`src/lib/maps-utils.ts`):
```typescript
/**
 * Build Google Maps directions URL for an address.
 * @param address - Formatted address string
 * @returns Google Maps directions URL
 */
export function buildGoogleMapsDirectionsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}
```

**API Response Pattern**:
Replace:
```typescript
return new Response(JSON.stringify({ data }), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});
```

With:
```typescript
import { NextResponse } from "next/server";
return NextResponse.json({ data });
```
