# Requirements: Bulk Content Enhancement

## Overview

Replace the complex Content Optimization system with a simpler bulk enhancement feature integrated directly into the Clinics admin table. This removes the need for separate batch management, review queues, and versioning—instead leveraging the existing single-clinic enhancement API.

## Background

The original Content Optimization feature (`/admin/optimize`) was a sophisticated system with:
- Batch processing with configurable settings
- Review workflow with pause intervals
- Content versioning and rollback
- FAQ generation and keyword integration
- Cost tracking and progress streaming

While powerful, this complexity was rarely needed. The simpler Content Tab enhancement on individual clinic pages proved more practical for day-to-day use.

## Goals

1. **Simplify** - Remove complex batch/review infrastructure
2. **Integrate** - Add bulk selection to existing Clinics table
3. **Reuse** - Leverage existing single-clinic `/api/admin/clinics/[clinicId]/enhance-about` API
4. **Streamline** - Process clinics sequentially with progress feedback

## Functional Requirements

### FR1: Remove Old Content Optimization Feature

- Remove `/admin/optimize` pages (dashboard, new batch, batch detail, review queue)
- Remove `/api/admin/optimize` API routes
- Remove sidebar navigation link
- Drop `optimization_batches` and `content_versions` database tables
- Remove related schema definitions

### FR2: Multi-Select in Clinics Table

- Add checkbox column to clinics table (leftmost position)
- "Select All" checkbox in header (selects current page)
- Individual row checkboxes
- Visual highlighting for selected rows
- Selection persists while browsing (until explicitly cleared)

### FR3: Bulk Action Toolbar

- Appears when one or more clinics are selected
- Shows count of selected clinics
- "Clear Selection" button
- "Bulk Enhance" button to trigger enhancement modal

### FR4: Bulk Enhancement Modal

- Displays number of clinics to process
- Progress bar with percentage
- Success/skipped/error counts
- Scrollable log showing each clinic's result
- Cancel button to stop mid-process
- Done button when complete

### FR5: Sequential Processing

- Process one clinic at a time
- Reuse existing `/api/admin/clinics/[clinicId]/enhance-about` API
- 500ms delay between requests (rate limiting)
- Skip clinics that already have enhanced content
- Track and display success/skip/error status for each

## Non-Functional Requirements

### NFR1: Performance

- Modal should remain responsive during processing
- Progress updates should be near real-time
- Cancellation should stop processing immediately

### NFR2: User Experience

- Clear visual feedback during selection
- Informative progress display
- Graceful handling of errors (continue processing other clinics)
- Refresh table data after completion

## Out of Scope

- Batch configuration (word count, FAQ count, etc.) - uses API defaults
- Review queue / approval workflow - content applied immediately
- Rollback capability - use individual clinic Content Tab to regenerate
- Cost tracking - not displayed to user
- Keyword integration from reviews - not in current enhance-about API

## Success Criteria

1. Old Content Optimization feature completely removed
2. Users can select multiple clinics in admin table
3. Bulk Enhance processes selected clinics with progress feedback
4. Existing enhance-about API continues to work unchanged
5. All lint and type checks pass
