# Implementation Plan: Email Broadcast System

## Overview

Build an admin email broadcast system to send HTML emails to clinic listings. Leverages existing Mailgun integration, Tiptap editor, and Vercel Blob storage. Targets ~3,185 clinics with emails using Mailgun Foundation tier (300 emails/min).

## Phase 1: Database Schema & Core Service ✅

Set up the database table and core broadcast service logic.

### Tasks

- [x] Add `emailBroadcasts` table to schema.ts
- [x] Add `broadcastStatusEnum` enum (draft, sending, completed, failed)
- [x] Add `targetAudienceEnum` enum (all_with_email, featured_only, by_state, by_tier, custom)
- [x] Create broadcast-queries.ts with CRUD operations
- [x] Create clinic-targeting.ts for recipient filtering logic
- [x] Create broadcast-service.ts with batch sending logic
- [x] Run database migration with `pnpm db:push`

### Technical Details

**Schema definition** (`src/lib/schema.ts`):
```typescript
export const broadcastStatusEnum = pgEnum("broadcast_status", [
  "draft",
  "sending",
  "completed",
  "failed",
]);

export const targetAudienceEnum = pgEnum("target_audience", [
  "all_with_email",
  "featured_only",
  "by_state",
  "by_tier",
  "custom",
]);

export const emailBroadcasts = pgTable("email_broadcasts", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  previewText: text("preview_text"),
  htmlContent: text("html_content").notNull(),
  targetAudience: targetAudienceEnum("target_audience").default("all_with_email"),
  targetFilters: jsonb("target_filters"), // { states?: string[], tiers?: string[], excludeUnsubscribed?: boolean }
  attachments: jsonb("attachments"), // [{ url: string, filename: string, size: number }]
  status: broadcastStatusEnum("status").default("draft"),
  recipientCount: integer("recipient_count").default(0),
  sentCount: integer("sent_count").default(0),
  failedCount: integer("failed_count").default(0),
  openedCount: integer("opened_count").default(0),
  clickedCount: integer("clicked_count").default(0),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdBy: text("created_by").references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("broadcast_status_idx").on(table.status),
  index("broadcast_created_at_idx").on(table.createdAt),
]);
```

**File structure**:
```
src/lib/broadcast/
├── broadcast-queries.ts    # CRUD: create, get, update, delete, list
├── broadcast-service.ts    # sendBroadcast, sendTestEmail
└── clinic-targeting.ts     # getTargetClinics(filters) -> clinic emails
```

**Clinic targeting query** (clinic-targeting.ts):
```typescript
// Get clinics with emails, applying filters
export async function getTargetClinics(filters: TargetFilters): Promise<ClinicEmail[]> {
  // Base: clinics with non-empty emails array, published status
  // Filter by: states[], tiers[], featured only
  // Exclude: unsubscribed users (join with user table on ownerUserId)
  // Return: { clinicId, clinicName, email (first from array) }
}
```

**Batch sending** (broadcast-service.ts):
```typescript
const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 200; // ~250 emails/min, under 300/min limit

export async function sendBroadcast(broadcastId: string): Promise<void> {
  // 1. Get broadcast, validate status is draft
  // 2. Update status to "sending", set startedAt
  // 3. Get target clinics
  // 4. Loop in batches of 50, delay 200ms between
  // 5. For each email: call sendEmail(), log result, increment counts
  // 6. Update status to "completed" or "failed", set completedAt
}
```

**Migration command**:
```bash
pnpm db:push
```

---

## Phase 2: API Routes ✅

Create REST API endpoints for broadcast management.

### Tasks

- [x] Create POST /api/admin/broadcasts - Create new broadcast
- [x] Create GET /api/admin/broadcasts - List broadcasts with pagination
- [x] Create GET /api/admin/broadcasts/[id] - Get single broadcast
- [x] Create PATCH /api/admin/broadcasts/[id] - Update draft broadcast
- [x] Create DELETE /api/admin/broadcasts/[id] - Delete draft broadcast
- [x] Create POST /api/admin/broadcasts/[id]/test - Send test email
- [x] Create POST /api/admin/broadcasts/[id]/send - Start broadcast send
- [x] Create GET /api/admin/broadcasts/[id]/recipients - Get recipient list with status
- [x] Create GET /api/admin/broadcasts/preview-count - Get recipient count for filters

### Technical Details

**File structure**:
```
src/app/api/admin/broadcasts/
├── route.ts                    # GET (list), POST (create)
├── preview-count/route.ts      # GET (count recipients for filters)
└── [id]/
    ├── route.ts                # GET, PATCH, DELETE
    ├── test/route.ts           # POST (send test)
    ├── send/route.ts           # POST (start broadcast)
    └── recipients/route.ts     # GET (list recipients)
```

**All routes require admin auth**:
```typescript
import { checkAdminApi } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if (adminCheck.error) return adminCheck.error;
  // ... handler logic
}
```

**Preview count endpoint** (for live recipient count):
```typescript
// GET /api/admin/broadcasts/preview-count?audience=by_state&states=CA,NY
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const audience = searchParams.get("audience");
  const states = searchParams.get("states")?.split(",");
  const tiers = searchParams.get("tiers")?.split(",");

  const count = await getTargetClinicCount({ audience, states, tiers });
  return NextResponse.json({ count });
}
```

**Test email endpoint**:
```typescript
// POST /api/admin/broadcasts/[id]/test
// Body: { testEmail: "admin@example.com" }
export async function POST(request: NextRequest, { params }) {
  const { testEmail } = await request.json();
  await sendTestEmail(params.id, testEmail);
  return NextResponse.json({ success: true });
}
```

---

## Phase 3: Email Template ✅

Create the broadcast email template component.

### Tasks

- [x] Create BroadcastEmail template component in src/emails/
- [x] Include dynamic HTML content injection
- [x] Add responsive email layout wrapper
- [x] Add unsubscribe footer with token link
- [x] Add renderBroadcastEmail() function
- [x] Create sendBroadcastEmail() helper in email.ts

### Technical Details

**Template file** (`src/emails/broadcast-email.tsx`):
```typescript
import { EmailLayout, EmailCard, EmailButton } from "./components";

interface BroadcastEmailProps {
  subject: string;
  htmlContent: string;  // Raw HTML from Tiptap editor
  previewText?: string;
  unsubscribeUrl: string;
}

export function BroadcastEmail({
  subject,
  htmlContent,
  previewText,
  unsubscribeUrl
}: BroadcastEmailProps) {
  return (
    <EmailLayout previewText={previewText}>
      {/* Inject HTML content */}
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />

      {/* Unsubscribe footer */}
      <div style={{ marginTop: "32px", borderTop: "1px solid #eee", paddingTop: "16px" }}>
        <p style={{ fontSize: "12px", color: "#666" }}>
          You're receiving this because your clinic is listed on Pain Clinics Directory.
          <br />
          <a href={unsubscribeUrl} style={{ color: "#666" }}>Unsubscribe</a>
        </p>
      </div>
    </EmailLayout>
  );
}

export function renderBroadcastEmail(props: BroadcastEmailProps): string {
  return render(<BroadcastEmail {...props} />);
}
```

**Send helper** (add to `src/lib/email.ts`):
```typescript
export async function sendBroadcastEmail({
  to,
  subject,
  htmlContent,
  previewText,
  broadcastId,
  clinicId,
  attachments,
}: {
  to: string;
  subject: string;
  htmlContent: string;
  previewText?: string;
  broadcastId: string;
  clinicId?: string;
  attachments?: Array<{ url: string; filename: string }>;
}) {
  const unsubscribeUrl = getUnsubscribeUrl(await generateUnsubscribeToken());
  const html = renderBroadcastEmail({ subject, htmlContent, previewText, unsubscribeUrl });

  return sendEmail({
    to,
    subject,
    html,
    templateName: "broadcast",
    metadata: { broadcastId, clinicId },
    attachments,
  });
}
```

---

## Phase 4: Admin UI - List Page ✅

Create the broadcasts list page in admin.

### Tasks

- [x] Create /admin/broadcasts/page.tsx with broadcasts table
- [x] Add status badge component (draft/sending/completed/failed)
- [x] Add columns: name, status, recipients, sent/failed, created date
- [x] Add "New Broadcast" button linking to /admin/broadcasts/new
- [x] Add row actions (edit draft, view, duplicate, delete)
- [x] Add status filter tabs
- [x] Add link to admin sidebar navigation

### Technical Details

**File**: `src/app/admin/broadcasts/page.tsx`

**UI Components to use** (from shadcn/ui):
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
- `Badge` for status
- `Button` for actions
- `Tabs` for status filtering
- `DropdownMenu` for row actions

**Status badge colors**:
```typescript
const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sending: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};
```

**Add to admin sidebar** (`src/components/admin/admin-sidebar.tsx`):
```typescript
{ name: "Broadcasts", href: "/admin/broadcasts", icon: Mail }
```

---

## Phase 5: Admin UI - Create/Edit Form [complex] ✅

Build the broadcast creation form with rich text editor and recipient selector.

### Tasks

- [x] Create /admin/broadcasts/new/page.tsx
- [x] Create /admin/broadcasts/[id]/edit/page.tsx (reuse form component)
- [x] Create BroadcastForm component with Tiptap editor
  - [x] Subject line input
  - [x] Preview text input
  - [x] Tiptap rich text editor (reuse from blog)
  - [x] Auto-save functionality
- [x] Create RecipientSelector component
  - [x] Radio buttons for audience type
  - [x] State multi-select (when by_state selected)
  - [x] Tier checkboxes (when by_tier selected)
  - [x] Live recipient count display
- [x] Create AttachmentUploader component
  - [x] File upload to Vercel Blob
  - [x] Display uploaded files with remove option
  - [x] File type/size validation
- [x] Add Preview modal showing rendered email
- [x] Add Test Send button with email input
- [x] Add Send Now button with confirmation dialog

### Technical Details

**File structure**:
```
src/components/admin/broadcasts/
├── broadcast-form.tsx        # Main form wrapper
├── recipient-selector.tsx    # Audience filtering UI
├── attachment-uploader.tsx   # File upload component
├── broadcast-preview.tsx     # Email preview modal
└── send-confirmation.tsx     # Confirmation dialog
```

**Form state management**:
```typescript
interface BroadcastFormState {
  name: string;
  subject: string;
  previewText: string;
  htmlContent: string;
  targetAudience: "all_with_email" | "featured_only" | "by_state" | "by_tier" | "custom";
  targetFilters: {
    states?: string[];
    tiers?: string[];
    excludeUnsubscribed?: boolean;
  };
  attachments: Array<{ url: string; filename: string; size: number }>;
}
```

**Recipient count fetch** (debounced):
```typescript
// Fetch count when filters change
useEffect(() => {
  const fetchCount = debounce(async () => {
    const params = new URLSearchParams({
      audience: targetAudience,
      ...(targetFilters.states && { states: targetFilters.states.join(",") }),
      ...(targetFilters.tiers && { tiers: targetFilters.tiers.join(",") }),
    });
    const res = await fetch(`/api/admin/broadcasts/preview-count?${params}`);
    const { count } = await res.json();
    setRecipientCount(count);
  }, 300);
  fetchCount();
}, [targetAudience, targetFilters]);
```

**States list** (for multi-select):
```typescript
const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  // ... all 50 states
];
```

**Reuse Tiptap editor from blog**:
```typescript
import { TiptapEditor } from "@/components/admin/blog/tiptap-editor";
```

---

## Phase 6: Admin UI - View & Analytics ✅

Create the broadcast detail view with analytics.

### Tasks

- [x] Create /admin/broadcasts/[id]/page.tsx
- [x] Create BroadcastStats component showing delivery metrics
- [x] Create BroadcastRecipientList component with status per recipient
- [x] Add email preview section
- [x] Add "Duplicate" action button
- [x] Add pagination for recipient list

### Technical Details

**Stats display**:
```typescript
interface BroadcastStats {
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  deliveredCount: number;  // from emailLogs
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
}

// Calculate rates
const deliveryRate = (deliveredCount / sentCount) * 100;
const openRate = (openedCount / deliveredCount) * 100;
const clickRate = (clickedCount / openedCount) * 100;
```

**Recipient list query** (join with emailLogs):
```typescript
// Get recipients with their email delivery status
SELECT
  c.id as clinic_id,
  c.title as clinic_name,
  c.emails[1] as email,
  el.status,
  el.sent_at,
  el.delivered_at,
  el.opened_at
FROM clinics c
LEFT JOIN email_logs el ON el.metadata->>'clinicId' = c.id
  AND el.metadata->>'broadcastId' = $broadcastId
WHERE c.id IN (SELECT clinic_id FROM broadcast_recipients WHERE broadcast_id = $broadcastId)
```

**UI layout**:
- Top: Broadcast name, status badge, dates
- Middle: Stats cards in grid (Recipients, Sent, Delivered, Opened, Clicked, Bounced)
- Bottom left: Email preview
- Bottom right: Recipient table with status

---

## Phase 7: Integration & Polish ✅

Final integration, error handling, and UI polish.

### Tasks

- [x] Add error handling and toast notifications throughout
- [x] Add loading states for all async operations
- [x] Add empty states for lists
- [x] Test full flow: create -> preview -> test -> send -> view analytics
- [x] Run pnpm lint && pnpm typecheck
- [ ] Test with real Mailgun sends (small batch first)

### Technical Details

**Toast notifications** (using sonner, already installed):
```typescript
import { toast } from "sonner";

// Success
toast.success("Broadcast sent successfully!");

// Error
toast.error("Failed to send broadcast", { description: error.message });

// Loading
const toastId = toast.loading("Sending broadcast...");
// Later:
toast.success("Complete!", { id: toastId });
```

**Error boundary for broadcast pages**:
```typescript
// src/app/admin/broadcasts/error.tsx
"use client";
export default function BroadcastError({ error, reset }) {
  return (
    <div className="p-4">
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

**Validation commands**:
```bash
pnpm lint
pnpm typecheck
```
