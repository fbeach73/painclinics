# Clinic Email Enrichment Strategy

## Current State Analysis

### Database Summary (as of December 22, 2025)

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Clinics** | 5,026 | 100% |
| **Have Email** | 0 | 0% |
| **Missing Email** | 5,026 | 100% |
| **Have Website** | 4,376 | 87% |
| **No Website** | 650 | 13% |
| **Unique Domains** | 2,287 | - |

### Key Insight
All 5,026 clinics are missing emails. However, 87% (4,376) have website URLs, making website scraping a viable enrichment strategy.

---

## Clinics by State (Top 20)

| State | Total | With Website | Without Website |
|-------|-------|--------------|-----------------|
| Massachusetts | 220 | 182 (83%) | 38 |
| New Jersey | 220 | 212 (96%) | 8 |
| Connecticut | 193 | 162 (84%) | 31 |
| New Hampshire | 138 | 118 (86%) | 20 |
| New York | 121 | 114 (94%) | 7 |
| Missouri | 118 | 100 (85%) | 18 |
| North Carolina | 115 | 107 (93%) | 8 |
| Pennsylvania | 115 | 107 (93%) | 8 |
| California | 114 | 100 (88%) | 14 |
| Alabama | 114 | 86 (75%) | 28 |
| Maryland | 114 | 110 (96%) | 4 |
| Virginia | 114 | 109 (96%) | 5 |
| Oklahoma | 113 | 98 (87%) | 15 |
| Washington | 113 | 96 (85%) | 17 |
| Colorado | 113 | 97 (86%) | 16 |
| Wisconsin | 113 | 99 (88%) | 14 |
| Nevada | 112 | 97 (87%) | 15 |
| Tennessee | 111 | 97 (87%) | 14 |
| Michigan | 111 | 103 (93%) | 8 |
| Louisiana | 110 | 97 (88%) | 13 |

---

## Exported Data Files

1. **`specs/clinics-missing-emails-with-websites.csv`** (4,376 rows)
   - Columns: id, title, city, state, website, phone, place_id
   - Priority targets for website scraping

2. **`specs/clinics-missing-emails-no-website.csv`** (650 rows)
   - Columns: id, title, city, state, phone, place_id
   - Requires alternative enrichment methods

---

## Email Enrichment Strategies

### Strategy 1: Website Scraping (Recommended First)

**Target**: 4,376 clinics with websites (2,287 unique domains)

**Approach**:
1. Visit each clinic's website
2. Look for common email patterns:
   - Contact page (`/contact`, `/contact-us`, `/about/contact`)
   - Footer email links (`mailto:` hrefs)
   - JSON-LD structured data
   - Meta tags
3. Extract and validate email addresses

**Tools/Platforms**:
- **N8N Workflow** (self-hosted automation)
- **Apify** - Web scraping as a service
- **Bright Data** - Proxy + scraping infrastructure
- **Custom Python script** with BeautifulSoup/Playwright

**Cost Estimate**:
- Self-hosted scraping: ~$0 (just compute time)
- Apify: ~$50-100 for 4,000+ pages
- Bright Data: Variable based on proxy usage

**Challenges**:
- Rate limiting / IP blocks
- JavaScript-rendered contact pages
- Anti-bot protection
- Email obfuscation (encoded emails, contact forms only)

---

### Strategy 2: Business Data Enrichment APIs

**Platforms**:

| Platform | Data Source | Cost | Notes |
|----------|-------------|------|-------|
| **Apollo.io** | LinkedIn + web | $49-99/mo | Good for business contacts, may have decision-maker emails |
| **Hunter.io** | Email finder | $49-399/mo | Domain-based email lookup |
| **Clearbit** | Business data | Enterprise | High quality but expensive |
| **ZoomInfo** | B2B database | Enterprise | Comprehensive but costly |
| **Snov.io** | Email finder | $39-99/mo | Domain and name-based lookup |
| **RocketReach** | Contact data | $53-179/mo | Good coverage for healthcare |

**N8N Integration Available**:
- Apollo.io (via API or HTTP node)
- Hunter.io (native integration)
- Clearbit (native integration)
- Snov.io (via API)

---

### Strategy 3: Google Places API (Limited)

**Note**: Google Places API does **NOT** provide email addresses.

Available contact fields:
- Phone numbers
- Website URL
- Opening hours

Not available: Email addresses

---

### Strategy 4: Manual Outreach (For High-Value Clinics)

For clinics without websites or where scraping fails:
1. Phone call to request email
2. Social media lookup (Facebook, LinkedIn)
3. Google search for clinic + email

---

## Recommended Implementation Plan

### Phase 1: Website Scraping (Week 1-2)
1. Build N8N workflow or Python script
2. Scrape contact pages from 4,376 websites
3. Extract and validate emails
4. Import results to database

**Expected yield**: 40-60% success rate (~1,750-2,625 emails)

### Phase 2: API Enrichment (Week 3-4)
1. Export remaining clinics without emails
2. Use Hunter.io for domain-based lookup
3. Use Apollo.io for business lookup
4. Merge and dedupe results

**Expected yield**: Additional 20-30% coverage

### Phase 3: Manual + Ongoing
1. Create admin interface to flag missing emails
2. Implement contact form that requests clinic email
3. Periodic re-scraping for updated websites

---

## Database Update Plan

When emails are found, update the `clinics.emails` array:

```sql
UPDATE clinics
SET emails = array_append(COALESCE(emails, '{}'), 'found@email.com')
WHERE id = 'clinic-id';
```

The existing contact form system (`src/app/api/contact/route.ts`) will automatically:
- Send to clinic if `emails[0]` exists
- Fall back to admin if no email

---

## N8N Workflow Outline

```
[Trigger: Manual or Scheduled]
    ↓
[Read CSV: clinics-missing-emails-with-websites.csv]
    ↓
[Split In Batches: 10 at a time]
    ↓
[HTTP Request: Fetch website HTML]
    ↓
[Code Node: Extract emails using regex]
    - Pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    - Also check mailto: links
    ↓
[IF: Email found?]
    ↓ Yes                    ↓ No
[Postgres: Update clinic]   [Log: No email found]
    ↓
[Wait: 1 second (rate limit)]
    ↓
[Loop to next batch]
```

---

## Questions for Further Planning

1. **Priority**: Should we focus on specific states first?
2. **Budget**: What's the budget for API enrichment services?
3. **N8N Setup**: Do you have N8N already running, or need setup guidance?
4. **Manual Fallback**: For 650 clinics without websites, skip or manual outreach?
5. **Contact Form**: Should we hide the contact button when no email exists?

---

## Next Steps

- [ ] Review exported CSV files
- [ ] Decide on scraping approach (N8N vs custom script)
- [ ] Test scraping on 10-20 sample websites
- [ ] Evaluate API enrichment service trials
- [ ] Define success metrics and timeline
