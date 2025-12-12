# Requirements: Content Optimization & AI Enhancement System

## Overview

Build an admin system to optimize 5500+ clinic descriptions using Claude Sonnet 4 (via OpenRouter). The system will batch process content, integrate review keywords, add FAQ sections, and provide a review workflow with auto-pause every 250 clinics for manual quality review.

## Background

- **Data Source**: 5500+ clinic records in PostgreSQL with `content` field averaging ~600 words
- **AI Model**: Claude Sonnet 4 via OpenRouter (~$0.015/clinic, ~$82.50 total)
- **Review Frequency**: Auto-pause every 250 clinics for admin review
- **Purpose**: Optimize SEO content while preserving critical medical information and generating FAQ sections

## Key Decisions

- **Target field**: `content` (primary) with full versioning backup
- **AI model**: `anthropic/claude-sonnet-4` via OpenRouter
- **Review mode**: Auto-pause every 250 clinics for manual review
- **No A/B testing**: Just optimization with rollback capability
- **Permalinks/slugs unchanged**: No URL changes, no redirects needed

## Functional Requirements

### Content Optimization
- Target word count: ~400 words (down from ~600 average)
- Integrate patient review keywords naturally (top 3-5 from `reviewKeywords` field)
- Generate 4 FAQ questions with answers per clinic
- Return semantic JSON structure for consistent processing

### Critical Preservation Rules
The system must NEVER modify:
1. Doctor/practitioner names exactly as written
2. City, state, street addresses
3. Phone numbers and contact information
4. H3 tag structure (preserve heading hierarchy)
5. Treatment/procedure names
6. Website URLs and links
7. Medical certifications and credentials

### Batch Processing
1. **Batch Creation**: Configure filters (state, min reviews, exclude optimized)
2. **Batch Size**: Process 50 clinics at a time
3. **Auto-Pause**: Stop every 250 clinics for review
4. **Resume Capability**: Track offset for pause/resume
5. **SSE Progress**: Real-time streaming updates during processing

### Review Workflow
1. **Pending Queue**: List all pending content versions
2. **Side-by-Side Diff**: Compare original vs optimized content
3. **Validation Display**: Show warnings and preservation checks
4. **Bulk Actions**: Approve/reject multiple versions at once
5. **Apply Approved**: Update clinic content with approved versions

### Rollback Capability
1. Store original content in `content_versions` table
2. Rollback entire batches to original content
3. Track rollback status per version

### Cost Tracking
- Track input/output tokens per clinic
- Calculate and display costs (~$0.015/clinic)
- Show batch-level cost summaries

## Acceptance Criteria

1. [x] Database schema with `optimization_batches` and `content_versions` tables
2. [x] AI prompts preserve all critical elements (names, addresses, phones)
3. [x] Rate limiting at 100 requests/minute with exponential backoff
4. [x] Content validation flags issues for manual review
5. [x] SSE streaming shows real-time progress
6. [x] Auto-pause at 250 clinic intervals
7. [x] Review queue with side-by-side diff view
8. [x] Bulk approve/reject functionality
9. [x] Rollback restores original content
10. [ ] Test with sample batch (10-20 clinics)

## Dependencies

- Existing BetterAuth authentication system (admin role)
- Existing Drizzle ORM + PostgreSQL setup
- OpenRouter API key (`OPENROUTER_API_KEY` environment variable)
- Existing clinics table with `content` and `reviewKeywords` fields

## Out of Scope

- A/B testing of content versions
- Automatic content approval (all requires manual review)
- Public-facing content preview
- SEO ranking analysis
- Multi-language support
