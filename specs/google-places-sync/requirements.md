# Requirements: Google Places Sync & Clinic Management

## Summary

Enhance the existing admin clinic management with full CRUD operations and Google Places API (New) sync capabilities. This allows administrators to add, edit, and delete clinics directly in the database, sync clinic data from Google Places by Place ID, perform bulk updates, and schedule automated syncs.

## Problem Statement

Currently, clinic data is imported via CSV exports from WordPress that contain Google Places data. There is no way to:
- Add new clinics directly without going through CSV import
- Edit existing clinic information in the admin
- Delete clinics
- Refresh data from Google Places for updated reviews, hours, or photos
- Schedule regular updates to keep data fresh

## Goals

1. **CRUD Operations** - Full create, read, update, delete capabilities for clinics in admin
2. **Google Places Sync** - Pull live data from Google Places API (New) using Place ID
3. **Review Priority** - Prioritize syncing review data (rating, count, featured reviews, keywords)
4. **Bulk Operations** - Select multiple clinics and sync them in a single operation
5. **Scheduling** - Support both automated (cron) and manual sync triggers
6. **Admin UI** - Clean shadcn/ui interface integrated with existing admin structure

## User Stories

### As an Administrator, I want to:

1. **Add a new clinic** by entering details manually or by looking up a Google Places ID
2. **Edit any clinic field** directly in the admin without needing to re-import from CSV
3. **Delete clinics** that are closed or invalid
4. **Sync a single clinic** with Google Places to refresh reviews, hours, photos, and contact info
5. **Bulk sync multiple clinics** at once with progress tracking
6. **Create sync schedules** that run automatically (daily, weekly, monthly)
7. **View sync history** to see what was updated and any errors
8. **Preview changes** before syncing to see what data will be updated

## Acceptance Criteria

### CRUD Operations
- [ ] Can create a new clinic with required fields (title, city, state, postal code, coordinates)
- [ ] Can populate clinic from Google Place ID lookup
- [ ] Can edit any existing clinic field
- [ ] Can delete a single clinic with confirmation
- [ ] Can bulk delete selected clinics

### Google Places Sync
- [ ] Can sync individual clinic by clicking "Sync" button
- [ ] Syncs reviews: rating, reviewCount, featuredReviews, reviewKeywords, reviewsPerScore
- [ ] Syncs business info: clinicHours, closedOn, phone, website
- [ ] Syncs photos: clinicImageUrls
- [ ] Syncs location: mapLatitude, mapLongitude, detailedAddress
- [ ] Shows preview of changes before applying
- [ ] Handles API errors gracefully with user feedback

### Bulk Operations
- [ ] Can select multiple clinics from list view
- [ ] "Bulk Sync" button appears when clinics selected
- [ ] Progress modal shows real-time status (success/error/skipped counts)
- [ ] Can cancel bulk operation mid-process
- [ ] Rate limiting prevents API quota exhaustion (10 QPS)

### Scheduling
- [ ] Can create named sync schedules
- [ ] Frequency options: manual, daily, weekly, monthly
- [ ] Can specify scope: all clinics, selected clinics, by state, missing data only
- [ ] Can choose which fields to sync per schedule
- [ ] Schedules execute via Vercel Cron
- [ ] Can manually trigger any schedule
- [ ] Can pause/resume schedules

### UI/UX
- [ ] New "Sync" tab on clinic detail page
- [ ] New "Places Sync" section in admin sidebar
- [ ] "Add Clinic" button on clinics list page
- [ ] "Bulk Sync" action in bulk toolbar
- [ ] Sync status indicators on clinic rows (optional)
- [ ] Sync management dashboard with schedules and logs

## Dependencies

- **Google Places API (New)** - Requires API key with Places API enabled
- **Vercel Cron** - For scheduled job execution
- **Existing Schema** - `placeId` field already exists with unique constraint

## Related Features

- Existing `/admin/clinics` list and detail pages
- Existing `bulk-enhance-modal.tsx` pattern for bulk operations
- Existing CSV import functionality (not replaced, complemented)

## Out of Scope

- Automatic clinic discovery/crawling
- Bi-directional sync (pushing data to Google)
- Real-time webhooks from Google
- Cost estimation UI (may add later)
