# Requirements: Implementation Cleanup

## Overview

Clean up the pain clinic directory implementation to resolve code duplication, inconsistencies, and best practice violations identified during the implementation review.

## Background

Multiple developers worked on different phases of the pain clinic directory feature, resulting in:
- Duplicate code across 14 API routes
- Duplicate components (3 StarRating implementations)
- Unused routes and mock data
- Inconsistent link URLs causing unnecessary redirects

## Goals

1. Remove dead code (`/clinics` routes redirect via middleware anyway)
2. Remove mock data (real data is in database)
3. Fix broken links that cause 301 redirects
4. Consolidate duplicate code into shared utilities
5. Improve code quality and maintainability

## Acceptance Criteria

### Must Have
- [ ] `/clinics` routes removed (middleware handles redirects)
- [ ] Mock data files removed
- [ ] All clinic links point directly to `/pain-management/{permalink}/`
- [ ] Single `checkAdminApi()` utility used across all admin API routes
- [ ] Single `StarRating` component with variant prop

### Should Have
- [ ] Shared time utilities (`formatTime`, day constants)
- [ ] Shared HTML stripping utility
- [ ] Shared Google Maps URL utility
- [ ] Consistent API response patterns using `NextResponse.json()`

### Dependencies
- Pain clinic directory feature (completed)
- Database with imported clinic data

## Out of Scope
- Adding new features
- Changing database schema
- Modifying the `/pain-management` routes (they work correctly)
