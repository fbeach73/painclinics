# Requirements: AI-Powered Amenities & Services Enhancement

## Overview

Add two AI-powered features to the admin panel that enhance clinic listings with unique, accurate information extracted from review data, business descriptions, and other stored content.

## Problem Statement

Clinics imported from Outscraper and other sources have rich review data (`allReviewsText`) and business descriptions, but:
1. **Amenities** are often missing or incomplete - they exist in the schema but aren't being populated
2. **Services** require manual selection from 50+ options, which is time-consuming and may miss relevant services

## Features

### Feature 1: Automate Amenities

An AI-powered feature that analyzes clinic data to extract and suggest amenities.

**User Story**: As an admin, I want to click "Automate Amenities" and have AI analyze review text and descriptions to populate the amenities field automatically.

**Acceptance Criteria**:
- [ ] "Automate Amenities" button in the Details tab of clinic editor
- [ ] AI analyzes `allReviewsText`, `businessDescription`, and existing amenities
- [ ] Can dynamically discover new amenities (not limited to a fixed list)
- [ ] Maximum 8 amenities per clinic
- [ ] Saves to existing `amenities` text[] field in database
- [ ] Shows loading state during AI processing
- [ ] Displays current amenities as editable badges
- [ ] Allows manual add/remove of amenities

### Feature 2: AI Enhance Services

An AI-powered feature that suggests services based on clinic content.

**User Story**: As an admin, I want to click "AI Enhance" on the Services tab to get intelligent service suggestions with confidence levels and evidence.

**Acceptance Criteria**:
- [ ] "AI Enhance" button in the Services tab of clinic editor
- [ ] AI analyzes all available clinic data (reviews, description, keywords, existing amenities)
- [ ] Returns suggestions for existing services with confidence levels (high/medium/low)
- [ ] Provides brief evidence/quote for each suggestion
- [ ] Can suggest NEW services not in the master list (for admin review)
- [ ] Recommends which services should be featured (max 8)
- [ ] Modal UI to review, accept/reject suggestions before applying
- [ ] Apply button saves selected services to clinic

## Data Sources for AI Analysis

The AI will analyze these fields from the `clinics` table:
- `allReviewsText` - Concatenated review texts (primary source)
- `businessDescription` - About/description text
- `detailedReviews` - Raw review objects with full metadata
- `reviewKeywords` - Extracted keywords from reviews
- `amenities` - Existing amenities (for context)
- `checkboxFeatures` - Existing feature tags

## Constraints

- Maximum 8 amenities per clinic
- Maximum 8 featured services per clinic
- Use OpenRouter with existing `OPENROUTER_MODEL` environment variable
- Follow existing patterns from `enhance-about/route.ts` and `generate-faq/route.ts`
- Admin authentication required for all API endpoints

## Related Features

- **Existing**: Content Enhancement (`/api/admin/clinics/[clinicId]/enhance-about`)
- **Existing**: FAQ Generation (`/api/admin/clinics/[clinicId]/generate-faq`)
- **Existing**: Amenities Display Component (`src/components/clinic/clinic-amenities.tsx`)
- **Existing**: Service Selection (`src/components/admin/services/clinic-service-selector.tsx`)

## Success Metrics

- Clinics with AI-populated amenities should have more complete listings
- Service selection time should decrease significantly
- Accuracy of AI suggestions should be high (evidenced by low rejection rate)
