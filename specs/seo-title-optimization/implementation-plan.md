# Implementation Plan: SEO Title Optimization

## Overview

Update page titles across the Pain Clinics Directory to improve Google Search CTR and rankings after WordPress migration. Two main changes: clinic detail pages get location-enriched H1s, and the home page gets the proven WordPress title format with medical emoji.

## Phase 1: Clinic Detail Page Titles

Update the metadata title and H1 on clinic detail pages to use full state names and include location context in the H1.

### Tasks

- [x] Update metadata title in clinic page to use full state name
- [x] Update H1 in clinic-header component to include location context
- [x] Run lint and typecheck to verify changes

### Technical Details

**File 1: `src/app/pain-management/[...slug]/page.tsx`**

Line 265 - Current:
```typescript
const title = `${clinic.title} - Pain Management in ${clinic.city}, ${clinic.stateAbbreviation || clinic.state}`;
```

Change to:
```typescript
const stateName = getStateName(clinic.stateAbbreviation || clinic.state);
const title = `${clinic.title} - Pain Management in ${clinic.city}, ${stateName}`;
```

Note: `getStateName` is already imported on line 37 from `@/lib/us-states`.

Also update line 272 (description fallback) to use `stateName` instead of abbreviation:
```typescript
const description =
  cleanContent?.substring(0, 160) ||
  `${clinic.title} provides pain management services in ${clinic.city}, ${stateName}. Call ${clinic.phone} for appointments.`;
```

**File 2: `src/components/clinic/clinic-header.tsx`**

Add import at top of file:
```typescript
import { getStateName } from '@/lib/us-states';
```

Line 94 - Current:
```typescript
<h1 className="text-3xl font-bold tracking-tight">{clinic.name}</h1>
```

Change to:
```typescript
<h1 className="text-3xl font-bold tracking-tight">
  {clinic.name} - Pain Management in {clinic.address.city}, {getStateName(clinic.address.state)}
</h1>
```

**Verification command:**
```bash
pnpm lint && pnpm typecheck
```

## Phase 2: Home Page Title

Update the home page title to the WordPress format that had proven CTR performance, including the medical emoji.

### Tasks

- [x] Update default metadata title in root layout
- [x] Update OpenGraph title in root layout
- [x] Update Twitter card title in root layout
- [x] Run lint and typecheck to verify changes

### Technical Details

**File: `src/app/layout.tsx`**

The medical emoji unicode is `\u2695\uFE0F` (Staff of Asclepius ⚕️).

**Line 26 - Default title:**

Current:
```typescript
default: "Pain Clinics Directory - Find Pain Management Near You",
```

Change to:
```typescript
default: "Pain Management Near You: Painclinics.com - \u2695\uFE0F Local Pain Clinics",
```

**Line 45 - OpenGraph title:**

Current:
```typescript
title: "Pain Clinics Directory - Find Pain Management Near You",
```

Change to:
```typescript
title: "Pain Management Near You: Painclinics.com - \u2695\uFE0F Local Pain Clinics",
```

**Line 51 - Twitter title:**

Current:
```typescript
title: "Pain Clinics Directory - Find Pain Management Near You",
```

Change to:
```typescript
title: "Pain Management Near You: Painclinics.com - \u2695\uFE0F Local Pain Clinics",
```

**Verification command:**
```bash
pnpm lint && pnpm typecheck
```

## Phase 3: Verification

Verify the changes work correctly in development.

### Tasks

- [x] Check a clinic detail page H1 renders correctly
- [x] Check home page title appears in browser tab
- [x] Verify build succeeds

### Technical Details

**Verification steps:**
1. Start dev server: `pnpm dev`
2. Visit a clinic page (e.g., `/pain-management/al/birmingham/alabama-pain-physicians`)
3. Verify H1 shows: `{Clinic Name} - Pain Management in {City}, {State Name}`
4. Visit home page and check browser tab shows the new title with emoji
5. Run production build: `pnpm build`
