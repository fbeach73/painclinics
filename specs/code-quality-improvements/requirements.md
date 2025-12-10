# Requirements: Code Quality Improvements

## Overview

Following a comprehensive review of the multi-phase Pain Clinics Directory implementation, several code quality issues were identified. This feature addresses code duplication, Next.js best practices violations, database optimization opportunities, and minor security gaps.

## Background

Multiple developers worked on different phases of the implementation, resulting in:
- Duplicate utility functions across files
- Similar components that could be consolidated
- Missing optimizations for Next.js 16 patterns
- Database query inefficiencies

## Goals

1. **Eliminate code duplication** - Consolidate duplicate functions and components
2. **Follow Next.js best practices** - Proper image optimization, caching, and component patterns
3. **Optimize database layer** - Add missing indexes and eliminate N+1 queries
4. **Harden security** - Add missing validations and use shared utilities

## Acceptance Criteria

### Code Consolidation
- [ ] Single source of truth for HTML stripping logic
- [ ] Single slug extraction function used across codebase
- [ ] Single time range parsing utility
- [ ] Clinic card components merged with variant prop

### Next.js Best Practices
- [ ] All images use Next.js Image component (no raw `<img>` tags)
- [ ] Home page has ISR caching configured
- [ ] Markdown components are properly memoized

### Database Optimization
- [ ] Composite index on (stateAbbreviation, city) for common queries
- [ ] No N+1 query patterns in service queries

### Security
- [ ] File size limit on CSV uploads
- [ ] All admin routes use shared `checkAdminApi()` utility

## Out of Scope

- New feature development
- UI/UX changes
- Database schema changes (beyond indexes)

## Dependencies

- None - these are internal code improvements

## Related Documentation

- Review findings: `/Users/kylesweezey/.claude/plans/wise-wibbling-kettle.md`
