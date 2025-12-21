# Implementation Plan: Google Places Sync & Clinic Management

## Overview

Enhance the existing admin clinic management system with:
1. Full CRUD operations for clinics
2. Google Places API (New) sync capabilities
3. Bulk sync operations with progress tracking
4. Automated scheduling via Vercel Cron
5. Sync management dashboard

---

## Phase 1: Database Schema & Environment Setup (COMPLETED)

Set up the foundational database tables and environment configuration needed for sync tracking.

### Tasks

- [x] Add sync-related enums to schema (syncScheduleFrequencyEnum, syncStatusEnum)
- [x] Create syncSchedules table for storing schedule configurations
- [x] Create syncLogs table for execution history tracking
- [x] Create clinicSyncStatus table for per-clinic sync tracking
- [x] Add GOOGLE_PLACES_API_KEY and CRON_SECRET to env.ts
- [x] Run database migration to apply schema changes

### Technical Details

**File to modify:** `src/lib/schema.ts`

**New Enums:**
```typescript
export const syncScheduleFrequencyEnum = pgEnum("sync_schedule_frequency", [
  "manual",
  "daily",
  "weekly",
  "monthly",
]);

export const syncStatusEnum = pgEnum("sync_status", [
  "pending",
  "in_progress",
  "completed",
  "failed",
  "cancelled",
]);
```

**syncSchedules Table:**
```typescript
export const syncSchedules = pgTable("sync_schedules", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  frequency: syncScheduleFrequencyEnum("frequency").default("manual"),
  isActive: boolean("is_active").default(true).notNull(),
  scope: text("scope").default("all"), // "all" | "selected" | "missing_data"
  clinicIds: text("clinic_ids").array(),
  stateFilter: text("state_filter"),
  syncReviews: boolean("sync_reviews").default(true),
  syncHours: boolean("sync_hours").default(true),
  syncPhotos: boolean("sync_photos").default(false),
  syncContact: boolean("sync_contact").default(true),
  syncLocation: boolean("sync_location").default(false),
  nextRunAt: timestamp("next_run_at"),
  lastRunAt: timestamp("last_run_at"),
  lastRunStatus: syncStatusEnum("last_run_status"),
  createdBy: text("created_by").references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  index("sync_schedules_next_run_idx").on(table.nextRunAt),
  index("sync_schedules_active_idx").on(table.isActive),
]);
```

**syncLogs Table:**
```typescript
export const syncLogs = pgTable("sync_logs", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  scheduleId: text("schedule_id").references(() => syncSchedules.id),
  status: syncStatusEnum("status").default("pending"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  totalClinics: integer("total_clinics").default(0),
  successCount: integer("success_count").default(0),
  errorCount: integer("error_count").default(0),
  skippedCount: integer("skipped_count").default(0),
  errors: jsonb("errors"), // Array of { clinicId, error, timestamp }
  apiCallsUsed: integer("api_calls_used").default(0),
  triggeredBy: text("triggered_by"), // "cron" | "manual" | userId
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("sync_logs_schedule_idx").on(table.scheduleId),
  index("sync_logs_status_idx").on(table.status),
  index("sync_logs_created_idx").on(table.createdAt),
]);
```

**clinicSyncStatus Table:**
```typescript
export const clinicSyncStatus = pgTable("clinic_sync_status", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  clinicId: text("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  lastReviewSync: timestamp("last_review_sync"),
  lastHoursSync: timestamp("last_hours_sync"),
  lastPhotosSync: timestamp("last_photos_sync"),
  lastContactSync: timestamp("last_contact_sync"),
  lastLocationSync: timestamp("last_location_sync"),
  lastFullSync: timestamp("last_full_sync"),
  lastSyncError: text("last_sync_error"),
  consecutiveErrors: integer("consecutive_errors").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
  index("clinic_sync_status_clinic_idx").on(table.clinicId),
  index("clinic_sync_status_last_full_sync_idx").on(table.lastFullSync),
]);
```

**File to modify:** `src/lib/env.ts`
```typescript
GOOGLE_PLACES_API_KEY: z.string().optional(),
CRON_SECRET: z.string().optional(),
```

**CLI Commands:**
```bash
pnpm db:generate
pnpm db:push
```

---

## Phase 2: Google Places API Client (COMPLETED)

Create the API client wrapper with rate limiting and field mapping utilities.

### Tasks

- [x] Create types.ts with TypeScript interfaces for Places API responses
- [x] Create client.ts with GooglePlacesClient class (getPlaceDetails, searchPlaces)
- [x] Create field-mapper.ts to map Places API response to clinic schema
- [x] Create rate-limiter.ts with queue-based rate limiting (10 QPS)

### Technical Details

**Files to create:** `src/lib/google-places/`

**types.ts - Key Interfaces:**
```typescript
export interface PlaceDetails {
  id: string;
  displayName: { text: string; languageCode: string };
  formattedAddress: string;
  location: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: {
    weekdayDescriptions: string[];
    periods: Array<{
      open: { day: number; hour: number; minute: number };
      close: { day: number; hour: number; minute: number };
    }>;
  };
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
  }>;
  reviews?: Array<{
    name: string;
    rating: number;
    text: { text: string };
    authorAttribution: { displayName: string; uri: string };
    publishTime: string;
  }>;
  googleMapsUri?: string;
}

export interface PlaceSearchResult {
  places: Array<{
    id: string;
    displayName: { text: string };
    formattedAddress: string;
  }>;
}
```

**client.ts - API Client:**
```typescript
const PLACES_API_BASE = "https://places.googleapis.com/v1";

export class GooglePlacesClient {
  constructor(private apiKey: string) {}

  async getPlaceDetails(placeId: string, fields: string[]): Promise<PlaceDetails> {
    const fieldMask = fields.join(",");
    const response = await fetch(
      `${PLACES_API_BASE}/places/${placeId}?fields=${fieldMask}`,
      {
        headers: {
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": fieldMask,
        },
      }
    );
    if (!response.ok) throw new Error(`Places API error: ${response.status}`);
    return response.json();
  }

  async searchPlaces(query: string): Promise<PlaceSearchResult> {
    const response = await fetch(`${PLACES_API_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ textQuery: query }),
    });
    if (!response.ok) throw new Error(`Places API error: ${response.status}`);
    return response.json();
  }
}
```

**field-mapper.ts - Field Mappings:**
```typescript
// Maps Places API fields to clinic schema fields
export const REVIEW_FIELDS = [
  "rating",
  "userRatingCount",
  "reviews",
];

export const HOURS_FIELDS = [
  "regularOpeningHours",
];

export const CONTACT_FIELDS = [
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "websiteUri",
];

export const LOCATION_FIELDS = [
  "formattedAddress",
  "location",
];

export const PHOTO_FIELDS = [
  "photos",
];

export function mapPlaceToClinic(place: PlaceDetails): Partial<ClinicRecord> {
  return {
    rating: place.rating,
    reviewCount: place.userRatingCount,
    featuredReviews: place.reviews?.slice(0, 5).map(r => ({
      username: r.authorAttribution.displayName,
      url: r.authorAttribution.uri,
      review: r.text.text,
      date: r.publishTime,
      rating: r.rating,
    })),
    phone: place.nationalPhoneNumber,
    website: place.websiteUri,
    clinicHours: place.regularOpeningHours?.weekdayDescriptions.map((desc, i) => ({
      day: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][i],
      hours: desc,
    })),
    mapLatitude: place.location?.latitude,
    mapLongitude: place.location?.longitude,
    detailedAddress: place.formattedAddress,
    googleListingLink: place.googleMapsUri,
  };
}
```

**rate-limiter.ts:**
```typescript
export class PlacesRateLimiter {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private requestsPerSecond = 10;
  private lastRequestTime = 0;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minInterval = 1000 / this.requestsPerSecond;

        if (timeSinceLastRequest < minInterval) {
          await new Promise(r => setTimeout(r, minInterval - timeSinceLastRequest));
        }

        this.lastRequestTime = Date.now();
        try {
          resolve(await fn());
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) await task();
    }
    this.processing = false;
  }
}
```

---

## Phase 3: Sync Service Layer (COMPLETED)

Create the core sync orchestration service and database queries.

### Tasks

- [x] Create sync-queries.ts with database operations for sync tables
- [x] Create sync-service.ts with syncClinic, syncBulk, and field-specific sync functions
- [x] Create scheduler.ts with utilities for calculating next run times

### Technical Details

**Files to create:** `src/lib/sync/`

**sync-queries.ts - Key Functions:**
```typescript
export async function getSyncStatus(clinicId: string)
export async function upsertSyncStatus(clinicId: string, updates: Partial<ClinicSyncStatus>)
export async function getSchedules(filters?: { isActive?: boolean })
export async function getScheduleById(id: string)
export async function createSchedule(data: NewSyncSchedule)
export async function updateSchedule(id: string, data: Partial<SyncSchedule>)
export async function deleteSchedule(id: string)
export async function getDueSchedules()
export async function createSyncLog(data: NewSyncLog)
export async function updateSyncLog(id: string, data: Partial<SyncLog>)
export async function getSyncLogs(filters?: { scheduleId?: string; limit?: number })
```

**sync-service.ts - Core Logic:**
```typescript
export async function syncClinic(
  clinicId: string,
  options: { fields?: SyncFieldType[] }
): Promise<SyncResult> {
  // 1. Get clinic with placeId
  // 2. Determine fields to fetch
  // 3. Call Places API via rate limiter
  // 4. Map response to clinic schema
  // 5. Update clinic record
  // 6. Update clinicSyncStatus
  // 7. Return changes summary
}

export async function syncBulk(
  clinicIds: string[],
  options: { fields?: SyncFieldType[]; onProgress?: (progress: SyncProgress) => void }
): Promise<BulkSyncResult> {
  // Iterate with rate limiting, track progress
}
```

**scheduler.ts:**
```typescript
export function calculateNextRun(frequency: SyncFrequency, lastRun?: Date): Date {
  const now = new Date();
  switch (frequency) {
    case "daily": return addDays(now, 1);
    case "weekly": return addWeeks(now, 1);
    case "monthly": return addMonths(now, 1);
    default: return now;
  }
}
```

---

## Phase 4: Single Clinic Sync & CRUD (COMPLETED)

Add individual clinic sync capability and basic CRUD operations.

### Tasks

- [x] Create PUT endpoint for updating clinic at /api/admin/clinics/[clinicId]/route.ts
- [x] Create DELETE endpoint for deleting clinic at /api/admin/clinics/[clinicId]/route.ts
- [x] Create POST endpoint for creating clinic at /api/admin/clinics/route.ts
- [x] Create sync endpoint at /api/admin/clinics/[clinicId]/sync/route.ts
- [x] Create places lookup endpoint at /api/admin/places/lookup/route.ts
- [x] Create places preview endpoint at /api/admin/places/preview/[placeId]/route.ts
- [x] Create ClinicSyncTab component for clinic detail page
- [x] Add Sync tab to clinic detail page TabsList

### Technical Details

**API Routes:**

`src/app/api/admin/clinics/route.ts` - Add POST handler:
```typescript
export async function POST(request: Request) {
  // Verify admin auth
  // Validate body with Zod
  // Generate ID, slug/permalink
  // Insert into clinics table
  // Return created clinic
}
```

`src/app/api/admin/clinics/[clinicId]/route.ts`:
```typescript
export async function PUT(request: Request, { params }: { params: { clinicId: string } }) {
  // Verify admin auth
  // Validate partial update body
  // Update clinic record
  // Return updated clinic
}

export async function DELETE(request: Request, { params }: { params: { clinicId: string } }) {
  // Verify admin auth
  // Delete clinic (cascade deletes sync status)
  // Return success
}
```

`src/app/api/admin/clinics/[clinicId]/sync/route.ts`:
```typescript
export async function POST(request: Request, { params }: { params: { clinicId: string } }) {
  const { fields } = await request.json(); // ["reviews", "hours", "photos", "contact", "location"]
  const result = await syncClinic(params.clinicId, { fields });
  return Response.json(result);
}
```

`src/app/api/admin/places/lookup/route.ts`:
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const client = new GooglePlacesClient(env.GOOGLE_PLACES_API_KEY);
  const results = await client.searchPlaces(query);
  return Response.json(results);
}
```

**UI Component:** `src/components/admin/clinics/clinic-sync-tab.tsx`
```typescript
interface ClinicSyncTabProps {
  clinicId: string;
  placeId: string | null;
  syncStatus: ClinicSyncStatus | null;
}

// Displays:
// - Place ID with lookup button
// - Last sync times per field type
// - Individual field sync buttons
// - "Sync All" button
// - Preview panel before sync
// - Error display if last sync failed
```

**Modify:** `src/app/admin/clinics/[clinicId]/page.tsx`
- Add "Sync" to TabsTrigger list
- Add TabsContent for sync with ClinicSyncTab component
- Fetch clinicSyncStatus in parallel with other data

---

## Phase 5: Bulk Sync & Clinic Form (COMPLETED)

Add bulk sync operations and the clinic add/edit form.

### Tasks

- [x] Create bulk-sync endpoint at /api/admin/clinics/bulk-sync/route.ts
- [x] Create BulkSyncModal component based on bulk-enhance-modal pattern
- [x] Create ClinicForm component for add/edit operations
- [x] Create PlacesLookupDialog component for searching Google Places
- [x] Create new clinic page at /admin/clinics/new/page.tsx
- [x] Add "Add Clinic" button to clinics list page header
- [x] Add "Bulk Sync" action to bulk toolbar in clinics table

### Technical Details

**API Route:** `src/app/api/admin/clinics/bulk-sync/route.ts`
```typescript
export async function POST(request: Request) {
  const { clinicIds, fields } = await request.json();

  // Create sync log entry
  const logId = await createSyncLog({
    status: "in_progress",
    totalClinics: clinicIds.length,
    triggeredBy: "manual",
  });

  // Process with rate limiting
  const results = await syncBulk(clinicIds, { fields });

  // Update log with results
  await updateSyncLog(logId, {
    status: "completed",
    successCount: results.success,
    errorCount: results.errors.length,
  });

  return Response.json(results);
}
```

**Component:** `src/components/admin/sync/bulk-sync-modal.tsx`
- Based on existing `bulk-enhance-modal.tsx` pattern
- Add field selection checkboxes (Reviews, Hours, Photos, Contact, Location)
- Progress bar, success/error/skipped counts
- Scrollable log of results
- Cancel button with AbortController
- 500ms delay between requests

**Component:** `src/components/admin/clinics/clinic-form.tsx`
```typescript
interface ClinicFormProps {
  clinic?: Clinic; // undefined = create, defined = edit
  onSuccess: (clinic: Clinic) => void;
  onCancel: () => void;
}

// Form fields:
// - Title (required)
// - Place ID (with lookup button)
// - Street Address
// - City (required)
// - State (required)
// - Postal Code (required)
// - Phone
// - Website
// - Coordinates (auto-filled from Places or manual)
```

**Component:** `src/components/admin/sync/places-lookup-dialog.tsx`
- Search input with debounced API call
- List of matching places
- Select to populate form

**Page:** `src/app/admin/clinics/new/page.tsx`
- Renders ClinicForm in create mode
- Redirects to clinic detail on success

**Modify clinics table:**
- Add "Add Clinic" Button in header
- Add "Bulk Sync" to bulk action toolbar (alongside Bulk Enhance)

---

## Phase 6: Scheduling System

Implement the automated sync scheduling with cron support.

### Tasks

- [ ] Create schedules CRUD endpoints at /api/admin/sync/schedules/
- [ ] Create manual trigger endpoint at /api/admin/sync/schedules/[id]/run/route.ts
- [ ] Create sync logs endpoint at /api/admin/sync/logs/route.ts
- [ ] Create cron handler at /api/cron/sync/route.ts
- [ ] Create vercel.json with cron configuration
- [ ] Create SyncScheduleForm component for creating/editing schedules
- [ ] Create SyncScheduleList component for displaying schedules
- [ ] Create SyncLogTable component for displaying execution history
- [ ] Create sync management dashboard at /admin/sync/page.tsx
- [ ] Add "Places Sync" nav item to admin sidebar

### Technical Details

**API Routes:**

`src/app/api/admin/sync/schedules/route.ts`:
```typescript
export async function GET() {
  const schedules = await getSchedules();
  return Response.json(schedules);
}

export async function POST(request: Request) {
  const data = await request.json();
  const schedule = await createSchedule(data);
  return Response.json(schedule);
}
```

`src/app/api/admin/sync/schedules/[scheduleId]/route.ts`:
```typescript
export async function GET/PUT/DELETE
```

`src/app/api/admin/sync/schedules/[scheduleId]/run/route.ts`:
```typescript
export async function POST(request: Request, { params }) {
  // Execute schedule immediately
  // Create log entry
  // Get clinics based on schedule scope
  // Run bulk sync
  // Update schedule lastRunAt, nextRunAt
}
```

`src/app/api/cron/sync/route.ts`:
```typescript
export async function POST(request: Request) {
  // Verify CRON_SECRET header
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get all due schedules
  const dueSchedules = await getDueSchedules();

  // Execute each
  for (const schedule of dueSchedules) {
    await executeSchedule(schedule);
  }

  return Response.json({ executed: dueSchedules.length });
}
```

**vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/sync",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Components:**

`src/components/admin/sync/sync-schedule-form.tsx`:
- Name input
- Frequency select (Manual, Daily, Weekly, Monthly)
- Scope select (All, Selected Clinics, By State, Missing Data)
- Clinic multi-select (when scope = selected)
- State filter (when scope = by_state)
- Field checkboxes (Reviews, Hours, Photos, Contact, Location)

`src/components/admin/sync/sync-schedule-list.tsx`:
- Table with columns: Name, Frequency, Next Run, Last Run, Status
- Actions: Edit, Run Now, Toggle Active, Delete

`src/components/admin/sync/sync-log-table.tsx`:
- Paginated table
- Columns: Date, Schedule, Status, Success/Error/Skipped, Duration
- Expandable rows for error details
- Filters: status, date range

**Page:** `src/app/admin/sync/page.tsx`
- Stats cards: Total Schedules, Active, Last 24h Syncs, Errors
- Tabs: Schedules | Logs
- Schedule list with Create button
- Log table with filters

**Modify:** `src/components/admin/admin-sidebar.tsx`
```typescript
// Add to navItems array:
{ href: "/admin/sync", label: "Places Sync", icon: RefreshCw },
```

---

## Phase 7: Polish & Error Handling

Final refinements, error handling improvements, and edge cases.

### Tasks

- [ ] Add loading states to all sync operations
- [ ] Add error boundaries to sync components
- [ ] Handle missing Place ID gracefully (prompt to add)
- [ ] Add confirmation dialogs for destructive actions
- [ ] Add toast notifications for sync success/failure
- [ ] Add retry logic for transient API failures
- [ ] Add circuit breaker for clinics with repeated failures
- [ ] Run lint and typecheck

### Technical Details

**Circuit Breaker Logic:**
- Track `consecutiveErrors` in clinicSyncStatus
- After 3 consecutive failures, skip clinic in bulk operations
- Show warning in UI for clinics with errors
- Allow manual reset of error count

**Toast Notifications:**
- Use existing toast system from shadcn/ui
- Success: "Synced 15 fields from Google Places"
- Error: "Sync failed: API rate limit exceeded"

**CLI Commands:**
```bash
pnpm lint
pnpm typecheck
```
