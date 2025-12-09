# Implementation Plan: Content Optimization & AI Enhancement System

## Overview

Build a complete content optimization system to enhance 5500+ clinic descriptions using Claude Sonnet 4. Includes database schema for versioning, AI processing with rate limiting, admin API routes with SSE streaming, and a full admin UI for batch management and content review.

---

## Phase 1: Database Schema ✅

Add optimization tracking tables for batch jobs and content versioning.

### Tasks

- [x] Create `optimization_batches` table for tracking batch jobs
  - [x] Add status field (pending, processing, paused, awaiting_review, completed, failed, cancelled)
  - [x] Add configuration fields (batchSize, reviewFrequency, targetWordCount)
  - [x] Add progress tracking (totalClinics, processedCount, successCount, errorCount)
  - [x] Add review tracking (pendingReviewCount, approvedCount, rejectedCount)
  - [x] Add cost tracking (totalInputTokens, totalOutputTokens, estimatedCost)
  - [x] Add execution state (currentOffset for resume, errors jsonb)
- [x] Create `content_versions` table for content history
  - [x] Add content fields (originalContent, optimizedContent)
  - [x] Add optimization metadata (keywordsUsed, faqGenerated, changesSummary)
  - [x] Add word counts (wordCountBefore, wordCountAfter)
  - [x] Add status tracking (pending, approved, rejected, applied, rolled_back)
  - [x] Add AI tracking (aiModel, promptVersion, inputTokens, outputTokens, cost)
  - [x] Add validation fields (validationPassed, validationWarnings, validationErrors)
  - [x] Add review tracking (reviewedAt, reviewedBy, reviewNotes)
- [x] Add indexes for common queries
- [x] Generate and run database migration

### Technical Details

**Files modified:**
- `src/lib/schema.ts` - Added `optimizationBatches` and `contentVersions` tables

**optimization_batches table schema:**
```typescript
export const optimizationBatches = pgTable("optimization_batches", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name"),
  status: text("status").default("pending"), // pending, processing, paused, awaiting_review, completed, failed, cancelled
  batchSize: integer("batch_size").default(50),
  reviewFrequency: integer("review_frequency").default(250),
  targetWordCount: integer("target_word_count").default(400),
  includeKeywords: boolean("include_keywords").default(true),
  generateFaq: boolean("generate_faq").default(true),
  faqCount: integer("faq_count").default(4),
  clinicFilters: jsonb("clinic_filters"), // { states?: string[], minReviewCount?: number, excludeOptimized?: boolean }
  totalClinics: integer("total_clinics").default(0),
  processedCount: integer("processed_count").default(0),
  successCount: integer("success_count").default(0),
  errorCount: integer("error_count").default(0),
  skippedCount: integer("skipped_count").default(0),
  pendingReviewCount: integer("pending_review_count").default(0),
  approvedCount: integer("approved_count").default(0),
  rejectedCount: integer("rejected_count").default(0),
  totalInputTokens: integer("total_input_tokens").default(0),
  totalOutputTokens: integer("total_output_tokens").default(0),
  estimatedCost: doublePrecision("estimated_cost").default(0),
  currentOffset: integer("current_offset").default(0),
  errors: jsonb("errors"),
  aiModel: text("ai_model").default("anthropic/claude-sonnet-4"),
  promptVersion: text("prompt_version").default("v1.0"),
  startedBy: text("started_by").references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  pausedAt: timestamp("paused_at"),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("optimization_batches_status_idx").on(table.status),
  index("optimization_batches_started_by_idx").on(table.startedBy),
]);
```

**content_versions table schema:**
```typescript
export const contentVersions = pgTable("content_versions", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  clinicId: text("clinic_id").notNull().references(() => clinics.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  originalContent: text("original_content"),
  optimizedContent: text("optimized_content"),
  keywordsUsed: jsonb("keywords_used"),
  faqGenerated: jsonb("faq_generated"),
  changesSummary: text("changes_summary"),
  wordCountBefore: integer("word_count_before"),
  wordCountAfter: integer("word_count_after"),
  status: text("status").default("pending"), // pending, approved, rejected, applied, rolled_back
  optimizationBatchId: text("optimization_batch_id").references(() => optimizationBatches.id),
  aiModel: text("ai_model"),
  promptVersion: text("prompt_version"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  cost: doublePrecision("cost"),
  validationPassed: boolean("validation_passed"),
  validationWarnings: jsonb("validation_warnings"),
  validationErrors: jsonb("validation_errors"),
  requiresManualReview: boolean("requires_manual_review").default(false),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by").references(() => user.id),
  reviewNotes: text("review_notes"),
  appliedAt: timestamp("applied_at"),
  appliedBy: text("applied_by").references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  optimizedAt: timestamp("optimized_at"),
}, (table) => [
  index("content_versions_clinic_idx").on(table.clinicId),
  index("content_versions_batch_idx").on(table.optimizationBatchId),
  index("content_versions_status_idx").on(table.status),
]);
```

**Migration commands:**
```bash
pnpm db:generate
pnpm db:push
```

---

## Phase 2: Core AI Processing ✅

Create utilities for AI-powered content optimization with rate limiting and validation.

### Tasks

- [x] Create AI prompt templates with versioning (`src/lib/ai/prompts.ts`)
  - [x] Define system prompt with preservation rules
  - [x] Define user prompt template with clinic data placeholders
  - [x] Support prompt versioning for reproducibility
- [x] Create rate limiter for OpenRouter API (`src/lib/ai/rate-limiter.ts`)
  - [x] Implement sliding window rate limiting (100 req/min)
  - [x] Implement exponential backoff retry logic
  - [x] Add cost calculation utilities
- [x] Create content validators (`src/lib/ai/validators.ts`)
  - [x] Extract and preserve doctor names
  - [x] Validate phone number preservation
  - [x] Check H3 tag structure preservation
  - [x] Validate address/location preservation
  - [x] Flag content requiring manual review
- [x] Create optimization service (`src/lib/ai/optimization-service.ts`)
  - [x] Implement single clinic optimization
  - [x] Integrate with OpenRouter via Vercel AI SDK
  - [x] Parse JSON response from AI
  - [x] Calculate and track costs
- [x] Create index file for exports (`src/lib/ai/index.ts`)

### Technical Details

**Files created:**
- `src/lib/ai/prompts.ts` - AI prompt templates
- `src/lib/ai/rate-limiter.ts` - Rate limiting for API calls
- `src/lib/ai/optimization-service.ts` - Core optimization logic
- `src/lib/ai/validators.ts` - Content validation rules
- `src/lib/ai/index.ts` - Module exports

**AI Prompt v1.0 System Prompt (key sections):**
```
## CRITICAL PRESERVATION RULES (NEVER MODIFY):
1. All doctor/practitioner names exactly as written
2. Geographic locations (city, state, street addresses, neighborhoods)
3. Phone numbers and contact information
4. Specific treatment names and procedures
5. H3 tags and their content structure
6. Medical certifications and credentials
7. Years of experience or establishment dates
8. Website URLs and links

## OPTIMIZATION GOALS:
1. Target word count: Reduce to approximately {targetWordCount} words
2. Integrate patient review keywords naturally into the content
3. Add FAQ questions relevant to pain management
4. Improve semantic structure for better search optimization
5. Maintain professional medical tone throughout
6. Remove verbose filler and redundant phrases
7. Make content more actionable and patient-focused

## OUTPUT FORMAT:
Return ONLY a valid JSON object with these exact fields:
{
  "optimizedContent": "The optimized HTML content with H3 tags preserved",
  "faqs": [{"question": "Patient question?", "answer": "Professional answer."}, ...],
  "keywordsIntegrated": ["keyword1", "keyword2"],
  "changesSummary": "Brief 1-2 sentence description of changes made"
}
```

**Rate Limiting Configuration:**
- Max 100 requests/minute with sliding window
- Auto-retry on 429 with exponential backoff (1s, 2s, 4s, 8s)
- Max 5 retry attempts
- Cost tracking: ~$0.015/clinic ($3/MTok input, $15/MTok output for Claude Sonnet 4)

**Cost calculation utility:**
```typescript
export function calculateCost(inputTokens: number, outputTokens: number, model: string): number {
  const rates = MODEL_PRICING[model] || { input: 3, output: 15 };
  return (inputTokens * rates.input + outputTokens * rates.output) / 1_000_000;
}
```

---

## Phase 3: API Routes ✅

Create admin-protected API endpoints for batch management and content review.

### Tasks

- [x] Create batch list/create endpoint (`src/app/api/admin/optimize/route.ts`)
  - [x] GET: List all batches with pagination
  - [x] POST: Create new batch with filters and configuration
- [x] Create batch detail endpoint (`src/app/api/admin/optimize/[batchId]/route.ts`)
  - [x] GET: Get batch details with content version stats
  - [x] DELETE: Cancel pending/paused batch
- [x] Create batch execution endpoint (`src/app/api/admin/optimize/[batchId]/execute/route.ts`) [complex]
  - [x] POST: Start/resume batch processing with SSE stream
  - [x] Implement clinic fetching with filters
  - [x] Integrate optimization service
  - [x] Auto-pause every 250 clinics for review
  - [x] Send progress events (status, batch_progress, clinic_progress, review_pause, error, complete)
- [x] Create batch pause endpoint (`src/app/api/admin/optimize/[batchId]/pause/route.ts`)
  - [x] POST: Pause running batch
- [x] Create batch rollback endpoint (`src/app/api/admin/optimize/[batchId]/rollback/route.ts`)
  - [x] POST: Rollback all applied content versions in batch
- [x] Create content review list endpoint (`src/app/api/admin/optimize/content/route.ts`)
  - [x] GET: List pending content versions with filters
- [x] Create single version endpoint (`src/app/api/admin/optimize/content/[versionId]/route.ts`)
  - [x] GET: Get full version details with original and optimized content
  - [x] PUT: Approve, reject, or apply content version
- [x] Create bulk actions endpoint (`src/app/api/admin/optimize/content/bulk/route.ts`)
  - [x] POST: Bulk approve, reject, or apply multiple versions

### Technical Details

**Route Structure:**
```
src/app/api/admin/optimize/
├── route.ts                      # GET: list batches, POST: create batch
├── [batchId]/
│   ├── route.ts                  # GET: batch detail, DELETE: cancel
│   ├── execute/route.ts          # POST: start/resume (SSE stream)
│   ├── pause/route.ts            # POST: pause batch
│   └── rollback/route.ts         # POST: rollback all applied changes
├── content/
│   ├── route.ts                  # GET: pending reviews list
│   ├── [versionId]/route.ts      # GET: single, PUT: approve/reject
│   └── bulk/route.ts             # POST: bulk approve/reject
```

**SSE Event Types:**
```typescript
// status - General status messages
{ event: "status", message: "Starting batch processing..." }

// batch_progress - Overall batch progress updates
{ event: "batch_progress", processedCount: 50, totalClinics: 500, successCount: 48, errorCount: 2 }

// clinic_progress - Individual clinic processing updates
{ event: "clinic_progress", clinicId: "xxx", clinicTitle: "ABC Pain Clinic", status: "success" }

// review_pause - Auto-pause notification at 250 interval
{ event: "review_pause", message: "Paused for review at 250 clinics", pendingReviewCount: 250 }

// error - Error messages
{ event: "error", clinicId: "xxx", error: "Rate limit exceeded" }

// complete - Batch completion notification
{ event: "complete", message: "Batch completed", stats: {...} }
```

**Admin check helper (used in all routes):**
```typescript
type AdminCheckResult =
  | { error: string; status: 401 | 403 }
  | { session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>; user: typeof schema.user.$inferSelect };

async function checkAdmin(): Promise<AdminCheckResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { error: "Unauthorized", status: 401 };

  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, session.user.id),
  });

  if (!user || user.role !== "admin") {
    return { error: "Forbidden - Admin access required", status: 403 };
  }

  return { session, user };
}
```

---

## Phase 4: Admin UI ✅

Build admin-protected UI for managing content optimization.

### Tasks

- [x] Update admin sidebar with Content Optimization nav item
- [x] Create optimization dashboard page (`src/app/admin/optimize/page.tsx`)
  - [x] Display stats cards (total batches, pending review, cost tracking)
  - [x] List recent batches with status badges
  - [x] Add "New Batch" button
- [x] Create new batch page (`src/app/admin/optimize/new/page.tsx`)
  - [x] Clinic filter selection (state, min reviews, exclude already optimized)
  - [x] Configuration options (batch size, review frequency, target words, FAQ count)
  - [x] Cost estimation display
  - [x] Preview clinic count before creation
- [x] Create batch detail page (`src/app/admin/optimize/[batchId]/page.tsx`) [complex]
  - [x] Display batch progress with live updates via SSE
  - [x] Show processing log with real-time entries
  - [x] Add control buttons (Start, Pause, Resume, Cancel, Rollback)
  - [x] Display error list if any
- [x] Create review queue page (`src/app/admin/optimize/review/page.tsx`) [complex]
  - [x] List pending content versions with filters
  - [x] Side-by-side diff view (original vs optimized)
  - [x] Display integrated keywords and generated FAQs
  - [x] Bulk selection and actions (approve all, reject all)
  - [x] Individual approve/reject buttons

### Technical Details

**Files created:**
- `src/app/admin/optimize/page.tsx` - Dashboard with stats and batch list
- `src/app/admin/optimize/new/page.tsx` - Batch creation form
- `src/app/admin/optimize/[batchId]/page.tsx` - Batch detail with SSE progress
- `src/app/admin/optimize/review/page.tsx` - Review queue with diff view

**Sidebar Update** (`src/components/admin/admin-sidebar.tsx`):
```typescript
import { Sparkles } from "lucide-react";

const navItems = [
  { href: "/admin/import", label: "Data Import", icon: Upload },
  { href: "/admin/optimize", label: "Content Optimization", icon: Sparkles },
  { href: "/admin/clinics", label: "Clinics", icon: Database },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
```

**SSE Progress Handling Pattern:**
```typescript
const startProcessing = async () => {
  const response = await fetch(`/api/admin/optimize/${batchId}/execute`, {
    method: "POST",
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data:")) {
        const data = JSON.parse(line.replace("data:", "").trim());
        // Handle different event types
        if (data.processedCount) setProgress(data);
        if (data.message) addLog(data);
        if (data.event === "review_pause") setIsPaused(true);
      }
    }
  }
};
```

---

## Phase 5: Processing Workflows (Documentation)

This phase documents the operational workflows for using the system.

### Batch Creation Workflow

1. Admin navigates to `/admin/optimize/new`
2. Admin selects clinic filters:
   - State filter (optional)
   - Minimum review count (optional)
   - Exclude already optimized clinics (checkbox)
3. Admin configures optimization settings:
   - Batch size: 50 (default)
   - Review frequency: 250 (pause every N clinics)
   - Target word count: 400
   - FAQ count: 4
4. System calculates total clinics and estimated cost
5. Admin clicks "Create Batch" → status: `pending`

### Batch Execution Workflow

1. Admin clicks "Start Processing" on batch detail page
2. SSE connection established for real-time updates
3. For each clinic (in batches of 50):
   - Extract top 5 review keywords from `reviewKeywords` field
   - Build prompt with clinic data (title, location, content, keywords)
   - Call Claude Sonnet 4 via OpenRouter
   - Parse JSON response
   - Create `content_versions` record with status `pending`
   - Update batch progress counters
4. Every 250 processed: auto-pause, send `review_pause` event
5. Admin reviews queue at `/admin/optimize/review`
6. Admin clicks "Resume" to continue processing

### Review Workflow

1. Admin navigates to `/admin/optimize/review`
2. Filter by batch or status
3. For each pending version:
   - View side-by-side original vs optimized
   - Check keywords integrated (highlighted)
   - Check FAQs generated
   - Verify validation passed (warnings shown)
4. Approve (status: `approved`) or Reject (status: `rejected`)
5. Use bulk actions for efficiency
6. "Apply Approved" updates `clinics.content` field

### Rollback Workflow

1. Navigate to batch detail page
2. Click "Rollback" button
3. For each applied version in batch:
   - Restore `originalContent` to `clinics.content`
   - Update version status to `rolled_back`
4. Update batch status

---

## Phase 6: Testing & Validation

Verify the optimization system works correctly.

### Tasks

- [ ] Test batch creation with various filters
- [ ] Test SSE streaming during execution
- [ ] Test auto-pause at 250 clinic intervals
- [ ] Test review workflow (approve/reject individual)
- [ ] Test bulk actions (approve all, reject all)
- [ ] Test apply approved content to clinics
- [ ] Test rollback functionality
- [ ] Test with 10-20 clinic sample batch
- [ ] Verify content validation catches issues
- [x] Run `pnpm lint && pnpm typecheck`

### Technical Details

**Sample test batch configuration:**
```json
{
  "name": "Test Batch - 20 Clinics",
  "clinicFilters": {
    "states": ["California"],
    "minReviewCount": 50,
    "excludeOptimized": true
  },
  "batchSize": 10,
  "reviewFrequency": 10,
  "targetWordCount": 400,
  "faqCount": 4
}
```

**Validation checklist:**

Content must preserve:
- [ ] Permalinks/slugs unchanged - No URL changes
- [ ] All doctor/practitioner names exactly as written
- [ ] City, state, street addresses
- [ ] Phone numbers
- [ ] H3 tag structure
- [ ] Treatment/procedure names
- [ ] Website URLs

Content should include:
- [ ] 3-5 review keywords integrated naturally
- [ ] 4 FAQ questions with answers
- [ ] Target ~400 words (300-500 acceptable)
- [ ] Semantic structure for search optimization

**Verification commands:**
```bash
pnpm lint
pnpm typecheck
```

---

## Files Summary

### Modified Files

| File | Change |
|------|--------|
| `src/lib/schema.ts` | Add `contentVersions`, `optimizationBatches` tables |
| `src/components/admin/admin-sidebar.tsx` | Add "Content Optimization" nav item |

### New Files Created

| Path | Purpose | Status |
|------|---------|--------|
| `src/lib/ai/prompts.ts` | AI prompt templates | ✅ |
| `src/lib/ai/rate-limiter.ts` | Rate limiting for API calls | ✅ |
| `src/lib/ai/optimization-service.ts` | Core optimization logic | ✅ |
| `src/lib/ai/validators.ts` | Content validation rules | ✅ |
| `src/lib/ai/index.ts` | Module exports | ✅ |
| `src/app/api/admin/optimize/route.ts` | Batch list/create API | ✅ |
| `src/app/api/admin/optimize/[batchId]/route.ts` | Batch detail API | ✅ |
| `src/app/api/admin/optimize/[batchId]/execute/route.ts` | SSE execution | ✅ |
| `src/app/api/admin/optimize/[batchId]/pause/route.ts` | Pause batch | ✅ |
| `src/app/api/admin/optimize/[batchId]/rollback/route.ts` | Rollback batch | ✅ |
| `src/app/api/admin/optimize/content/route.ts` | Review queue API | ✅ |
| `src/app/api/admin/optimize/content/[versionId]/route.ts` | Single version API | ✅ |
| `src/app/api/admin/optimize/content/bulk/route.ts` | Bulk actions API | ✅ |
| `src/app/admin/optimize/page.tsx` | Dashboard page | ✅ |
| `src/app/admin/optimize/new/page.tsx` | Batch creation page | ✅ |
| `src/app/admin/optimize/[batchId]/page.tsx` | Batch detail page | ✅ |
| `src/app/admin/optimize/review/page.tsx` | Review queue page | ✅ |

---

## Cost Estimate

- **5500 clinics × $0.015 = ~$82.50 total**
- Rate: ~100/min = ~55 minutes processing time
- Plus review pauses every 250 clinics (22 pause points)
- Estimated total time with reviews: 2-4 hours depending on review speed
