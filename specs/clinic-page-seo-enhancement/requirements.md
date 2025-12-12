# Requirements: Clinic Page SEO Enhancement

## Overview

Enhance clinic detail pages by displaying unused database fields and generating AI-optimized "About" content. This increases page uniqueness, relevancy, and SEO value while removing redundant information already displayed elsewhere on the page.

## Business Goals

1. **SEO Improvement**: Increase page uniqueness and relevancy by utilizing all available clinic data
2. **Content Quality**: Clean up raw scraped content, remove redundant contact info, improve formatting
3. **User Experience**: Provide more helpful information (FAQs, reviews, amenities) to visitors
4. **Trust Signals**: Display real patient reviews and testimonials with structured data

## Functional Requirements

### FR-1: AI-Enhanced About Section

Generate clean, unique "About" descriptions for each clinic:

| Aspect | Description |
|--------|-------------|
| Input | Raw `content` field + services, amenities, review keywords |
| Output | Clean, concise 2-3 paragraph description |
| Storage | Save to `newPostContent` field |
| Removes | Embedded addresses, phone numbers, email addresses |
| Improves | Formatting, punctuation, grammar |
| Incorporates | Services, amenities, positive review themes |

### FR-2: FAQ Section Display

Display Q&A content from the `questions` JSONB field:

- Accordion-style expandable FAQ section
- FAQPage structured data for SEO
- Display all available Q&A pairs
- Placed below About section in main content

### FR-3: Reviews Section Display

Display review data from multiple fields:

| Field | Display |
|-------|---------|
| `featuredReviews` | Testimonial cards with rating, text, author |
| `reviewsPerScore` | Visual star distribution breakdown |
| `reviewKeywords` | "What Patients Say" keyword badges |

### FR-4: Services & Amenities Display

Visually display existing data fields:

| Field | Display |
|-------|---------|
| `checkboxFeatures` | Procedure/service list with icons |
| `amenities` | Amenity badges (parking, accessibility, etc.) |

### FR-5: Admin Batch Processing

Admin interface to generate AI content:

- Single clinic "Enhance" button
- Batch process option for multiple clinics
- Progress tracking for batch operations
- Preview before saving

## Non-Functional Requirements

### NFR-1: Performance
- FAQ section lazy-loaded if below fold
- Reviews section uses virtualization for many reviews
- AI generation uses streaming for responsiveness

### NFR-2: SEO
- FAQPage schema for FAQ section
- Review schema for testimonials
- All new content indexable by search engines

### NFR-3: AI Safety
- AI cannot invent information not in source data
- Generated content reviewed before saving
- Original content preserved as fallback

## Acceptance Criteria

### AC-1: AI About Section
- [ ] Admin can generate enhanced About for single clinic
- [ ] AI removes addresses, phone numbers, emails from content
- [ ] AI fixes formatting and punctuation
- [ ] AI incorporates services/amenities naturally
- [ ] Enhanced content saved to `newPostContent`
- [ ] Clinic page displays `newPostContent` when available

### AC-2: FAQ Section
- [ ] FAQ section displays when `questions` data exists
- [ ] Accordion expands/collapses on click
- [ ] FAQPage structured data injected in page head
- [ ] Section hidden when no questions available

### AC-3: Reviews Section
- [ ] Featured reviews display as testimonial cards
- [ ] Star breakdown shows visual distribution
- [ ] Review keywords display as badges
- [ ] Each subsection hidden when data unavailable

### AC-4: Services & Amenities
- [ ] Procedures list displays from `checkboxFeatures`
- [ ] Amenities display with appropriate icons
- [ ] Sections hidden when data unavailable

### AC-5: Admin Batch Processing
- [ ] Admin can enhance single clinic from detail page
- [ ] Admin can batch enhance from clinics list
- [ ] Progress indicator shows batch status
- [ ] Errors reported without stopping batch

## Data Sources

### Currently Unused Fields (Database → Display)

| Field | Type | SEO Value | Display Location |
|-------|------|-----------|-----------------|
| `questions` | JSONB | Very High | FAQ section |
| `featuredReviews` | JSONB | High | Reviews section |
| `reviewsPerScore` | JSONB | High | Reviews section |
| `reviewKeywords` | JSONB | Medium | Reviews section |
| `checkboxFeatures` | Array | High | Procedures list |
| `amenities` | Array | Medium | Amenities section |
| `newPostContent` | Text | High | About section |

## Dependencies

- OpenRouter API for AI content generation
- Existing clinic schema with unused fields
- Admin authentication system
- shadcn/ui accordion component

## Out of Scope

- Social media links display (already in structured data)
- Popular times chart (lower priority)
- QR code display (lower priority)
- Multiple phone/email display (minor improvement)
