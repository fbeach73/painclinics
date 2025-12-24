# Implementation Plan: Analytics Code Cleanup

## Overview

Refactor the analytics implementation to eliminate duplicate code, consolidate type definitions, and improve data fetching patterns with SWR. This cleanup addresses issues identified during the code review of the recently implemented custom analytics system.

## Phase 1: Consolidate Constants and Types

Create shared files for analytics constants and types to eliminate duplication.

### Tasks

- [x] Create shared analytics constants file with `REFERRER_COLORS`
- [x] Create shared analytics types file with all interface definitions
- [x] Update `traffic-analytics-client.tsx` to import shared constants and types
- [x] Update `clinic-analytics-widget.tsx` to import shared constants and types
- [x] Export types from `src/lib/analytics/queries.ts` instead of keeping them internal
- [x] Update `getReferrerLabel()` usage in UI components for consistent labeling

### Technical Details

**New file: `src/lib/analytics/constants.ts`**
```typescript
/**
 * Color mappings for referrer source badges
 * Used in both admin traffic analytics and owner clinic widget
 */
export const REFERRER_COLORS: Record<string, string> = {
  google: "bg-blue-500",
  direct: "bg-gray-500",
  bing: "bg-teal-500",
  facebook: "bg-indigo-500",
  twitter: "bg-sky-500",
  linkedin: "bg-blue-700",
  instagram: "bg-pink-500",
  pinterest: "bg-red-500",
  reddit: "bg-orange-500",
  tiktok: "bg-black",
  youtube: "bg-red-600",
  internal: "bg-green-500",
  referral: "bg-purple-500",
};

// Variant with text color for badges that need it
export const REFERRER_BADGE_COLORS: Record<string, string> = {
  google: "bg-blue-500 text-white",
  direct: "bg-gray-500 text-white",
  // ... same pattern
};
```

**New file: `src/types/analytics.ts`**
```typescript
export interface OverviewStats {
  totalPageviews: number;
  uniqueVisitors: number;
  clinicViews: number;
}

export interface ReferrerStats {
  source: string;
  count: number;
}

export interface PageStats {
  path: string;
  views: number;
  uniqueVisitors: number;
}

export interface TimeSeriesData {
  date: string;
  views: number;
  uniqueVisitors?: number;
}

export interface ClinicAnalytics {
  totalViews: number;
  uniqueVisitors: number;
  referrers: ReferrerStats[];
  viewsOverTime: TimeSeriesData[];
}

export interface AnalyticsData {
  overview: OverviewStats;
  referrers: ReferrerStats[];
  topPages: PageStats[];
  viewsOverTime: TimeSeriesData[];
}

export type DateRange = "today" | "7d" | "30d" | "all";
```

**Files to update:**
- `src/app/admin/analytics/traffic-analytics-client.tsx` - Remove duplicate interfaces (lines 48-76), remove duplicate REFERRER_COLORS (lines 89-103), import from shared files
- `src/components/owner/clinic-analytics-widget.tsx` - Remove duplicate interfaces (lines 15-30), remove duplicate REFERRER_COLORS (lines 32-46), import from shared files
- `src/lib/analytics/queries.ts` - Export existing interfaces, import DateRange from types file
- `src/lib/analytics/index.ts` - Re-export types from the types file

**Using getReferrerLabel:**
Replace inline capitalization:
```typescript
// Before (traffic-analytics-client.tsx:329-331)
{referrer.source === "direct" ? "Direct / None" : referrer.source}

// After
{getReferrerLabel(referrer.source)}
```

## Phase 2: Install and Configure SWR

Add SWR for improved client-side data fetching with caching and revalidation.

### Tasks

- [x] Install SWR package
- [x] Create analytics SWR hooks file with typed fetchers
- [x] Update `traffic-analytics-client.tsx` to use SWR
- [x] Update `clinic-analytics-widget.tsx` to use SWR
- [x] Update `keywords-client.tsx` to use SWR
- [x] Remove redundant useState for loading/error states where SWR handles them

### Technical Details

**Install SWR:**
```bash
pnpm add swr
```

**New file: `src/lib/analytics/hooks.ts`**
```typescript
"use client";

import useSWR from "swr";
import type { AnalyticsData, ClinicAnalytics, DateRange } from "@/types/analytics";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export function useTrafficAnalytics(range: DateRange) {
  const { data, error, isLoading, mutate } = useSWR<AnalyticsData>(
    `/api/admin/analytics?range=${range}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    data,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}

export function useClinicAnalytics(clinicId: string) {
  const { data, error, isLoading } = useSWR<ClinicAnalytics>(
    clinicId ? `/api/owner/analytics?clinicId=${clinicId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    data,
    isLoading,
    isError: !!error,
  };
}

export function useKeywordsAnalytics(stateFilter: string) {
  const params = new URLSearchParams();
  if (stateFilter && stateFilter !== "all") {
    params.set("state", stateFilter);
  }
  params.set("limit", "50");

  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/analytics/keywords?${params}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    data,
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
```

**Refactoring pattern for components:**

Before (traffic-analytics-client.tsx):
```typescript
const [data, setData] = useState<AnalyticsData | null>(null);
const [loading, setLoading] = useState(true);
const [range, setRange] = useState<DateRange>("30d");

const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const response = await fetch(`/api/admin/analytics?range=${range}`);
    if (response.ok) {
      const result = await response.json();
      setData(result);
    }
  } catch (error) {
    console.error("Error fetching analytics:", error);
  } finally {
    setLoading(false);
  }
}, [range]);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

After:
```typescript
const [range, setRange] = useState<DateRange>("30d");
const { data, isLoading, refresh } = useTrafficAnalytics(range);
```

## Phase 3: Fix Linting Issues

Resolve import order warnings in analytics-related files.

### Tasks

- [x] Fix import order in `analytics-page-client.tsx`
- [x] Fix import order in `traffic-analytics-client.tsx`
- [x] Fix import order in `api/admin/analytics/route.ts`
- [x] Run lint to verify all warnings resolved
- [x] Run typecheck to ensure no type errors introduced

### Technical Details

**Import order rule:** The project uses `eslint-plugin-import` with import grouping. The correct order is:
1. External packages (react, next, etc.)
2. Internal aliases (@/lib, @/components, etc.)
3. Relative imports

**Files with import order issues:**

`src/app/admin/analytics/analytics-page-client.tsx:3` - Empty line between import groups
```typescript
// Before
"use client";

import { TrendingUp, MessageSquare } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// After - remove extra blank line, group imports properly
"use client";

import { TrendingUp, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
```

`src/app/admin/analytics/traffic-analytics-client.tsx:12` - Empty line between import groups

`src/app/api/admin/analytics/route.ts:1` - Empty line between import groups

**Verification commands:**
```bash
pnpm run lint
pnpm run typecheck
```

## Phase 4: Update Index Exports

Ensure the analytics module exports all shared utilities consistently.

### Tasks

- [x] Update `src/lib/analytics/index.ts` to export constants
- [x] Update `src/lib/analytics/index.ts` to re-export types
- [x] Verify all imports work correctly across the codebase

### Technical Details

**Updated `src/lib/analytics/index.ts`:**
```typescript
/**
 * Analytics module - Privacy-first analytics for the application
 */

// Utilities
export { isBot } from "./bot-filter";
export { categorizeReferrer, getReferrerLabel } from "./referrer-utils";
export { generateSessionHash, getEventDate } from "./session-hash";

// Constants
export { REFERRER_COLORS, REFERRER_BADGE_COLORS } from "./constants";

// Queries
export {
  getOverviewStats,
  getReferrerStats,
  getTopPages,
  getViewsOverTime,
  getClinicAnalytics,
  insertAnalyticsEvent,
} from "./queries";

// Hooks (client-side)
export {
  useTrafficAnalytics,
  useClinicAnalytics,
  useKeywordsAnalytics,
} from "./hooks";

// Types - re-export from types file for convenience
export type {
  OverviewStats,
  ReferrerStats,
  PageStats,
  TimeSeriesData,
  ClinicAnalytics,
  AnalyticsData,
  DateRange,
} from "@/types/analytics";
```

**Import pattern for consumers:**
```typescript
// Server-side (API routes, server components)
import { getOverviewStats, type DateRange } from "@/lib/analytics";

// Client-side (React components)
import { useTrafficAnalytics, REFERRER_COLORS, getReferrerLabel } from "@/lib/analytics";
```
