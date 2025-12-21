# Requirements: Code Consolidation & Cleanup

## Overview

After implementing the Google Places sync system and pain tracking features across multiple development phases, the codebase has accumulated several duplications and inconsistencies. This cleanup effort consolidates duplicate code, removes unnecessary files, and ensures consistent patterns across the application.

## Problem Statement

Multiple developers working on different phases resulted in:

1. **Three separate rate limiter implementations** with similar functionality
2. **Duplicate `sleep()` utility functions** in three different files
3. **Two `getClinicById` functions** with slightly different return types
4. **Two Better Auth instances** (`auth` and `authSession`) causing confusion
5. **Fragmented auth helper files** spread across four locations

## Goals

1. Reduce code duplication and maintenance burden
2. Establish single sources of truth for common utilities
3. Improve developer experience with consistent patterns
4. Reduce bundle size by eliminating duplicate code
5. Prevent future confusion about which utility to use

## Acceptance Criteria

### Rate Limiting & Utilities
- [ ] Single `sleep()` function exported from `src/lib/utils.ts`
- [ ] All files importing local `sleep()` updated to use shared utility
- [ ] Rate limiters remain separate (different use cases) but share common utilities

### Clinic Queries
- [ ] Single `getClinicById` function with optional `includeRelations` parameter
- [ ] All callers updated to use the consolidated function
- [ ] Type exports remain backward compatible

### Authentication
- [ ] `src/lib/auth-session.ts` removed entirely
- [ ] Any references to `authSession` updated to use `auth`
- [ ] Auth helper functions consolidated into fewer files

### Pain Tracking Component
- [ ] Duplicate download logic in `download-templates.tsx` extracted to helper

## Out of Scope

- Refactoring the rate limiters themselves (they serve different purposes)
- Adding new functionality
- Changing API contracts
- Database schema changes

## Dependencies

- None - this is a cleanup of existing code

## Related Features

- Google Places Sync System (specs/google-places-sync)
- Pain Tracking Page (specs/pain-tracking-page)
