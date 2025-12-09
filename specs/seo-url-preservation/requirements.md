# Requirements: SEO/URL Preservation

## Overview

Preserve WordPress URL structure during Next.js migration to protect organic Google rankings and AdSense revenue. The site generates significant revenue from organic traffic, with pages ranking on Google page 1 (position 3) for searches like "Alabama Pain Physicians Birmingham."

## Problem Statement

- WordPress URLs use `/pain-management/{clinic-slug}/` format
- Current Next.js implementation routes to `/clinics/[clinicId]` using mock data
- No dynamic sitemap exists for the 4,575+ clinic pages
- No SEO metadata, structured data, or canonical URLs are implemented
- URL changes would devastate rankings and revenue

## WordPress URL Format

URLs follow this pattern:
```
/pain-management/{clinic-name}-{city-if-not-in-name}-{state-abbrev}-{postal-code}/
```

Examples:
- `/pain-management/alabama-pain-physicians-birmingham-al-35243/`
- `/pain-management/nesbitt-pain-associates-pc-al-35205/`
- `/pain-management/tennessee-valley-pain-consultants-huntsville-hospital-pain-center-al-35801/`

## Functional Requirements

### FR1: URL Preservation
- Create `/pain-management/[slug]` dynamic route matching WordPress URLs exactly
- Case-insensitive URL matching (redirect uppercase to lowercase)
- Trailing slash normalization (prefer with trailing slash, 301 redirect without)
- 301 redirect from legacy `/clinics/[slug]` to `/pain-management/[slug]/`

### FR2: Dynamic SEO Metadata
- Per-clinic title: `{Title} - Pain Management in {City}, {State}`
- Meta description: First 160 characters of content
- Canonical URL pointing to exact permalink
- Open Graph tags for social sharing

### FR3: Structured Data
- Schema.org MedicalBusiness/LocalBusiness markup on every clinic page
- Include: name, address, geo coordinates, phone, rating, hours
- Validate with Google Rich Results Test

### FR4: Dynamic Sitemap
- Generate sitemap.xml with all 4,575+ clinic URLs
- Include `lastModified` from database `updatedAt` field
- Set appropriate priority and changeFrequency
- Split into multiple sitemaps if exceeding 50,000 URLs

### FR5: Location Landing Pages (Optional)
- State pages: `/pain-management/{state}/`
- City pages: `/pain-management/{state}/{city}/`
- Aggregate clinic listings with local SEO optimization

### FR6: Admin URL Validation
- Tool to verify all permalinks match expected format
- Identify duplicates or malformed URLs
- Report generation for pre-launch validation

## Non-Functional Requirements

### NFR1: Performance
- Database queries must be optimized with proper indexes
- Sitemap generation should handle 5,500+ entries efficiently
- Page load under 3 seconds on mobile

### NFR2: SEO Compliance
- Valid robots.txt with sitemap reference
- Proper 404 handling for missing clinics
- No redirect chains (max 1 hop to final URL)

## Acceptance Criteria

1. `/pain-management/alabama-pain-physicians-birmingham-al-35243/` returns correct clinic data
2. `/Pain-Management/...` (uppercase) redirects 301 to lowercase
3. `/pain-management/slug` (no trailing slash) redirects 301 to `/pain-management/slug/`
4. `/clinics/slug` redirects 301 to `/pain-management/slug/`
5. Sitemap.xml contains all 4,575+ clinic URLs with correct format
6. Structured data validates in Google Rich Results Test
7. Meta title, description, and canonical render correctly
8. 404 page returns proper HTTP status for missing clinics

## Dependencies

- Database must have `permalink` field with correct format (`pain-management/{slug}`)
- Existing clinic components can be reused for rendering
- Database connection via Drizzle ORM
