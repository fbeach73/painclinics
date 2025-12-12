# Implementation Plan: Bulk Content Enhancement

## Overview

Replace the complex Content Optimization system with a simpler bulk enhancement feature. Remove all old infrastructure and add multi-select capability to the Clinics admin table.

---

## Phase 1: Remove Old Content Optimization System ✅

Remove all files and database resources from the original content optimization feature.

### Tasks

- [x] Delete `/admin/optimize` pages directory (4 files)
  - `src/app/admin/optimize/page.tsx` - Dashboard
  - `src/app/admin/optimize/new/page.tsx` - Batch creation
  - `src/app/admin/optimize/[batchId]/page.tsx` - Batch detail
  - `src/app/admin/optimize/review/page.tsx` - Review queue
- [x] Delete `/api/admin/optimize` API routes directory (8 files)
  - `src/app/api/admin/optimize/route.ts` - Batch list/create
  - `src/app/api/admin/optimize/[batchId]/route.ts` - Batch CRUD
  - `src/app/api/admin/optimize/[batchId]/execute/route.ts` - Batch execution
  - `src/app/api/admin/optimize/[batchId]/pause/route.ts` - Pause batch
  - `src/app/api/admin/optimize/[batchId]/rollback/route.ts` - Rollback
  - `src/app/api/admin/optimize/content/route.ts` - Content listing
  - `src/app/api/admin/optimize/content/[versionId]/route.ts` - Version CRUD
  - `src/app/api/admin/optimize/content/bulk/route.ts` - Bulk operations
- [x] Remove "Content Optimization" link from admin sidebar
  - Edit `src/components/admin/admin-sidebar.tsx`
  - Remove Sparkles icon import
  - Remove nav item object
- [x] Remove database table definitions from schema
  - Edit `src/lib/schema.ts`
  - Remove `optimizationBatches` table (~lines 259-315)
  - Remove `contentVersions` table (~lines 317-380)
- [x] Drop database tables
  - Execute SQL: `DROP TABLE IF EXISTS content_versions CASCADE; DROP TABLE IF EXISTS optimization_batches CASCADE;`

### Commands Run

```bash
rm -rf src/app/admin/optimize
rm -rf src/app/api/admin/optimize
# Edit admin-sidebar.tsx manually
# Edit schema.ts manually
PGPASSWORD="..." psql ... -c "DROP TABLE IF EXISTS content_versions CASCADE; DROP TABLE IF EXISTS optimization_batches CASCADE;"
```

---

## Phase 2: Add Bulk Enhancement Feature ✅

Add multi-select and bulk action capability to the existing Clinics admin table.

### Tasks

- [x] Create bulk enhance modal component
  - New file: `src/components/admin/bulk-enhance-modal.tsx`
  - Dialog with progress bar
  - Success/skipped/error stat counters
  - Scrollable log of results
  - Cancel and Done buttons
  - Sequential API calls with 500ms delay
- [x] Update clinics table with multi-select
  - Edit: `src/components/admin/clinics-table.tsx`
  - Add selection state (`selectedIds: Set<string>`)
  - Add checkbox column (leftmost)
  - Add "Select All" header checkbox
  - Add row checkboxes
  - Add row highlighting when selected
  - Add bulk action toolbar (appears when items selected)
  - Integrate BulkEnhanceModal

### Technical Details

**New File: `src/components/admin/bulk-enhance-modal.tsx`**

```typescript
interface BulkEnhanceModalProps {
  clinicIds: string[];
  clinicNames: Map<string, string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

// Modal features:
// - Progress bar with percentage
// - Grid showing success/skipped/error counts
// - ScrollArea with log entries
// - Cancel button (aborts AbortController)
// - Done button (calls onComplete, closes modal)
```

**Modified File: `src/components/admin/clinics-table.tsx`**

```typescript
// New state
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [showBulkModal, setShowBulkModal] = useState(false);

// New computed values
const clinicNamesMap = useMemo(() => {
  const map = new Map<string, string>();
  clinics.forEach((clinic) => map.set(clinic.id, clinic.title));
  return map;
}, [clinics]);

const allSelected = clinics.length > 0 && clinics.every((c) => selectedIds.has(c.id));
const someSelected = clinics.some((c) => selectedIds.has(c.id));

// New functions
const toggleSelectAll = () => { /* ... */ };
const toggleSelect = (id: string) => { /* ... */ };
const clearSelection = () => { /* ... */ };
```

**Bulk Action Toolbar (added above results count):**

```tsx
{selectedIds.size > 0 && (
  <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
    <span className="text-sm font-medium">
      {selectedIds.size} clinic{selectedIds.size !== 1 ? 's' : ''} selected
    </span>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={clearSelection}>
        Clear Selection
      </Button>
      <Button size="sm" onClick={() => setShowBulkModal(true)}>
        <Sparkles className="mr-2 h-4 w-4" />
        Bulk Enhance
      </Button>
    </div>
  </div>
)}
```

**Table Checkbox Column:**

```tsx
<TableHead className="w-[50px]">
  <Checkbox
    checked={allSelected}
    onCheckedChange={toggleSelectAll}
    aria-label="Select all clinics"
    className={someSelected && !allSelected ? 'opacity-50' : ''}
  />
</TableHead>
```

---

## Phase 3: Verification ✅

Ensure all changes work correctly.

### Tasks

- [x] Run lint check - No errors (only pre-existing warnings)
- [x] Run typecheck - No errors
- [x] Verify old optimize routes removed
- [x] Verify sidebar link removed
- [x] Verify database tables dropped

### Commands Run

```bash
pnpm run lint    # ✅ 0 errors, 108 warnings (pre-existing)
pnpm run typecheck    # ✅ No errors
```

---

## Files Summary

### Deleted Files

| Path | Description |
|------|-------------|
| `src/app/admin/optimize/` | Entire directory (4 pages) |
| `src/app/api/admin/optimize/` | Entire directory (8 API routes) |

### Modified Files

| File | Change |
|------|--------|
| `src/components/admin/admin-sidebar.tsx` | Removed Content Optimization nav item |
| `src/lib/schema.ts` | Removed `optimizationBatches` and `contentVersions` tables |
| `src/components/admin/clinics-table.tsx` | Added multi-select and bulk action UI |

### New Files Created

| Path | Purpose |
|------|---------|
| `src/components/admin/bulk-enhance-modal.tsx` | Modal for bulk enhancement progress |

---

## User Guide

### How to Use Bulk Enhancement

1. Navigate to **Admin > Clinics** (`/admin/clinics`)
2. Use checkboxes to select clinics:
   - Click individual checkboxes to select specific clinics
   - Click header checkbox to select all visible clinics
   - Use filters to narrow down, then select all
3. When clinics are selected, a toolbar appears showing selection count
4. Click **"Bulk Enhance"** button
5. In the modal, click **"Start Enhancement"**
6. Watch progress as clinics are processed:
   - **Success**: Content was generated and saved
   - **Skipped**: Clinic already has enhanced content
   - **Error**: Failed to process (continues with next clinic)
7. Click **"Done"** when complete - table will refresh automatically

### Notes

- Enhancement uses the same AI as the individual clinic Content Tab
- Clinics with existing enhanced content are skipped automatically
- Processing can be cancelled mid-way (click Cancel)
- After completion, visit individual clinic pages to view/edit enhanced content
- To regenerate content for a specific clinic, use the Content Tab on its detail page

---

## Comparison with Old System

| Feature | Old (Content Optimization) | New (Bulk Enhance) |
|---------|---------------------------|-------------------|
| Interface | Separate pages | Integrated in Clinics table |
| Batch config | Configurable | Uses API defaults |
| Review workflow | Required approval | Immediate application |
| Versioning | Content versions table | None (uses newPostContent field) |
| Rollback | Batch rollback | Regenerate individually |
| FAQ generation | Included | Not included |
| Keyword integration | Included | Not included |
| Cost tracking | Displayed | Not tracked |
| Complexity | High | Low |
