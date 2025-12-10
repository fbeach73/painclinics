# Requirements: Clinic Claiming & Paid Featured Listings

## Overview

Implement a clinic claiming system that allows business owners to take control of their listings, plus a paid subscription path for premium promotional placement via Polar payments.

## Business Goals

1. Enable clinic owners to claim and manage their business listings
2. Monetize the directory through featured listing subscriptions ($99-$199/month)
3. Provide a self-service dashboard for clinic owners to update their information
4. Build trust through verified business listings

## User Stories

### Clinic Owners
- As a clinic owner, I want to claim my business listing so I can manage my information
- As a clinic owner, I want to update my clinic's contact info, photos, and services
- As a clinic owner, I want to upgrade to featured placement so I appear higher in search results
- As a clinic owner, I want to see analytics about my listing's performance

### Site Administrators
- As an admin, I want to review and approve/reject claim requests
- As an admin, I want to see all active featured subscriptions and revenue metrics
- As an admin, I want to manage clinic ownership if disputes arise

### Site Visitors
- As a visitor, I want to see clearly which clinics are verified/featured
- As a visitor, I want to trust that featured clinics are legitimate businesses

## Acceptance Criteria

### Claiming System
- [ ] Unclaimed clinic pages display "Claim This Listing" button prominently
- [ ] Claim form collects: full name, role, business email, business phone, optional notes
- [ ] All claims go to admin review queue (manual verification)
- [ ] Admins can approve, reject, or request more info on claims
- [ ] Approved claims link user account to clinic ownership
- [ ] Rejected claims block re-claims for 30 days (anti-fraud)
- [ ] Rate limiting: max 3 claim requests per IP per day

### Owner Dashboard
- [ ] Owners can view all their claimed clinics at `/my-clinics`
- [ ] Owners can edit: phone, website, email, hours, description, photos, services, social links, address
- [ ] Owners cannot edit: clinic name, permalink, Google Place ID (admin-only)
- [ ] Changes are saved immediately (no approval workflow for basic edits)

### Featured Listings
- [ ] Two tiers: Basic ($99/month) and Premium ($199/month)
- [ ] Annual discount: 2 months free (pay for 10, get 12)
- [ ] Featured clinics appear in top 3 search positions
- [ ] Featured clinics display gold badge on cards and map pins
- [ ] Premium tier includes larger map pins and enhanced styling
- [ ] Subscription management via Polar customer portal

### Email Notifications
- [ ] Claim submitted confirmation
- [ ] Claim approved (with dashboard link and featured upsell)
- [ ] Claim rejected (with reason)
- [ ] Featured subscription confirmed
- [ ] Payment failed notification

## Technical Decisions

- **Payment Provider**: Polar (already configured, via BetterAuth plugin)
- **Email Provider**: Mailgun (noreply@painclinics.com)
- **Verification Method**: Manual admin review only (no automated email/SMS verification)
- **Owner Dashboard URL**: `/my-clinics` (route group at `/(owner)`)
- **Address Editing**: Owners can edit freely (including street address)

## Dependencies

- Existing BetterAuth authentication system
- Existing admin dashboard infrastructure
- Existing clinic detail pages and search

## Out of Scope

- Automated email domain verification
- SMS phone verification
- Review response system (future feature)
- Multi-user clinic management (single owner per clinic)
