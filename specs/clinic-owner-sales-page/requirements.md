# Requirements: Clinic Owner Sales Page

## Overview

Create a B2B sales landing page at `/for-clinics` targeting pain management clinic owners who received cold outreach emails. The page should convert clinic owners to:

1. **Primary goal**: Claim their clinic listing and upgrade to Basic or Premium tier
2. **Secondary goal**: At minimum, claim their free listing for verified badge

## Background

- Cold outreach emails are sent to clinic owners in our database
- Emails contain links to either this landing page OR direct links to their clinic's page
- Each clinic page already has a "Claim This Clinic" button
- This landing page serves as the general entry point + education about benefits

## Target Audience

- Pain management clinic owners and practice managers
- Located across 50 US states
- Received cold outreach email from Pain Clinics
- Not yet registered on the platform
- Primary concern: Getting more patients

## Offer Details

### January Early Adopter Special (50% off)

| Tier | Monthly | Annual | Regular Price |
|------|---------|--------|---------------|
| Free | $0 | $0 | $0 |
| Basic | $49.50/mo | $495/yr | $99/$990 |
| Premium | $99.50/mo | $995/yr | $199/$1,990 |

### Tier Features

**Free (Claimed Only)**
- Verified badge on listing
- Edit basic listing info
- Appear in directory

**Basic**
- Featured badge on listing
- Priority placement in search results
- Highlighted card in directory
- Featured marker on map
- Up to 5 photos

**Premium (Most Popular)**
- All Basic features
- Premium gold badge
- TOP placement in search results
- Larger marker on map
- Featured on homepage
- Up to 50 photos
- Priority support

## Acceptance Criteria

### Page Structure
- [ ] Hero section with compelling headline and primary CTA
- [ ] Problem/pain points section addressing clinic owner concerns
- [ ] Solution section showing benefits of claiming listing
- [ ] Testimonials carousel (placeholder quotes from clinic owners)
- [ ] Pricing comparison table (Free vs Basic vs Premium)
- [ ] How it works section (4-step process)
- [ ] FAQ accordion addressing common objections
- [ ] Final CTA section with urgency messaging

### Design Requirements
- [ ] Uses Aceternity UI components (LampContainer, BentoGrid, InfiniteMovingCards)
- [ ] Consistent with existing site design system
- [ ] Fully responsive (mobile-first)
- [ ] Dark mode support
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Fast loading (no heavy animations blocking content)

### Content Requirements
- [ ] Headline: "Your Patients Are Already Searching For You"
- [ ] Value prop focused on patient leads and visibility
- [ ] General messaging about lead volume ("thousands of patients searching")
- [ ] Soft urgency: mention "January" discount without hard deadline
- [ ] 4 placeholder testimonials from fictional clinic owners
- [ ] 5 FAQ items addressing common objections

### CTA Flow
- [ ] Primary CTA links to `/pain-management` (clinic search)
- [ ] Secondary CTAs throughout page
- [ ] Email campaigns will link directly to clinic pages for claiming

### Technical Requirements
- [ ] Route: `/for-clinics`
- [ ] Client component (uses Framer Motion)
- [ ] Passes lint and typecheck
- [ ] No new dependencies (uses existing Aceternity components)

## Dependencies

### Existing Features Used
- Clinic claim flow (`src/components/clinic/claim-form-modal.tsx`)
- Pricing structure (`src/components/owner/billing-toggle-pricing.tsx`)
- Aceternity UI components (already installed):
  - `LampContainer`
  - `BentoGrid`
  - `InfiniteMovingCards`
  - `Button` (moving-border)
  - `FloatingNav`

### Related Pages
- `/pain-management` - Where users search for clinics
- `/pain-management/[slug]` - Individual clinic pages with claim button
- `/my-clinics` - Owner dashboard after claiming

## Out of Scope

- Email template design (separate feature)
- Personalization based on clinic data in URL
- A/B testing infrastructure
- Analytics tracking (uses existing pageview tracking)
- Countdown timer for deadline
