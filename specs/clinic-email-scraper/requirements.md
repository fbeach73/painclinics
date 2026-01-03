# Requirements: Clinic Email Scraper

## Overview

Replace the existing 2-step CSV-based email scraping workflow with a streamlined single script that queries clinics from the database, scrapes emails and social media links via API, and writes directly back to the database.

## Background

The clinic database has ~5,358 clinics but only ~943 currently have email addresses. We previously collected emails but the data was overwritten during an import. The user has 32,000 API credits available with the `website-contacts-extractor` service.

### Current State
- **Location**: `scripts-local/clinics-emails/`
- **Workflow**: Scrape to CSV → Import CSV to DB (2 scripts)
- **Problem**: CSV intermediate step is unnecessary, data got lost
- **API**: `website-contacts-extractor` ($6/month for 2,000 lookups)

### Desired State
- **Workflow**: Query DB → Scrape → Write directly to DB (1 script)
- **Benefits**: Simpler, no data loss risk, resumable

## Functional Requirements

### FR-1: Direct Database Integration
- Query clinics that have websites but no emails
- Write scraped data directly to clinic records
- No intermediate CSV files

### FR-2: Scraping Capabilities
- Extract emails from clinic websites
- Extract social media links (Facebook, Instagram, Twitter, YouTube, LinkedIn, TikTok, Pinterest)
- Use `website-contacts-extractor` API

### FR-3: Email Scoring
- Score emails by quality (info@ > contact@ > office@ > generic)
- Filter out junk emails (noreply@, example.com, @cms.hhs.gov)
- Store up to 5 best emails per clinic

### FR-4: Progress Tracking
- Track which clinics have been processed
- Support resuming from where it left off
- Track success/error counts

### FR-5: Concurrency & Rate Limiting
- Parallel processing (configurable, default 3 workers)
- Rate limiting to respect API (500ms between requests per worker)

### FR-6: CLI Options
- `--dry-run`: Preview without making changes
- `--limit=N`: Process only N clinics
- `--concurrency=N`: Number of parallel workers

## Non-Functional Requirements

### NFR-1: Security
- API key via environment variable `CONTACTS_API_KEY`
- No hardcoded credentials

### NFR-2: Logging
- Clear progress output (X/Y clinics processed)
- Error logging with clinic ID and reason
- Summary report at completion

## Acceptance Criteria

1. Running `npx tsx scrape-to-db.ts` processes all clinics missing emails
2. Emails and social links are written directly to the `clinics` table
3. Script can be stopped and resumed without reprocessing clinics
4. Dry run mode shows what would be updated without making changes
5. API key is read from environment variable

## Dependencies

- `website-contacts-extractor` npm package
- `drizzle-orm` and `postgres` for database access
- Active API key with available credits
