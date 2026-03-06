# PainClinics.com Full SEO Audit Report

**Date:** 2026-03-05
**URL:** https://painclinics.com
**Business Type:** Medical Directory (YMYL)
**Pages in Sitemap:** 9,799

---

## SEO Health Score: 74/100

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Technical SEO | 82/100 | 25% | 20.5 |
| Content Quality | 72/100 | 25% | 18.0 |
| On-Page SEO | 85/100 | 20% | 17.0 |
| Schema / Structured Data | 80/100 | 10% | 8.0 |
| Performance (CWV) | 60/100 | 10% | 6.0 |
| Images | 55/100 | 5% | 2.75 |
| AI Search Readiness | 70/100 | 5% | 3.5 |
| **TOTAL** | | | **75.75** |

---

## Executive Summary

### Top 5 Critical Issues

1. **No `llms.txt` file** — Returns 404. AI crawlers (GPTBot, ClaudeBot, PerplexityBot) are allowed in robots.txt but have no structured content guide. This is a missed opportunity for AI search citation.

2. **10 static pages missing from sitemap** — `/about`, `/faq`, `/contact`, `/privacy`, `/terms`, `/accessibility`, `/medical-disclaimer`, `/submit-clinic`, `/sitemap-page`, `/advertise` are all absent from `sitemap.xml`. Google may still find them via crawl, but explicit inclusion improves indexing reliability.

3. **Non-trailing-slash directory URLs are uncached** — `/pain-management/tx` (no slash) returns `cache-control: private, no-cache, no-store` while `/pain-management/tx/` (with slash) is cached. Sitemap uses trailing slashes so Google gets cached versions, but direct visits without slash are dynamic. Consider `trailingSlash: true` in `next.config.ts`.

4. **No Content-Security-Policy header** — While other security headers are solid (HSTS, X-Frame-Options DENY, X-Content-Type-Options), CSP is missing. For a YMYL medical site, this is a trust signal gap.

5. **255 filter parameter URLs in sitemap** — `?specialty=` URLs are in the sitemap at priority 0.6. These create index bloat risk and potential thin/duplicate content issues. Google may treat these as parameter variations rather than unique pages.

### Top 5 Quick Wins

1. **Add missing static pages to sitemap** — Simple code change in `sitemap.ts`, high impact for indexation.
2. **Create `llms.txt`** — Describe site structure for AI crawlers. Quick file creation, positions you ahead of 99% of medical directories.
3. **Enable ISR/static caching for state pages** — Would fix the cache MISS issue and reduce DB costs significantly.
4. **Add `og:type` meta tag** — Open Graph tags exist but `og:type` is missing (should be `website` for homepage, `article` for blog posts).
5. **Fix `for-clinics` page title** — Currently "Pain Management Near You: Painclinics.com - [emoji] Local Pain Clinics" — has an emoji in the title tag and doesn't match the page purpose (B2B landing page).

---

## 1. Technical SEO (82/100)

### Crawlability

| Check | Status | Notes |
|-------|--------|-------|
| robots.txt | PASS | Well-configured. AI crawlers allowed. Aggressive bots blocked. |
| Sitemap | PARTIAL | 9,799 URLs present but 10 static pages missing |
| Sitemap reference in robots.txt | PASS | Present |
| Crawl-delay | PASS | 2 seconds for generic bots |
| Canonical tags | PASS | Present on all checked pages |
| Redirect chain | PASS | www -> non-www configured in Vercel |

### Indexability

| Check | Status | Notes |
|-------|--------|-------|
| Meta robots | PASS | `index, follow` on all pages |
| Noindex directives | PASS | None found on public pages |
| X-Robots-Tag header | PASS | Not present (correct — no blocking) |

### Security Headers

| Header | Status | Value |
|--------|--------|-------|
| HSTS | PASS | `max-age=63072000` (2 years) |
| X-Frame-Options | PASS | `DENY` |
| X-Content-Type-Options | PASS | `nosniff` |
| X-XSS-Protection | PASS | `1; mode=block` |
| Referrer-Policy | PASS | `strict-origin-when-cross-origin` |
| Permissions-Policy | PASS | `camera=(), microphone=(), geolocation=(self)` |
| Content-Security-Policy | FAIL | Not present |

### URL Structure

| Check | Status | Notes |
|-------|--------|-------|
| HTTPS | PASS | All URLs use HTTPS |
| Trailing slashes | PASS | Consistent with trailing slash |
| URL readability | PASS | Clean, descriptive slugs |
| Max depth | PASS | 4 levels max (pain-management/state/city/clinic) |

### Caching

| Page Type | Cache Status | Issue |
|-----------|-------------|-------|
| Homepage | HIT | ISR working, 77k second age |
| State pages (with /) | public | Cached correctly via ISR (30-day revalidate) |
| State pages (no /) | MISS | `no-cache, no-store` — dynamic render due to missing trailing slash |
| City pages (with /) | public | Cached correctly |
| City pages (no /) | MISS | Same trailing-slash issue |

**Issue:** Trailing-slash vs non-trailing-slash inconsistency. Sitemap and internal links use trailing slashes (cached), but direct visits without slash are uncached. Adding `trailingSlash: true` to Next.js config would auto-redirect and eliminate this.

---

## 2. Content Quality (72/100)

### E-E-A-T Assessment

| Signal | Status | Notes |
|--------|--------|-------|
| Experience | MODERATE | Patient reviews provide experience signals. No first-person medical experience content from providers. |
| Expertise | GOOD | Treatment options page is comprehensive. Blog content shows medical knowledge. |
| Authoritativeness | MODERATE | No author bios on blog posts. No "reviewed by" badges. No medical advisory board page. |
| Trustworthiness | GOOD | Medical disclaimer present. Privacy policy. HIPAA considerations. |

**YMYL Gap:** For a medical directory site, Google expects clear author credentials, medical review processes, and transparent editorial policies. Missing:
- Author bio pages with medical credentials
- "Medically reviewed by" attribution on content
- Editorial policy / content review process page
- Medical advisory board page

### Content Depth

| Page Type | Assessment |
|-----------|-----------|
| Homepage | STRONG — 7,140+ clinics claim, FAQ section, search functionality, state browse |
| State pages | GOOD — Clinic listings with ratings, about section, specialty filters |
| City pages | MODERATE — 7 clinics in Houston sample. Adequate for small cities, thin for large metros |
| Treatment options | STRONG — Comprehensive coverage of medication, interventional, PT, alternative therapies |
| Blog | GOOD — 132 posts, proper categorization, reasonable depth |
| Pain management guide | GOOD — Educational resource content |

### Thin Content Risk

- **City pages with 1-3 clinics** — Many small city pages may have minimal content beyond a header and 1-2 listings
- **Filter parameter pages** — 255 `?specialty=` URLs may produce near-duplicate content for states with few clinics of that specialty
- **Blog excerpts** — Listing page truncates mid-sentence ("...antioxidant-rich citrus fruits... Discover five natura")

---

## 3. On-Page SEO (85/100)

### Title Tags

| Page | Title | Length | Assessment |
|------|-------|--------|-----------|
| Home | "Pain Clinics Near Me \| Find Pain Management Doctors..." | 71 chars | GOOD — keyword-rich, may truncate in SERP |
| State (TX) | "Pain Management Clinics in Texas \| 340 Verified..." | 64 chars | GOOD |
| City (Houston) | "Pain Management Clinics in Houston, TX \| 7 Verified..." | 62 chars | GOOD |
| Blog | "Pain Management Blog \| Pain Clinics \| PainClinics.com" | 54 chars | GOOD |
| For Clinics | "Pain Management Near You: Painclinics.com - [emoji]..." | ~65 chars | BAD — emoji in title, wrong messaging for B2B page |
| Treatment Options | "Treatment Options \| Pain Clinics \| PainClinics.com" | 51 chars | OK — generic, could be more descriptive |

### Meta Descriptions

| Page | Assessment |
|------|-----------|
| Home | GOOD — Action-oriented with clinic count |
| State/City | GOOD — Dynamic with clinic counts and location |
| Blog | GOOD — Clear topic signal |
| For Clinics | MISMATCHED — Uses patient-facing description for a B2B page |

### Heading Structure

| Page | H1 | Issues |
|------|-----|--------|
| Home | "Find Pain Clinics Near Me" | PASS |
| State | "Pain Management Clinics in Texas" | PASS |
| City | "Pain Management Clinics in Houston, TX" | PASS |
| Blog | "Pain Management Blog" | PASS |
| For Clinics | "Your Patients Are Already Searching For You" | PASS — good B2B messaging |
| Treatment Options | "Treatment Options" | PASS — could be more descriptive |

### Internal Linking

- Homepage links to all 51 states — GOOD
- State pages link to cities — GOOD
- Breadcrumbs on state/city pages — GOOD with schema
- Blog category/tag architecture — GOOD
- **Gap:** No cross-linking between treatment option content and related clinics/specialties
- **Gap:** No "related clinics" or "nearby cities" sections on city pages

---

## 4. Schema / Structured Data (80/100)

### Current Implementation

| Page | Schema Types | Status |
|------|-------------|--------|
| Homepage | WebSite + SearchAction, Organization, FAQPage | EXCELLENT |
| State directory | CollectionPage, MedicalBusiness (per clinic), BreadcrumbList | GOOD |
| City directory | CollectionPage, MedicalBusiness, BreadcrumbList | GOOD |
| Clinic pages | MedicalBusiness, FAQPage (default fallback) | GOOD |
| Blog | Article (in Next.js payload) | NEEDS VERIFICATION |
| Pain Management directory | CollectionPage + ItemList (51 states) | GOOD |
| For Clinics | None detected | MISSING |
| Treatment Options | None detected | MISSING |

### Schema Issues

1. **For Clinics page** — No schema at all on a key conversion page. Should have `Service` or `Product` schema for pricing.
2. **Treatment Options page** — No `MedicalWebPage` or `MedicalCondition` schema. Major missed opportunity for medical rich results.
3. **Blog posts** — Schema appears embedded in Next.js hydration payload but not as standalone JSON-LD. Verify with Google Rich Results Test.

### Schema Opportunities

- Add `MedicalWebPage` to treatment-options and guide pages
- Add `PriceSpecification` or `Offer` schema to for-clinics pricing
- Add `VideoObject` schema if any pages contain embedded videos
- Consider `SpeakableSpecification` for key FAQ answers (voice search)

---

## 5. Performance (60/100)

### Observations

| Metric | Observation |
|--------|------------|
| Server | Vercel Edge (fast global CDN) |
| Framework | Next.js 16 with React 19 |
| Homepage TTFB | Fast (ISR cached, `age: 77808`) |
| State pages TTFB | Slow (uncached, DB query on every request) |
| Font loading | 2 WOFF2 fonts preloaded — GOOD |
| Third-party scripts | Google AdSense, Google Tag Manager, Mapbox — adds weight |

### Concerns

- **AdSense script** (`pagead2.googlesyndication.com`) — Significant render-blocking impact on LCP. Consider lazy-loading below fold.
- **Mapbox GL** — Heavy JS/CSS bundle for map functionality. Loaded on pages where map may not be visible above fold.
- **State page cache miss** — Directly impacts Core Web Vitals for directory pages (majority of site traffic).

### Recommendation

Run PageSpeed Insights on key page types to get actual CWV numbers. Based on architecture:
- Homepage: Likely GOOD (cached, ISR)
- State/city pages: Likely NEEDS IMPROVEMENT (uncached, heavy JS)
- Clinic pages: Unknown without testing

---

## 6. Images (55/100)

### Findings

- **Logo:** Has alt text ("Pain Clinics") — PASS
- **SVG icons:** Use `aria-hidden="true"` — CORRECT (decorative)
- **Blog post images:** Visible on listing page but alt text not verified at scale
- **OG images:** Proper dimensions (1200x630) with alt text — GOOD

### Issues

- No `<picture>` element or `srcset` usage detected for responsive images
- No explicit `width`/`height` attributes on images (CLS risk)
- Blog listing images may lack descriptive alt text at scale
- No WebP/AVIF format detection (Next.js Image component should handle this if used)

### Recommendation

- Audit blog post images for alt text completeness
- Verify Next.js `<Image>` component is used (handles lazy loading, responsive sizing, format optimization)
- Add explicit dimensions to prevent CLS

---

## 7. AI Search Readiness (70/100)

### AI Crawler Access

| Crawler | Status |
|---------|--------|
| GPTBot | ALLOWED |
| ChatGPT-User | ALLOWED |
| ClaudeBot | ALLOWED |
| PerplexityBot | ALLOWED |
| Google-Extended | ALLOWED |

**Assessment:** Excellent — all major AI crawlers have access. This positions the site well for AI search citations.

### llms.txt

**Status:** MISSING (404)

This is the single biggest AI search readiness gap. An `llms.txt` file would tell AI crawlers:
- What the site is about
- Key pages to reference
- How to cite content
- Structured information about the directory

### Citability Signals

| Signal | Status |
|--------|--------|
| Clear factual claims | GOOD — "7,140+ verified clinics", "50 states" |
| Structured data | GOOD — Schema markup provides machine-readable info |
| FAQ content | GOOD — Multiple FAQ sections with clear Q&A |
| Authoritative tone | MODERATE — Could strengthen with medical credentials |
| Source attribution | MODERATE — No "data sourced from" statements |

### AI Overview Optimization

- **Strong:** Directory structure with clear geographic hierarchy
- **Strong:** FAQ schema on homepage and clinic pages
- **Weak:** No comparison content ("X vs Y" treatment pages)
- **Weak:** No "definitive guide" format content optimized for featured snippets
- **Weak:** No statistics/data pages that AI could cite as primary source

---

## Sitemap Analysis

### Composition (9,799 total URLs)

| Type | Count | Priority |
|------|-------|----------|
| Static pages | 14 | 0.7-1.0 |
| State pages | ~51 | 0.85 |
| City pages | ~2,191 | 0.80 |
| Clinic pages | ~7,100 | 0.70 |
| Blog posts | 132 | 0.60 |
| Guide pages | 1 (index only) | 0.80 |
| Filter URLs | 255 | 0.60 |

### Issues

1. **Missing pages:** 10 static pages not in sitemap (about, faq, contact, etc.)
2. **Filter URLs risky:** 255 `?specialty=` parameter URLs could cause index bloat
3. **Single sitemap file:** 9,799 URLs in one file. Google recommends max 50,000 but splitting into sitemap index improves crawl efficiency for large sites
4. **Guides section empty:** Only `/guides` index page — no individual guide URLs
5. **All lastmod same:** Every URL has today's timestamp, which dilutes the signal (Google may ignore lastmod entirely)

---

## robots.txt Analysis

### Strengths
- AI crawlers explicitly allowed (ahead of most competitors)
- Aggressive SEO bots blocked (AhrefsBot, SemrushBot, etc.) — reduces crawl load
- API/admin paths properly disallowed
- Sitemap reference present

### Issues
- `Crawl-delay: 2` — Only respected by Bing/Yandex, not Google. Not harmful but not helpful.
- No `Disallow` for filter parameter URLs (`?specialty=`) — if these should be noindex, robots.txt should block them

---

## Competitive Positioning Notes

For a medical directory with 7,140+ listings:
- Schema implementation is above average
- AI crawler policy is ahead of most competitors
- Blog content volume (132 posts) is moderate
- E-E-A-T signals need strengthening for YMYL compliance
- The treatment-options content hub is a strong topical authority builder
