# Implementation Plan: Lead Follow-up System

## Overview

Build an admin leads management system with database storage, list/detail pages, follow-up email capability, and notes tracking. Follows existing admin patterns (claims, broadcasts).

---

## Phase 1: Database Schema

Add the `clinic_leads` table to store all contact form submissions.

### Tasks

- [x] Add `leadStatusEnum` to schema.ts
- [x] Add `clinicLeads` table to schema.ts
- [x] Add `clinicLeadsRelations` for clinic and emailLogs relationships
- [x] Update `clinicsRelations` to include leads
- [x] Run `pnpm db:push` to apply schema changes

### Technical Details

**Enum Definition:**
```typescript
export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "qualified",
  "closed",
]);
```

**Table Schema:**
```typescript
export const clinicLeads = pgTable(
  "clinic_leads",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    clinicId: text("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),

    // Patient Information
    patientName: text("patient_name").notNull(),
    patientEmail: text("patient_email").notNull(),
    patientPhone: text("patient_phone").notNull(),
    preferredContactTime: text("preferred_contact_time").notNull(),
    additionalInfo: text("additional_info"),

    // Medical Intake
    painType: text("pain_type").notNull(),
    painDuration: text("pain_duration").notNull(),
    previousTreatment: text("previous_treatment").notNull(),
    insurance: text("insurance").notNull(),

    // Full form data for reference
    formData: jsonb("form_data"),

    // Status Management
    status: leadStatusEnum("status").default("new").notNull(),

    // Follow-up Tracking
    followedUpAt: timestamp("followed_up_at"),
    followUpDate: timestamp("follow_up_date"),

    // Admin Notes
    adminNotes: text("admin_notes"),

    // Email Log References
    clinicEmailLogId: text("clinic_email_log_id").references(() => emailLogs.id),
    patientEmailLogId: text("patient_email_log_id").references(() => emailLogs.id),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => [
    index("clinic_leads_clinic_idx").on(table.clinicId),
    index("clinic_leads_status_idx").on(table.status),
    index("clinic_leads_created_at_idx").on(table.createdAt),
    index("clinic_leads_patient_email_idx").on(table.patientEmail),
    index("clinic_leads_followed_up_at_idx").on(table.followedUpAt),
  ]
);
```

**Relations:**
```typescript
export const clinicLeadsRelations = relations(clinicLeads, ({ one }) => ({
  clinic: one(clinics, {
    fields: [clinicLeads.clinicId],
    references: [clinics.id],
  }),
  clinicEmailLog: one(emailLogs, {
    fields: [clinicLeads.clinicEmailLogId],
    references: [emailLogs.id],
  }),
  patientEmailLog: one(emailLogs, {
    fields: [clinicLeads.patientEmailLogId],
    references: [emailLogs.id],
  }),
}));
```

---

## Phase 2: Query Functions

Create the data access layer for leads.

### Tasks

- [x] Create `src/lib/lead-queries.ts` with types and interfaces
- [x] Implement `createLead()` function
- [x] Implement `getLeadById()` with clinic and emailLog joins
- [x] Implement `getLeads()` with filtering and pagination
- [x] Implement `getLeadsCountByStatus()` for filter tabs
- [x] Implement `getLeadsNeedingFollowUp()` with business day calculation
- [x] Implement update functions: `updateLeadStatus()`, `updateLeadNotes()`, `markLeadFollowedUp()`
- [x] Add `addBusinessDays()` utility function

### Technical Details

**File:** `src/lib/lead-queries.ts`

**Types:**
```typescript
import { clinicLeads, clinics, emailLogs, leadStatusEnum } from "./schema";

export type Lead = typeof clinicLeads.$inferSelect;
export type LeadStatus = (typeof leadStatusEnum.enumValues)[number];

export interface LeadWithDetails extends Lead {
  clinic: {
    id: string;
    title: string;
    city: string;
    stateAbbreviation: string;
    emails: string[] | null;
  };
  clinicEmailLog: typeof emailLogs.$inferSelect | null;
  patientEmailLog: typeof emailLogs.$inferSelect | null;
}

export interface CreateLeadData {
  clinicId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  preferredContactTime: string;
  additionalInfo?: string;
  painType: string;
  painDuration: string;
  previousTreatment: string;
  insurance: string;
  formData?: Record<string, unknown>;
  clinicEmailLogId?: string;
  patientEmailLogId?: string;
}

export interface GetLeadsOptions {
  status?: LeadStatus | "all" | "needs_followup";
  limit?: number;
  offset?: number;
}
```

**Business Day Calculation:**
```typescript
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip Sat/Sun
      addedDays++;
    }
  }

  return result;
}

export function needsFollowUp(lead: Lead): boolean {
  if (lead.followedUpAt) return false;
  if (lead.status === "qualified" || lead.status === "closed") return false;

  const followUpDueDate = addBusinessDays(new Date(lead.createdAt), 2);
  return new Date() > followUpDueDate;
}
```

---

## Phase 3: Contact API Modification

Modify the contact form API to create lead records.

### Tasks

- [x] Import `createLead` in `/api/contact/route.ts`
- [x] Capture email log IDs from sendEmail responses
- [x] Call `createLead()` after successful email sends
- [x] Handle errors gracefully (don't fail form submission if lead creation fails)

### Technical Details

**File:** `src/app/api/contact/route.ts`

**Modification (after existing email sends):**
```typescript
// After sending emails, create lead record
try {
  await createLead({
    clinicId: data.clinicId,
    patientName: data.name,
    patientEmail: data.email,
    patientPhone: data.phone,
    preferredContactTime: data.preferredContactTime,
    additionalInfo: data.additionalInfo || null,
    painType: data.painType,
    painDuration: data.painDuration,
    previousTreatment: data.previousTreatment,
    insurance: data.insurance,
    formData: data,
    clinicEmailLogId: clinicEmailResult?.logId,
    patientEmailLogId: patientEmailResult?.logId,
  });
} catch (error) {
  console.error("Failed to create lead record:", error);
  // Don't fail the request - emails were sent successfully
}
```

**Note:** The email sending functions need to return the `logId` from `createEmailLog()`. Check if this is already returned or needs to be added.

---

## Phase 4: Admin API Routes

Create API routes for admin lead management.

### Tasks

- [x] Create `src/app/api/admin/leads/route.ts` (GET list)
- [x] Create `src/app/api/admin/leads/[leadId]/route.ts` (GET single, PATCH update)
- [x] Create `src/app/api/admin/leads/[leadId]/follow-up/route.ts` (POST send follow-up email)
- [x] Add admin auth check to all routes

### Technical Details

**GET `/api/admin/leads`:**
- Query params: `status`, `limit`, `offset`
- Returns: `{ leads: Lead[], total: number, counts: Record<string, number> }`

**GET `/api/admin/leads/[leadId]`:**
- Returns: `LeadWithDetails` (includes clinic and emailLog joins)

**PATCH `/api/admin/leads/[leadId]`:**
- Body: `{ status?, adminNotes?, followUpDate? }`
- Returns: Updated lead

**POST `/api/admin/leads/[leadId]/follow-up`:**
- Body: `{ message: string }`
- Sends email to clinic via Mailgun
- Sets `followedUpAt` to current timestamp
- Logs email to emailLogs table
- Returns: `{ success: true, emailLogId: string }`

---

## Phase 5: Follow-up Email Template

Create the email template for follow-up messages.

### Tasks

- [x] Create `src/emails/lead-follow-up.tsx` React Email component
- [x] Add template to `src/emails/index.ts` exports
- [x] Add `LEAD_FOLLOW_UP` to `EMAIL_TEMPLATES` constant

### Technical Details

**File:** `src/emails/lead-follow-up.tsx`

**Props:**
```typescript
interface LeadFollowUpEmailProps {
  clinicName: string;
  clinicCity: string;
  clinicState: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  submissionDate: string;
  customMessage: string;
}
```

**Template Content:**
- Subject: "Follow-up: Patient Inquiry from PainClinics.com"
- From: hello@painclinics.com
- Body:
  - Greeting with clinic name
  - Reference to original inquiry (patient name, date)
  - Custom message from admin
  - Request to confirm receipt or provide correct email
  - Contact info for PainClinics.com support

---

## Phase 6: Admin Leads List Page [complex]

Create the main leads list page with filtering.

### Tasks

- [x] Create `src/app/admin/leads/page.tsx` with data fetching
- [x] Create `src/app/admin/leads/leads-filter-tabs.tsx` component
- [x] Create `src/app/admin/leads/leads-table.tsx` component
- [x] Add empty state for no leads
- [x] Add "needs follow-up" visual indicator (warning badge)

### Technical Details

**File:** `src/app/admin/leads/page.tsx`

**Structure (following claims page pattern):**
```typescript
interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status || "all";

  const [leads, counts] = await Promise.all([
    getLeads({ status: statusFilter as LeadStatus | "all" | "needs_followup", limit: 50 }),
    getLeadsCountByStatus(),
  ]);

  // Render: Header → Filter Tabs → Table
}
```

**Filter Tabs:**
- All (total count)
- Needs Follow-up (2+ business days, not followed up)
- New
- Contacted
- Qualified
- Closed

**Table Columns:**
1. Date Submitted (createdAt, formatted)
2. Clinic (name, linked to `/admin/clinics/[id]`)
3. Patient Name
4. Email
5. Status (badge)
6. Follow-up (warning icon if needs follow-up, check if done, date if scheduled)

---

## Phase 7: Lead Detail Page [complex]

Create the lead detail view with all information and actions.

### Tasks

- [x] Create `src/app/admin/leads/[leadId]/page.tsx` layout
- [x] Create clinic info card component
- [x] Create patient info card component
- [x] Create medical intake card component
- [x] Create email delivery status display
- [x] Create `src/app/admin/leads/[leadId]/follow-up-form.tsx` component
- [x] Create status update dropdown
- [x] Create notes textarea with save functionality

### Technical Details

**File:** `src/app/admin/leads/[leadId]/page.tsx`

**Layout (2-column grid):**
```
┌─────────────────────┬─────────────────────┐
│   Clinic Info       │   Patient Info      │
│   - Name, location  │   - Name, email     │
│   - Link to admin   │   - Phone, time     │
├─────────────────────┼─────────────────────┤
│   Submission Info   │   Medical Intake    │
│   - Date submitted  │   - Pain type       │
│   - Email status    │   - Duration        │
│                     │   - Treatment, ins  │
├─────────────────────┴─────────────────────┤
│   Follow-up Section                       │
│   - Status dropdown  - Send email button  │
│   - Email compose textarea                │
│   - Follow-up history                     │
├───────────────────────────────────────────┤
│   Admin Notes                             │
│   - Textarea with save                    │
│   - Last updated timestamp                │
└───────────────────────────────────────────┘
```

**Follow-up Form:**
- Textarea for custom message (pre-filled with template)
- "Send Follow-up Email" button
- Shows loading state while sending
- Success toast on send
- Auto-refreshes to show followedUpAt timestamp

**Status Dropdown:**
- Uses shadcn Select component
- Options: New, Contacted, Qualified, Closed
- Updates via PATCH to API
- Shows loading state

**Notes Section:**
- Textarea with adminNotes value
- Save button (or auto-save on blur)
- Shows "Last updated" if notes exist

---

## Phase 8: Navigation

Add leads to admin sidebar.

### Tasks

- [x] Add "Leads" link to `src/app/admin/layout.tsx` sidebar navigation
- [x] Use appropriate icon (e.g., `MessageSquare` or `Users`)
- [x] Position after Claims in navigation order

### Technical Details

**File:** `src/app/admin/layout.tsx`

**Add to sidebar navigation array:**
```typescript
{
  name: "Leads",
  href: "/admin/leads",
  icon: MessageSquare, // or Users from lucide-react
}
```

---

## File Summary

**New Files:**
- `src/lib/lead-queries.ts`
- `src/emails/lead-follow-up.tsx`
- `src/app/api/admin/leads/route.ts`
- `src/app/api/admin/leads/[leadId]/route.ts`
- `src/app/api/admin/leads/[leadId]/follow-up/route.ts`
- `src/app/admin/leads/page.tsx`
- `src/app/admin/leads/leads-filter-tabs.tsx`
- `src/app/admin/leads/leads-table.tsx`
- `src/app/admin/leads/[leadId]/page.tsx`
- `src/app/admin/leads/[leadId]/follow-up-form.tsx`

**Modified Files:**
- `src/lib/schema.ts` (add enum, table, relations)
- `src/app/api/contact/route.ts` (create lead after emails)
- `src/emails/index.ts` (add follow-up template export)
- `src/app/admin/layout.tsx` (add sidebar link)

---

## Verification

1. Submit a test contact form → verify lead appears in `/admin/leads`
2. Check filter tabs show correct counts
3. Verify "Needs Follow-up" filter shows leads 2+ business days old
4. Click lead → verify detail page shows all form data
5. Send follow-up email → verify it sends and marks lead as followed up
6. Add notes → verify they save and persist
7. Check email delivery status displays correctly (delivered/opened/bounced)
8. Run `pnpm lint && pnpm typecheck` after all changes
