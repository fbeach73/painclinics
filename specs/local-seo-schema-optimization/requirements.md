# Requirements: Local SEO & Schema.org Optimization

## Overview

Implement comprehensive Local SEO enhancements for the pain management clinic directory to improve search visibility in Google local results, AI-powered search engines (Google SGE, ChatGPT, Perplexity), and rich results.

## Target Keywords

- "pain management near me"
- "pain clinics near me"
- "pain doctors near me"
- "{Clinic Name} {City}"
- "{City} pain management clinics"
- "{State} pain doctors"

## Functional Requirements

### 1. Enhanced Schema.org Structured Data

**Clinic Pages (LocalBusiness/MedicalBusiness)**
- Include `sameAs` array with all social media links (Facebook, Instagram, Twitter, YouTube, LinkedIn, TikTok, Pinterest)
- Include `review` array with up to 10 featured reviews from database
- Include `amenityFeature` from clinic amenities
- Include `availableService` as MedicalProcedure types
- Include `hasMap` with Google Maps link using placeId
- Continue including: name, description, address, geo, phone, hours, aggregateRating

**Homepage**
- Add WebSite schema with SearchAction for site search
- Add Organization schema for the directory itself

**State Pages**
- CollectionPage schema with ItemList of clinics
- BreadcrumbList schema (3-level)

**City Pages (NEW)**
- CollectionPage schema with ItemList of clinics
- BreadcrumbList schema (4-level: Home > Clinics > State > City)

### 2. City Landing Pages

- URL pattern: `/pain-management/{state-slug}/{city-slug}/`
- Display all clinics in that city
- Include semantic HTML with microdata
- Link to/from state pages and individual clinics
- Generate at build time via `generateStaticParams()`

### 3. Geo Meta Tags

All location pages should include:
- `geo.region` (e.g., "US-CA")
- `geo.placename` (e.g., "Los Angeles, CA")
- `geo.position` (latitude;longitude)
- `ICBM` (latitude, longitude)

### 4. Enhanced Sitemap

- Include city landing pages
- Include image sitemap extensions with geo_location
- Proper priorities: homepage=1.0, states=0.85, cities=0.8, clinics=0.7

### 5. Admin Analytics Dashboard

- Display top 50 review keywords across all clinics
- Filter by state/city
- Show sentiment classification (positive/neutral/negative)
- Display keyword frequency and clinic distribution

## Acceptance Criteria

- [ ] Clinic JSON-LD validates in Google Rich Results Test
- [ ] Up to 10 featured reviews appear in clinic schema
- [ ] Social media links appear in sameAs array when available
- [ ] City pages render correctly at `/pain-management/{state}/{city}/`
- [ ] City pages appear in XML sitemap
- [ ] Geo meta tags present on clinic and city pages
- [ ] Homepage includes WebSite and Organization schema
- [ ] Admin analytics page displays keyword trends with sentiment
- [ ] All pages pass Google Mobile-Friendly test
- [ ] No TypeScript/ESLint errors after implementation

## Dependencies

- Existing clinic database with `featuredReviews`, `reviewKeywords`, social media fields
- Existing `getClinicsByCity()` query function
- Existing admin authentication system

## Out of Scope

- Google Business Profile API integration
- Automated review collection
- Core Web Vitals optimization
- Robots.txt changes
