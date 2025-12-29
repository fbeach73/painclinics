# Requirements: SEO Title Optimization

## Background

After migrating from WordPress to Vercel/Next.js, the site is experiencing:
- Drop in Click-Through Rate (CTR)
- Loss of "average position" rankings built up with Google Search

The goal is to restore SEO performance by matching the title formats that worked well on WordPress.

## Requirements

### 1. Clinic Detail Page Titles

Update both the metadata `<title>` and visible `<h1>` to use this format:

```
{Clinic Name} - Pain Management in {City}, {Full State Name}
```

**Examples:**
- Southern Pain Institute - Pain Management in Smyrna, Tennessee
- Kentucky Spine and Pain Care - Pain Management in London, Kentucky

**Key changes:**
- H1 currently only shows clinic name - must include full location context
- Use full state name (e.g., "Tennessee") instead of abbreviation (e.g., "TN")

### 2. Home Page Title

Update the home page title to match the WordPress format that had good CTR:

```
Pain Management Near You: Painclinics.com - ⚕️ Local Pain Clinics
```

**Target keywords:**
- "pain management near me"
- "pain clinics near me"
- "local pain clinics"

**Note:** The medical emoji (Staff of Asclepius ⚕️) helped with CTR in search results.

## Acceptance Criteria

- [ ] Clinic detail pages display H1 with format: `{Name} - Pain Management in {City}, {State}`
- [ ] Clinic detail page metadata title matches the H1 format
- [ ] Clinic titles use full state names, not abbreviations
- [ ] Home page title is: "Pain Management Near You: Painclinics.com - ⚕️ Local Pain Clinics"
- [ ] OpenGraph and Twitter card titles match the home page title
- [ ] All changes pass lint and typecheck

## Dependencies

- `getStateName()` utility from `@/lib/us-states` (already exists)
