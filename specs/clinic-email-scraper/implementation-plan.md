# Implementation Plan: Clinic Email Scraper

## Overview

Replace the existing multi-file CSV-based scraper with a single `scrape-to-db.ts` script that queries clinics from the database, scrapes emails/socials via API, and writes directly back to the database.

---

## Phase 1: Cleanup Old Files

Remove the old scraping infrastructure that is no longer needed.

### Tasks

- [x] Delete old scraper scripts (`scrape-emails.ts`, `scrape-emails-limited.ts`)
- [x] Delete old import scripts (`import-emails-to-db.ts`, `import-contacts-csv.ts`, `generate-domains.ts`)
- [x] Delete old data files (`clinic-unique-domains.txt`, `scraped-emails-results.csv`, `sample-100-returned.csv`, `clinics-missing-emails-*.csv`)
- [x] Delete old documentation (`api-info.md`, `sample-100-clinic-websites.md`, `clinic-email-enrichment-strategy.md`, `clinic-discovery-tool-plan.md`)
- [x] Delete output folder (`output/`)
- [x] Keep `scrape-progress.json` (will be repurposed)

### Technical Details

**Files to delete in `scripts-local/clinics-emails/`:**
```
scrape-emails.ts
scrape-emails-limited.ts
import-emails-to-db.ts
import-contacts-csv.ts
generate-domains.ts
clinic-unique-domains.txt
scraped-emails-results.csv
sample-100-returned.csv
clinics-missing-emails-with-websites.csv
clinics-missing-emails-no-website.csv
api-info.md
sample-100-clinic-websites.md
clinic-email-enrichment-strategy.md
clinic-discovery-tool-plan.md
output/
```

**Files to keep:**
```
package.json (will be updated)
README.md (will be updated)
scrape-progress.json (repurpose for new script)
node_modules/
package-lock.json
```

---

## Phase 2: Update Dependencies

Update package.json with new dependencies for direct database access.

### Tasks

- [x] Add `drizzle-orm` and `postgres` dependencies to package.json
- [x] Update npm scripts for new workflow
- [x] Run `npm install` to update node_modules

### Technical Details

**Updated package.json:**
```json
{
  "name": "clinic-email-scraper",
  "type": "module",
  "scripts": {
    "scrape": "tsx scrape-to-db.ts",
    "scrape:dry": "tsx scrape-to-db.ts --dry-run",
    "scrape:limited": "tsx scrape-to-db.ts --limit=2000"
  },
  "dependencies": {
    "website-contacts-extractor": "^1.0.0",
    "drizzle-orm": "^0.39.0",
    "postgres": "^3.4.5"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "@types/node": "^20.0.0"
  }
}
```

**Install command:**
```bash
cd scripts-local/clinics-emails
npm install drizzle-orm postgres
```

---

## Phase 3: Create Main Scraper Script [complex]

Create the new `scrape-to-db.ts` script with all features.

### Tasks

- [x] Create CLI argument parsing (--dry-run, --limit, --concurrency)
- [x] Implement database connection using Drizzle ORM
- [x] Implement clinic query (websites with no emails)
- [x] Implement progress tracking (load/save from JSON)
- [x] Implement email scoring and filtering logic
- [x] Implement parallel scraping with rate limiting
- [x] Implement direct database updates
- [x] Add summary reporting

### Technical Details

**File path:** `scripts-local/clinics-emails/scrape-to-db.ts`

**Environment variables required:**
- `POSTGRES_URL` - Database connection string
- `CONTACTS_API_KEY` - API key for website-contacts-extractor

**CLI arguments:**
- `--dry-run` - Preview mode, no database writes
- `--limit=N` - Process only N clinics (for testing)
- `--concurrency=N` - Parallel workers (default: 3)

**Database query:**
```sql
SELECT id, title, website FROM clinics
WHERE website IS NOT NULL
AND (emails IS NULL OR array_length(emails, 1) = 0)
ORDER BY id
```

**Clinics table columns to update:**
- `emails` (text array) - Up to 5 scored emails
- `phones` (text array) - Phone numbers if found
- `facebook` (text)
- `instagram` (text)
- `twitter` (text)
- `youtube` (text)
- `linkedin` (text)
- `tiktok` (text)
- `pinterest` (text)

**Email scoring logic (from existing import script):**
```typescript
function scoreEmail(email: string): number {
  const lower = email.toLowerCase();
  let score = 0;

  if (lower.startsWith("info@")) score += 100;
  if (lower.startsWith("contact@")) score += 90;
  if (lower.startsWith("appointments@")) score += 85;
  if (lower.startsWith("office@")) score += 80;
  if (lower.startsWith("reception@")) score += 75;
  if (lower.startsWith("admin@")) score += 70;
  if (lower.startsWith("hello@")) score += 65;

  // Penalize junk
  if (lower.includes("example.com")) score -= 1000;
  if (lower.includes("noreply")) score -= 100;
  if (lower.includes("donotreply")) score -= 100;
  if (lower.includes("@cms.hhs")) score -= 100;
  if (lower.includes("@gmail.com")) score -= 20;
  if (lower.includes("@hotmail.com")) score -= 30;
  if (lower.includes("@yahoo.com")) score -= 30;

  return score;
}
```

**Progress file format (`scrape-progress.json`):**
```json
{
  "processedIds": ["id1", "id2", "id3"],
  "totalProcessed": 150,
  "totalSuccess": 142,
  "totalErrors": 8,
  "emailsFound": 89,
  "lastTimestamp": "2025-01-02T..."
}
```

**Rate limiting:**
- 500ms delay between requests per worker
- With 3 workers = ~6 requests/second max

**API usage:**
```typescript
import Api from 'website-contacts-extractor';

const api = new Api({ apiKey: process.env.CONTACTS_API_KEY });
const contacts = await api.getContacts(`https://${domain}`);
// contacts = { emails: [], facebook: "", twitter: "", ... }
```

---

## Phase 4: Update Documentation

Update README.md with new usage instructions.

### Tasks

- [x] Rewrite README.md with new workflow documentation
- [x] Document environment variables
- [x] Document CLI options
- [x] Add troubleshooting section

### Technical Details

**README.md sections:**
1. Overview - What the script does
2. Prerequisites - API key, database URL
3. Usage - CLI commands with examples
4. Options - --dry-run, --limit, --concurrency
5. Progress tracking - How resume works
6. Troubleshooting - Common issues

---

## Phase 5: Test & Validate

Test the script with a small batch before full run.

### Tasks

- [ ] Run dry-run mode to verify query and logic
- [ ] Run with `--limit=5` to test actual scraping
- [ ] Verify data is written correctly to database
- [ ] Run full scrape (all ~4,400 clinics)

### Technical Details

**Test commands:**
```bash
cd scripts-local/clinics-emails

# Dry run
POSTGRES_URL="postgresql://..." CONTACTS_API_KEY="..." npm run scrape:dry

# Small test batch
POSTGRES_URL="postgresql://..." CONTACTS_API_KEY="..." npx tsx scrape-to-db.ts --limit=5

# Full run
POSTGRES_URL="postgresql://..." CONTACTS_API_KEY="..." npm run scrape
```

**Validation query:**
```sql
SELECT COUNT(*) as clinics_with_email
FROM clinics
WHERE emails IS NOT NULL AND array_length(emails, 1) > 0;
```

Expected: Should increase from ~943 after running.
