# Requirements: Contact The Clinic CTA

## Overview

Add a prominent "Contact The Clinic" call-to-action button on all clinic detail pages that opens a professional conversational lead qualification form. The form collects patient information and pain management details, then emails the inquiry to the clinic (if email on file) with a BCC to the admin for lead tracking.

## Problem Statement

Currently, clinic pages only offer "Call Now" and "Get Directions" as contact options. Many potential patients prefer to submit inquiries digitally, especially outside business hours. Additionally, there's no mechanism to capture and qualify leads before they reach clinics, making it difficult to demonstrate value to potential paying clinic partners.

## Goals

1. **Increase lead capture** - Provide an easy digital contact option above the fold
2. **Qualify leads** - Gather pain type, duration, treatment history, and insurance info
3. **Professional presentation** - Make clinics look modern with a polished contact experience
4. **Lead visibility** - BCC all submissions to admin for tracking and follow-up
5. **Clinic outreach** - Use lead data to identify clinics worth approaching for partnerships

## User Stories

### As a patient:
- I want to easily contact a clinic without having to call
- I want to provide my information once in a simple, guided format
- I want to specify my pain condition and insurance so the clinic is prepared

### As a clinic (with email on file):
- I want to receive qualified lead inquiries directly to my inbox
- I want lead details organized clearly so I can respond appropriately

### As the admin:
- I want to see all lead submissions across all clinics
- I want to know which clinics are receiving leads (even if they don't have email on file)
- I want data to support outreach to high-traffic clinics

## Acceptance Criteria

### CTA Button
- [ ] Sticky floating button visible on all clinic detail pages
- [ ] Fixed position: bottom-right on desktop, bottom-center on mobile
- [ ] Eye-catching gradient (teal to blue) with subtle pulse animation
- [ ] Text: "Contact This Clinic" with message icon
- [ ] Respects reduced motion preference
- [ ] Does NOT appear on state or city listing pages

### Conversational Form Modal
- [ ] Opens when CTA button is clicked
- [ ] Shows one question at a time (conversational style)
- [ ] 4 qualification questions with 4 radio-style options each
- [ ] Progress indicator showing current step
- [ ] Back button available on steps 2-5
- [ ] Smooth slide transitions between steps
- [ ] Final step collects: name, phone, email, preferred contact time, additional notes
- [ ] Form validation with clear error messages
- [ ] Loading state during submission
- [ ] Success confirmation message
- [ ] Mobile responsive (full-screen modal on small screens)

### Lead Qualification Questions
1. **Pain Type**: Back/neck, Joint, Nerve/neuropathy, Chronic condition
2. **Pain Duration**: <3 months, 3-6 months, 6-12 months, >1 year
3. **Previous Treatment**: None, Medications only, PT/injections, Surgery
4. **Insurance**: Private, Medicare/Medicaid, Workers' comp, Self-pay

### Email Delivery
- [ ] If clinic has email: send TO clinic, BCC to `pc@freddybeach.com`
- [ ] If no clinic email: send TO `pc@freddybeach.com` with "[No Clinic Email]" subject prefix
- [ ] Professional email template with all lead details
- [ ] Include: clinic name, location, patient contact info, all qualification answers
- [ ] Timestamp of submission

## Dependencies

- Existing Mailgun email infrastructure (`src/lib/email.ts`)
- Existing React Email template system (`src/emails/`)
- shadcn/ui Dialog and RadioGroup components
- Clinic data with optional email field

## Out of Scope

- Lead storage in database (future enhancement)
- Admin dashboard for lead management (future enhancement)
- SMS notifications
- Lead scoring/prioritization
- Appointment booking integration
