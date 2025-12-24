# Requirements: Analytics Code Cleanup

## Overview

The custom privacy-first analytics system was recently implemented by multiple developers working on different phases. A code review identified duplicate code, type definitions, and opportunities to improve alignment with React/Next.js best practices.

## Problem Statement

1. **Duplicate Constants**: `REFERRER_COLORS` is defined identically in two files
2. **Duplicate Type Definitions**: `OverviewStats`, `ReferrerStats`, `PageStats`, and `TimeSeriesData` interfaces are defined in multiple files
3. **Data Fetching Pattern**: Client components use raw `useEffect` + `fetch` instead of a data fetching library like SWR
4. **Unused Utility**: `getReferrerLabel()` exists but UI components use inline capitalization logic
5. **Import Order Warnings**: ESLint flagged import order issues in analytics files

## Goals

- Eliminate code duplication
- Establish shared types and constants for analytics
- Improve data fetching with SWR for caching, revalidation, and better UX
- Fix linting warnings
- Maintain all existing functionality

## Acceptance Criteria

- [ ] `REFERRER_COLORS` defined in a single location and imported where needed
- [ ] Analytics type definitions exported from a single shared types file
- [ ] Client components use SWR for data fetching with proper loading/error states
- [ ] All analytics-related import order warnings resolved
- [ ] `getReferrerLabel()` used for consistent referrer labeling in UI
- [ ] All existing analytics functionality continues to work (admin dashboard, owner widget, page tracking)
- [ ] Lint and typecheck pass with no new warnings

## Related Features

- Custom Analytics System (implemented in commit `c36591a`)
- Review Keywords Analytics (existing feature at `/api/admin/analytics/keywords`)

## Non-Goals

- Adding new analytics features
- Changing the database schema
- Modifying the tracking API or PageTracker component
