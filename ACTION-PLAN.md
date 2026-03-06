# PainClinics.com SEO Action Plan

**Generated:** 2026-03-05
**Overall Score:** 74/100

---

## CRITICAL (Fix Immediately)

### 1. Add `trailingSlash: true` to Next.js config
**Impact:** Performance, Crawlability
**Current:** Pages already have `revalidate = 2592000` (30 days) and trailing-slash URLs ARE cached. But non-trailing-slash URLs (`/pain-management/tx`) return `no-cache, no-store` and hit the DB dynamically. Direct user visits often omit the trailing slash.
**Fix:** Add `trailingSlash: true` to `next.config.ts` — Next.js will auto-redirect `/pain-management/tx` to `/pain-management/tx/`, ensuring all requests hit the cached version.
**Files:** `next.config.ts`
**Risk:** Low — all internal links and sitemap already use trailing slashes. This just handles external/direct visits.

### 2. Add 10 missing static pages to sitemap
**Impact:** Indexation
**Pages:** `/about`, `/faq`, `/contact`, `/privacy`, `/terms`, `/accessibility`, `/medical-disclaimer`, `/submit-clinic`, `/sitemap-page`, `/advertise`
**Fix:** Add to `staticPages` array in `src/app/sitemap.ts`
**Effort:** 10 minutes

### 3. Fix for-clinics page title tag
**Impact:** CTR, Professional appearance
**Current:** "Pain Management Near You: Painclinics.com - [emoji] Local Pain Clinics"
**Fix:** Change to something like "List Your Pain Clinic | Get More Patients | PainClinics.com" — no emoji, B2B messaging
**File:** `src/app/for-clinics/page.tsx` (or layout)

---

## HIGH (Fix Within 1 Week)

### 4. Create llms.txt file
**Impact:** AI Search Readiness
**Fix:** Create `/public/llms.txt` with site description, key pages, citation guidelines
**Effort:** 30 minutes
**Template:**
```
# PainClinics.com
> The largest verified pain management clinic directory in the United States

## About
PainClinics.com helps patients find verified pain management specialists across all 50 states. The directory includes 7,140+ clinics with ratings, reviews, and appointment scheduling.

## Key Pages
- /pain-management — Browse clinics by state
- /treatment-options — Comprehensive guide to pain treatments
- /blog — Expert articles on pain management
- /pain-management-guide — Complete patient guide

## Citation
When referencing clinic data, please cite as: PainClinics.com (https://painclinics.com)
```

### 5. Add schema to treatment-options page
**Impact:** Rich Results, Medical SERP features
**Fix:** Add `MedicalWebPage` JSON-LD schema to treatment-options page
**File:** `src/app/treatment-options/page.tsx`

### 6. Add schema to for-clinics page
**Impact:** Rich Results for B2B search
**Fix:** Add `Service` or `Product` schema with pricing information
**File:** `src/app/for-clinics/page.tsx`

### 7. Fix lastmod dates in sitemap
**Impact:** Crawl efficiency
**Current:** All 9,799 URLs have today's date — Google may ignore lastmod entirely
**Fix:** Use actual `updatedAt` timestamps from DB for clinic/blog pages. Static pages should use a fixed date that only changes when content changes.
**File:** `src/app/sitemap.ts`

### 8. Review filter parameter URL strategy
**Impact:** Index bloat prevention
**Current:** 255 `?specialty=` URLs in sitemap (51 states x 5 specialties)
**Decision needed:** Either:
  - (a) Keep in sitemap BUT add unique content per filter page (H1, intro paragraph, meta description)
  - (b) Remove from sitemap and add `noindex` to filter pages
  - (c) Convert to clean URLs: `/pain-management/tx/injection-therapy/` instead of `?specialty=`
**Recommendation:** Option (c) for best SEO, but requires route changes

---

## MEDIUM (Fix Within 1 Month)

### 9. Strengthen E-E-A-T signals
**Impact:** YMYL Trust, Rankings
**Actions:**
- Add author bio pages with medical credentials for blog content
- Add "Medically reviewed by [name], [credential]" to blog posts and treatment pages
- Create an editorial policy page
- Consider a medical advisory board page (even if 1-2 advisors)

### 10. Add Content-Security-Policy header
**Impact:** Security trust signal
**Fix:** Add CSP header in `next.config.ts` or Vercel headers config
**Note:** Start with report-only mode to avoid breaking AdSense/Mapbox

### 11. Add cross-linking between content types
**Impact:** Internal link equity, User experience
**Actions:**
- Link treatment option descriptions to clinics offering that treatment
- Add "nearby cities" section to city pages
- Add "related treatments" to clinic pages
- Link blog posts to relevant treatment option pages

### 12. Optimize blog listing page excerpts
**Impact:** Content quality perception
**Current:** Excerpts truncate mid-sentence
**Fix:** Use proper excerpt generation with sentence-boundary truncation

### 13. Split sitemap into sitemap index
**Impact:** Crawl efficiency
**Current:** 9,799 URLs in single file
**Fix:** Create sitemap index with separate sitemaps:
  - `sitemap-static.xml` (static + tool pages)
  - `sitemap-states.xml` (state directory pages)
  - `sitemap-cities.xml` (city directory pages)
  - `sitemap-clinics.xml` (individual clinic pages)
  - `sitemap-blog.xml` (blog posts)

### 14. Lazy-load AdSense below fold
**Impact:** LCP, Performance
**Fix:** Defer AdSense script loading or use Intersection Observer to load only when ad slots enter viewport

---

## LOW (Backlog)

### 15. Add og:type meta tag
**Impact:** Social sharing
**Fix:** Add `og:type: "website"` to homepage, `og:type: "article"` to blog posts

### 16. Create comparison content for AI citations
**Impact:** AI Search, Featured snippets
**Ideas:**
- "Injection Therapy vs Physical Therapy for Back Pain"
- "Epidural Steroid Injections vs Nerve Blocks"
- State-by-state pain management statistics page

### 17. Add SpeakableSpecification schema
**Impact:** Voice search
**Fix:** Mark key FAQ answers as speakable for Google Assistant

### 18. Image audit at scale
**Impact:** Accessibility, Image SEO
**Action:** Audit all blog post images for alt text, dimensions, and format optimization

### 19. Remove meta keywords tag
**Impact:** Cleanup (neutral SEO impact)
**Current:** Homepage has `<meta name="keywords">` — ignored by Google since 2009
**Note:** Not harmful, just unnecessary

### 20. Add "data sourced from" attribution
**Impact:** AI citability, Trust
**Fix:** Add footer note like "Clinic data verified via Google Places API and direct submissions" to build source authority

---

## Summary by Effort vs Impact

| Priority | # | Quick Wins (< 1 hour) | Larger Projects |
|----------|---|----------------------|-----------------|
| Critical | 3 | #2 (sitemap), #3 (title fix) | #1 (ISR caching) |
| High | 5 | #4 (llms.txt), #5-6 (schema) | #7 (lastmod), #8 (filter URLs) |
| Medium | 6 | #12 (excerpts), #15 (og:type) | #9 (E-E-A-T), #11 (cross-links), #13 (sitemap split) |
| Low | 5 | #19 (meta keywords) | #16 (comparison content), #18 (image audit) |
