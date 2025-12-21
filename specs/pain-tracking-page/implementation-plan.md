# Implementation Plan: Pain Tracking Template Page

## Overview

Build an SEO-optimized pain tracking resource page with email-gated PDF downloads. The page follows existing content page patterns (`pain-management-guide/page.tsx`) and uses shadcn/ui components.

## Phase 1: Database Setup ✅

Set up the database table to track resource downloads and email captures.

### Tasks

- [x] Add `resourceDownloads` table to schema
- [x] Generate and run database migration

### Technical Details

**Schema Addition** (`src/lib/schema.ts`):
```typescript
export const resourceDownloads = pgTable(
  "resource_downloads",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    email: text("email").notNull(),
    resourceName: text("resource_name").notNull(),
    source: text("source").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("resource_downloads_email_idx").on(table.email),
  ]
);
```

**Migration Commands**:
```bash
pnpm db:generate
pnpm db:push
```

---

## Phase 2: API Endpoint ✅

Create the API route to handle email capture and authorize downloads.

### Tasks

- [x] Create download API route at `src/app/api/resources/download/route.ts`
- [x] Implement email validation with Zod
- [x] Save email to database and return download URL

### Technical Details

**File**: `src/app/api/resources/download/route.ts`

**Request Schema**:
```typescript
const downloadSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  resourceName: z.enum(["pain-tracker-daily", "pain-tracker-weekly", "pain-tracker-monthly"]),
  source: z.string().default("pain-tracking-page"),
});
```

**Response**:
```json
{
  "success": true,
  "downloadUrl": "/templates/pain-tracker-daily.pdf"
}
```

**Pattern to follow**: `src/app/api/contact/general/route.ts`

---

## Phase 3: Download Component ✅

Build the client component with email gate functionality.

### Tasks

- [x] Create `src/app/pain-tracking/download-templates.tsx` client component
- [x] Build 3 template cards with Card, Badge, Button components
- [x] Implement Dialog modal for email capture form
- [x] Add localStorage check for returning users
- [x] Handle download initiation after email submission

### Technical Details

**File**: `src/app/pain-tracking/download-templates.tsx`

**Component Structure**:
```typescript
"use client";

// State
const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [email, setEmail] = useState("");
const [isSubmitting, setIsSubmitting] = useState(false);
const [hasAccess, setHasAccess] = useState(false);
```

**localStorage Key**: `pain_tracker_access`
```typescript
interface StoredAccess {
  email: string;
  timestamp: number;
}
// Check on mount, valid for 365 days
```

**Template Data**:
```typescript
const templates = [
  {
    id: "pain-tracker-daily",
    title: "Daily Pain Tracker",
    description: "Track pain hour-by-hour. Best for flare-ups and acute pain episodes.",
    filename: "pain-tracker-daily.pdf",
  },
  {
    id: "pain-tracker-weekly",
    title: "Weekly Pain Tracker",
    description: "Daily summary view. See patterns across the week at a glance.",
    filename: "pain-tracker-weekly.pdf",
  },
  {
    id: "pain-tracker-monthly",
    title: "Monthly Pain Tracker",
    description: "Long-term tracking. Ideal for chronic conditions and doctor visits.",
    filename: "pain-tracker-monthly.pdf",
  },
];
```

**UI Components**:
- `Card`, `CardHeader`, `CardContent`, `CardFooter` from shadcn/ui
- `Button` with `Download` icon from lucide-react
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` from shadcn/ui
- `Input` for email field
- `Badge` for template type labels

---

## Phase 4: Main Page Content ✅

Create the main page with all content sections and SEO optimization.

### Tasks

- [x] Create page at `src/app/pain-tracking/page.tsx`
- [x] Add SEO metadata export
- [x] Write intro section with hook
- [x] Add "Why Track Your Pain?" section
- [x] Add "What Should You Track?" section
- [x] Add "How to Use Your Pain Tracker" section
- [x] Import and place DownloadTemplates component
- [x] Create pain scale visual (inline SVG)
- [x] Add "Tips for Successful Pain Tracking" section
- [x] Add "When to Share Your Pain Log with a Doctor" section
- [x] Add FAQ accordion section
- [x] Add JSON-LD FAQ schema
- [x] Add internal links section
- [x] Add medical disclaimer Alert

### Technical Details

**File**: `src/app/pain-tracking/page.tsx`

**Metadata**:
```typescript
export const metadata: Metadata = {
  title: "Free Pain Tracking Template | Printable Pain Diary PDF",
  description: "Download free printable pain tracking templates. Daily, weekly, and monthly pain journals to log symptoms, triggers, and treatments for your doctor.",
  keywords: [
    "pain tracking template",
    "pain diary printable",
    "pain journal pdf",
    "free printable pain tracker",
    "daily pain journal template",
    "pain log for doctors"
  ],
};
```

**Page Structure** (follows `pain-management-guide/page.tsx`):
```tsx
<main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
  <div className="max-w-4xl mx-auto prose prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary prose-ol:text-foreground">
    {/* Content sections */}
  </div>
</main>
```

**FAQ Data**:
```typescript
const faqData = [
  {
    question: "How do I use a pain tracking template?",
    answer: "Record your pain level (1-10), location, duration, triggers, and any treatments used. Fill it out at the same time daily for consistency.",
  },
  {
    question: "What should I track in a pain diary?",
    answer: "Track pain intensity, location, time of day, triggers (food, activity, weather), medications taken, and what provides relief.",
  },
  {
    question: "Why should I track my pain?",
    answer: "Pain tracking helps identify patterns, triggers, and effective treatments. It provides valuable data for your doctor to optimize your care.",
  },
  {
    question: "Can I share my pain log with my doctor?",
    answer: "Yes! Bring your completed pain tracker to appointments. Doctors use this information to diagnose conditions, adjust treatments, and monitor progress.",
  },
  {
    question: "How often should I fill out a pain tracker?",
    answer: "For best results, complete your pain diary at least once daily, ideally at the same time. Track more frequently during flare-ups.",
  },
];
```

**JSON-LD Schema** (using existing utility):
```tsx
import { generateFAQStructuredData } from "@/lib/structured-data";

// In component:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(generateFAQStructuredData(faqData)),
  }}
/>
```

**Pain Scale Visual** (inline SVG with colors):
- 1-2: Mild (green `#22c55e`)
- 3-4: Moderate (yellow `#eab308`)
- 5-6: Significant (orange `#f97316`)
- 7-8: Severe (red `#ef4444`)
- 9-10: Extreme (dark red `#991b1b`)

**Internal Links**:
- `/clinics` - Clinic directory
- `/pain-management-guide` - Pain management guide
- `/treatment-options` - Treatment options

---

## Phase 5: Static Assets & Verification ✅

Set up placeholder PDFs and verify implementation.

### Tasks

- [x] Create `public/templates/` directory
- [x] Add placeholder PDF files for testing
- [x] Run lint and typecheck
- [x] Test full user flow (email gate → download)

### Technical Details

**Directory**: `public/templates/`

**Placeholder PDFs**:
- `pain-tracker-daily.pdf`
- `pain-tracker-weekly.pdf`
- `pain-tracker-monthly.pdf`

These are placeholders - user will replace with designed PDFs.

**Verification Commands**:
```bash
pnpm lint
pnpm typecheck
```

**Test Flow**:
1. Navigate to `/pain-tracking`
2. Scroll to download section
3. Click download button → Dialog opens
4. Enter email → Submit
5. Verify email saved to DB
6. Verify download initiates
7. Refresh page → Click download → Should bypass dialog (localStorage)

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/schema.ts` | Modify | Add resourceDownloads table |
| `src/app/api/resources/download/route.ts` | Create | Email capture API |
| `src/app/pain-tracking/download-templates.tsx` | Create | Email gate client component |
| `src/app/pain-tracking/page.tsx` | Create | Main page with content |
| `public/templates/*.pdf` | Create | Placeholder PDF files |
