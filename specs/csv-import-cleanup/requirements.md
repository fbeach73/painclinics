# Requirements: CSV Import Cleanup & Code Consolidation

## Overview

Following the implementation of Outscraper CSV import support and admin reviews management, a code review identified several issues including security vulnerabilities, duplicate code, and missing database optimizations. This feature addresses all identified issues to improve code quality, security, and maintainability.

## Problem Statement

The recent multi-phase implementation introduced:
1. **Security vulnerability**: Unsanitized HTML rendered via `dangerouslySetInnerHTML`
2. **Code duplication**: Multiple identical type definitions, utility functions, and slug generators
3. **Performance gap**: Missing database index for the new `createdAt` sort functionality
4. **Maintenance burden**: Scattered interfaces making updates error-prone

## Goals

1. Eliminate XSS vulnerability by sanitizing HTML content
2. Consolidate duplicate type definitions into single source of truth
3. Create shared utility functions to reduce code duplication
4. Add missing database indexes for query performance
5. Remove redundant code without breaking existing functionality

## Acceptance Criteria

### Security
- [ ] All HTML rendered via `dangerouslySetInnerHTML` is sanitized using DOMPurify
- [ ] Sanitization works on both server and client (isomorphic)

### Type Consolidation
- [ ] `FeaturedReview`, `DetailedReview`, `ReviewKeyword`, `ClinicHour` defined in one location
- [ ] All files importing these types from the single source
- [ ] No duplicate interface definitions remain

### Utility Consolidation
- [ ] Single `generateSlug` function used across all components
- [ ] `safeParseJSON`, `safeParseInt`, `safeParseFloat`, `emptyToNull` in shared parsers file
- [ ] `getStateName` only exists in `us-states.ts`
- [ ] `stripHtmlTags` only exists in `html-utils.ts`

### Database
- [ ] Index exists on `clinics.createdAt` column
- [ ] Migration runs without errors

### Code Quality
- [ ] `pnpm typecheck` passes with no errors in `src/` directory
- [ ] `pnpm lint` passes
- [ ] No functionality regressions

## Out of Scope

- Fixing TypeScript errors in `specs/` directory (standalone scripts)
- Refactoring component architecture (featured card variants)
- Adding new features or functionality

## Dependencies

- Requires `isomorphic-dompurify` package installation
- Database migration needed for new index

## Related Features

- CSV Import Overhaul (`specs/csv-import-overhaul/`)
- Original implementation checkpoint commit: `65406ff`
