# SEO Audit Plan — PainClinics.com

## Context

The site gets mostly local clinic-name traffic (e.g. "Total Pain Care MS") but struggles with high-value generic queries like "pain management clinics near me", "back pain specialist near me", and city/treatment-level searches. The SEO infrastructure is strong (structured data, sitemap, redirects, metadata) but there are content gaps on location pages and missing internal linking that limit ranking potential for broader queries. This audit will use full GSC exports (16 months) to identify exactly where the gaps are and produce an actionable fix list.

---

## Step 0: Gather Exports

Export these CSVs from Google Search Console and place them in `docs/seo-audit/`:

| File | GSC Path | Notes |
|------|----------|-------|
| `queries.csv` | Performance > Search Results > Queries tab > Export | All queries, 16 months, Web only |
| `pages.csv` | Performance > Search Results > Pages tab > Export | All pages, 16 months, Web only |
| `coverage.csv` | Pages > Export (or Indexing > Pages > Export) | All known URLs, index status |
| `sitemaps.csv` | Sitemaps > screenshot/export the discovered vs indexed counts | Manual if no CSV option |
| `404-logs.json` | Admin > Stats > copy/export the 404 log table | Already have from earlier |

**Tip:** In GSC Performance, click "Date: Last 16 months" before exporting. Export as CSV (not Google Sheets).

---

## Step 1: Build the Audit Notebook

Create `docs/seo-audit/audit.ipynb` — a Jupyter notebook that ingests the CSVs and produces analysis across 6 dimensions:

### 1A: Query Analysis
- **Top queries by impressions** (not clicks) — shows where Google considers you relevant but you're not winning clicks
- **Click-through rate (CTR) by position bucket** (1-3, 4-10, 11-20, 21+) — identifies quick wins at positions 4-10
- **Query clustering**: Group queries into categories:
  - `brand` — contains "painclinics"
  - `clinic-name` — matches known clinic titles
  - `near-me` — contains "near me", "near", "nearby"
  - `city-state` — contains city/state names
  - `condition` — contains pain conditions (back pain, neuropathy, sciatica, etc.)
  - `treatment` — contains treatment terms (injection, physical therapy, nerve block, etc.)
  - `generic` — everything else
- **Gap analysis**: Queries with high impressions but position >10 = ranking opportunities
- **CTR anomalies**: Queries with position <5 but CTR <3% = title/description problems

### 1B: Page Performance Analysis
- **Top pages by impressions vs clicks** — find underperforming pages
- **Page type breakdown**: Classify each URL as homepage/state/city/clinic/blog/static
- **Content type performance**: Average position and CTR by page type
- **Orphaned pages**: Pages in sitemap but zero impressions (not indexed or not ranking)
- **Cannibalizing pages**: Multiple pages ranking for the same query (from queries+pages cross-ref)

### 1C: Indexing & Coverage Analysis
- **Index status breakdown**: Valid, excluded, errors — with counts
- **Exclusion reasons**: "Discovered - not indexed", "Crawled - not indexed", "Duplicate", etc.
- **URL pattern analysis**: Which URL patterns have the worst index rates?
- **Sitemap vs index gap**: URLs in sitemap but not indexed

### 1D: 404 Recovery Audit
- **Remaining 404s** not covered by the redirects we just added
- **Cross-reference with GSC coverage** — are any 404 URLs still getting impressions?
- **Priority ranking**: Sort by (impressions + referrer authority) to fix highest-value first

### 1E: "Near Me" & Generic Query Deep Dive
- **All "near me" queries**: Current position, impressions, clicks
- **Competing pages**: Which of YOUR pages rank for these? (usually homepage only)
- **Content gap**: What pages SHOULD rank for "pain management near me" — likely city pages need more content
- **Treatment query mapping**: Which treatment queries have no dedicated content?

### 1F: Action Items Generator
- Produce a prioritized CSV of fixes: `priority, type, url, action, expected_impact`
- Types: `content`, `redirect`, `schema`, `meta`, `internal-link`, `new-page`

---

## Step 2: Notebook Output Artifacts

The notebook will generate these files in `docs/seo-audit/`:

| Output File | Contents |
|-------------|----------|
| `query-clusters.csv` | Every query tagged with cluster + metrics |
| `page-performance.csv` | Every page with type, avg position, CTR, impressions |
| `quick-wins.csv` | Queries at position 4-15 with >50 impressions (low-hanging fruit) |
| `content-gaps.csv` | High-impression queries with no matching dedicated page |
| `action-items.csv` | Prioritized fix list with type, URL, action, impact |
| `index-gaps.csv` | URLs in sitemap but not indexed, with exclusion reason |

---

## Step 3: Implement Quick Wins (Post-Audit)

Based on audit findings, likely actions will include:

1. **Meta title/description rewrites** for pages with low CTR at good positions
2. **Add FAQSchema to `/faq` page** (missing rich snippet opportunity)
3. **Enrich state/city page content** with contextual H2s and location-specific copy
4. **Create treatment landing pages** if treatment queries have no dedicated content
5. **Fix internal linking** — blog posts > filtered clinic searches, clinic pages > related blog content
6. **Submit reindex requests** for high-value excluded URLs

These will be planned separately after reviewing the audit output.

---

## Files to Create

| File | Purpose |
|------|---------|
| `docs/seo-audit/audit.ipynb` | Main audit notebook |
| `docs/seo-audit/README.md` | Instructions for running the audit |

No production code changes in this step — purely analytical.

---

## Verification

1. Place all GSC exports in `docs/seo-audit/`
2. Run notebook cells sequentially
3. Review output CSVs for accuracy against raw GSC data
4. Confirm query clustering correctly categorizes a sample of 20 queries
5. Verify action items make sense against what you see in GSC UI

---

## Current SEO Infrastructure (Reference)

### What's already strong
- Comprehensive structured data (MedicalBusiness, BreadcrumbList, FAQPage, CollectionPage, WebSite, Organization)
- Dynamic sitemap with state/city/clinic/blog + filter combo pages
- Metadata with geo tags on clinic pages
- 140+ legacy WordPress redirects
- Fuzzy slug matching for old URLs
- Blog internal linking with keyword scoring algorithm
- Image optimization via next/image
- Deferred third-party scripts (GTM, AdSense)

### Known gaps to investigate
- State/city pages lack unique H2 content and location-specific copy
- Blog posts don't link to filtered clinic searches
- `/faq` page missing FAQSchema
- `/treatment-options` missing schema markup
- No dedicated treatment landing pages for high-volume queries
- City pages nearly identical to state pages (thin content risk)
- Homepage ranks for "near me" but city pages should too

### Key SEO files in codebase
- `src/lib/structured-data.ts` — All JSON-LD generators
- `src/app/sitemap.ts` — Dynamic sitemap
- `src/app/robots.ts` — Crawl rules
- `src/lib/directory/meta.ts` — Filter-aware metadata
- `src/lib/blog/seo/interlinker.ts` — Blog internal linking
- `src/app/pain-management/[...slug]/page.tsx` — Clinic/state/city pages + metadata
- `next.config.ts` — Redirects (744 lines)
