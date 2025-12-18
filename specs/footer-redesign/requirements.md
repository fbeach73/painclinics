# Requirements: Footer Redesign & Placeholder Pages

## Overview

Replace the boilerplate site footer with a comprehensive, SEO-optimized footer featuring dynamic location data, and create all necessary placeholder pages for legal compliance and site authority.

## Background

The current footer is minimal boilerplate showing GitHub stars and credits. For a health-focused directory site, a proper footer is critical for:
- **SEO**: Internal linking, keyword placement, site structure signals
- **Legal compliance**: Privacy, terms, medical disclaimer (critical for health sites)
- **User trust**: About, contact, editorial policy establish credibility
- **Navigation**: Help users discover content and locations

## Goals

1. Create a professional, multi-column footer with proper navigation structure
2. Display dynamic "Popular Locations" based on clinic counts
3. Include SEO-focused "Popular Searches" section
4. Create all necessary legal and company pages
5. Support dark mode and responsive design

## Acceptance Criteria

### Footer Component
- [ ] 5-column layout on desktop (brand, resources, legal, company, locations)
- [ ] Responsive collapse on mobile
- [ ] Logo and tagline in brand column
- [ ] Dynamic top 5 cities by clinic count with links
- [ ] Dynamic top 6 states by clinic count with links
- [ ] Popular searches section with SEO keywords
- [ ] Copyright bar with current year
- [ ] All links use Next.js Link component
- [ ] Dark mode compatible

### Logo Component
- [ ] Reusable component using existing `/public/logo.png`
- [ ] Size variants (sm, md, lg)
- [ ] Optional text display
- [ ] Links to homepage

### Placeholder Pages (14 total)
- [ ] All pages have proper Metadata exports for SEO
- [ ] Consistent styling with existing site pages
- [ ] Dark mode support
- [ ] Semantic HTML structure

### Legal Pages (Critical)
- [ ] Privacy Policy at `/privacy`
- [ ] Terms of Service at `/terms`
- [ ] Medical Disclaimer at `/medical-disclaimer` (CRITICAL for health sites)
- [ ] Cookie Policy at `/cookies`
- [ ] Accessibility Statement at `/accessibility`

### Company Pages
- [ ] About Us at `/about`
- [ ] Contact Us at `/contact`
- [ ] Submit a Clinic at `/submit-clinic`
- [ ] Advertise With Us at `/advertise`
- [ ] Editorial Policy at `/editorial-policy`
- [ ] FAQ at `/faq` (using Accordion component)

### Content Pages
- [ ] Pain Management Guide at `/pain-management-guide`
- [ ] Treatment Options at `/treatment-options`

### Utility Pages
- [ ] HTML Sitemap at `/sitemap-page` (separate from sitemap.xml)

## Dependencies

- Existing clinic data queries in `/src/lib/clinic-queries.ts`
- State name helper in `/src/lib/us-states.ts`
- shadcn/ui components (Accordion, Alert, Separator)
- Logo image at `/public/logo.png`

## Related Features

- Sitemap XML generation (existing at `/src/app/sitemap.ts`)
- State/city pages at `/pain-management/[...slug]/`
- Blog at `/blog`
- Clinic search at `/clinics`
