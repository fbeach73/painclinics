# Implementation Plan: Code Consolidation & Cleanup

## Overview

Consolidate duplicate code discovered during the post-implementation review. This cleanup addresses duplications in utility functions, query functions, and authentication modules that accumulated during multi-phase development by different developers.

## Phase 1: Shared Utility Functions

Consolidate the duplicate `sleep()` function and add it to the shared utilities.

### Tasks

- [x] Add `sleep()` utility function to `src/lib/utils.ts`
- [x] Update `src/lib/google-places/rate-limiter.ts` to import from `@/lib/utils`
- [x] Update `src/lib/sync/sync-service.ts` to import from `@/lib/utils`
- [x] Update `src/lib/ai/rate-limiter.ts` to import from `@/lib/utils`
- [x] Remove local `sleep()` implementations from all three files
- [x] Run typecheck to verify no breaking changes

### Technical Details

**Add to `src/lib/utils.ts`:**
```typescript
/**
 * Sleep utility for async delays
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

**Files to update:**
- `src/lib/google-places/rate-limiter.ts:121-123` - Remove private sleep method, add import
- `src/lib/sync/sync-service.ts:585-587` - Remove standalone function, add import
- `src/lib/ai/rate-limiter.ts:151-153` - Remove private sleep method, add import

**Import statement:**
```typescript
import { sleep } from "@/lib/utils";
```

---

## Phase 2: Consolidate getClinicById Functions

Merge the two `getClinicById` implementations into a single function with optional relations.

### Tasks

- [x] Add `includeRelations` parameter to `getClinicById` in `src/lib/clinic-queries.ts`
- [x] Update `getClinicById` to use Drizzle query API with optional `with` clause
- [x] Export necessary types from `src/lib/clinic-queries.ts`
- [x] Remove duplicate `getClinicById` from `src/lib/owner-queries.ts`
- [x] Update all imports that used `owner-queries.getClinicById` to use `clinic-queries`
- [x] Run typecheck to verify no breaking changes

### Technical Details

**Current duplicates:**
1. `src/lib/clinic-queries.ts:203-211` - Basic version using `db.select()`
2. `src/lib/owner-queries.ts:69-83` - Includes relations using `db.query.clinics.findFirst()`

**New consolidated function in `src/lib/clinic-queries.ts`:**
```typescript
interface GetClinicByIdOptions {
  includeRelations?: boolean;
}

/**
 * Fetch a single clinic by its ID.
 * @param id - The clinic ID
 * @param options - Optional configuration
 * @param options.includeRelations - Include clinicServices and owner relations
 * @returns The clinic record or null if not found
 */
export async function getClinicById(
  id: string,
  options: GetClinicByIdOptions = {}
) {
  const { includeRelations = false } = options;

  if (includeRelations) {
    return db.query.clinics.findFirst({
      where: eq(clinics.id, id),
      with: {
        clinicServices: {
          with: {
            service: true,
          },
        },
        owner: true,
      },
    });
  }

  const results = await db
    .select()
    .from(clinics)
    .where(eq(clinics.id, id))
    .limit(1);

  return results[0] || null;
}
```

**Files that import from owner-queries.getClinicById:**
- Check and update any files importing `getClinicById` from `@/lib/owner-queries`

**Backward compatibility:**
- Default behavior (no options) matches current `clinic-queries` version
- `{ includeRelations: true }` matches current `owner-queries` version

---

## Phase 3: Remove Duplicate Auth Session

Remove the redundant `auth-session.ts` file and update any references.

### Tasks

- [x] Search for all imports of `authSession` from `@/lib/auth-session`
- [x] Update any references to use `auth` from `@/lib/auth` instead
- [x] Delete `src/lib/auth-session.ts`
- [x] Run typecheck to verify no breaking changes

### Technical Details

**File to delete:** `src/lib/auth-session.ts`

**Current content creates duplicate Better Auth instance:**
```typescript
// This creates a SECOND betterAuth instance unnecessarily
export const authSession = betterAuth({
  // ... duplicate configuration
})
```

**Search command:**
```bash
grep -r "auth-session" src/
grep -r "authSession" src/
```

**Replacement:**
```typescript
// Before
import { authSession } from "@/lib/auth-session";
const session = await authSession.api.getSession({ headers: await headers() });

// After
import { auth } from "@/lib/auth";
const session = await auth.api.getSession({ headers: await headers() });
```

**Note:** The main `auth` from `src/lib/auth.ts` already handles session checking efficiently. The "lightweight" version provides no benefit and creates confusion.

---

## Phase 4: Consolidate Auth Helper Files

Merge session helper functionality into a cleaner structure.

### Tasks

- [x] Review functions in `src/lib/session.ts` and `src/lib/admin-auth.ts`
- [x] Keep `src/lib/admin-auth.ts` for API route admin checks (well-scoped)
- [x] Rename `src/lib/session.ts` to clarify its purpose as route protection helpers
- [x] Add JSDoc comments to clarify when to use which file
- [x] Run typecheck to verify no breaking changes

### Technical Details

**Current auth-related files:**
1. `src/lib/auth.ts` - Better Auth configuration (keep as-is)
2. `src/lib/auth-client.ts` - Client-side auth hooks (keep as-is)
3. `src/lib/session.ts` - Server component session helpers
4. `src/lib/admin-auth.ts` - API route admin auth checks

**Recommendation:**
- Keep `admin-auth.ts` - it's well-scoped for API routes
- Keep `session.ts` - it has useful helpers like `requireAuth`, `requireAdmin`, `requireOwner`
- Add clear JSDoc headers explaining when to use each:

**Add to top of `src/lib/session.ts`:**
```typescript
/**
 * Server Component Auth Helpers
 *
 * Use these functions in Server Components (pages, layouts) for:
 * - requireAuth() - Redirect to home if not authenticated
 * - requireAdmin() - Redirect if not admin
 * - requireOwner() - Redirect if not clinic owner or admin
 * - requireClinicOwnership() - Verify user owns specific clinic
 * - getOptionalSession() - Get session without requiring auth
 *
 * For API Routes, use @/lib/admin-auth instead.
 */
```

**Add to top of `src/lib/admin-auth.ts`:**
```typescript
/**
 * API Route Auth Helpers
 *
 * Use these functions in API Routes (route.ts files) for:
 * - checkAdminApi() - Returns session/user or error object
 * - adminErrorResponse() - Helper to create error Response
 *
 * For Server Components (pages), use @/lib/session instead.
 */
```

---

## Phase 5: Clean Up Pain Tracking Component

Extract duplicate download logic in the download-templates component.

### Tasks

- [x] Extract download trigger logic into `triggerDownload` helper function
- [x] Update `initiateDownload` to use the helper
- [x] Update `handleSubmit` success path to use the helper
- [x] Verify component still works correctly

### Technical Details

**File:** `src/app/pain-tracking/download-templates.tsx`

**Current duplication:**
- Lines 101-136: `initiateDownload()` function
- Lines 177-186: Same download logic repeated in `handleSubmit()`

**Extract helper function:**
```typescript
/**
 * Trigger a file download via programmatic link click
 */
function triggerDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

**Update `initiateDownload`:**
```typescript
const initiateDownload = async (templateId: string) => {
  const template = templates.find((t) => t.id === templateId);
  if (!template) return;

  try {
    const response = await fetch("/api/resources/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        resourceName: templateId,
        source: "pain-tracking-page",
      }),
    });

    const data = await response.json();

    if (data.success && data.downloadUrl) {
      triggerDownload(data.downloadUrl, template.filename);
    }
  } catch {
    // Fallback to direct download
    triggerDownload(`/templates/${template.filename}`, template.filename);
  }
};
```

**Update `handleSubmit` success path (around line 177):**
```typescript
// Trigger download
if (data.downloadUrl) {
  const template = templates.find((t) => t.id === selectedTemplate);
  if (template) {
    triggerDownload(data.downloadUrl, template.filename);
  }
}
```

---

## Phase 6: Final Verification

Run all checks to ensure nothing is broken.

### Tasks

- [x] Run `pnpm lint` and fix any issues
- [x] Run `pnpm typecheck` and fix any type errors
- [ ] Verify the dev server starts without errors (manual)
- [ ] Test pain tracking page downloads still work (manual)
- [ ] Test admin clinic sync functionality still works (manual)

### Technical Details

**Commands to run:**
```bash
pnpm lint
pnpm typecheck
```

**Manual verification:**
1. Visit `/pain-tracking` and test template downloads
2. Visit `/admin/clinics/[id]` and test sync functionality
3. Check that protected routes still require auth
