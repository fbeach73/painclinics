# Requirements: Featured Subscription Benefits

## Overview

Deliver all promised benefits for Basic and Premium featured listing subscriptions. This includes visual enhancements in search results, email notifications, owner portal improvements, and premium-only features (analytics dashboard, photo uploads).

## Background

The Stripe subscription system is now live and functional. When clinic owners subscribe to a Featured plan, they receive:

- **Basic Tier** ($49.50/mo): Featured badge, priority placement, highlighted card, featured map marker
- **Premium Tier** ($99.50/mo): All Basic features + premium gold badge, top placement, larger map marker, homepage featured section, analytics dashboard, unlimited photo uploads

Currently, the backend infrastructure works correctly (search ordering, homepage featured section, map markers), but several visual and feature promises are not fully delivered.

## Goals

1. **Visual Consistency**: Featured clinics should be visually distinguishable in all directory listings
2. **Email Notifications**: Admin notified of new subscriptions (for Adsense management), improved user welcome email
3. **Owner Portal**: Show subscription status, replace "Get Featured" button appropriately
4. **Premium Features**: Deliver analytics dashboard and photo upload functionality

## Acceptance Criteria

### Search Results
- [ ] Featured badge appears on Basic tier clinics in state/city pages
- [ ] Premium gold badge with shimmer effect appears on Premium tier clinics
- [ ] Featured clinic cards have highlighted styling (border/background)
- [ ] Featured clinics appear before non-featured clinics (already works)

### Map Markers
- [ ] Basic featured clinics show gold/yellow marker (already works)
- [ ] Premium clinics show larger gold marker with star icon (already works)
- [ ] Verify data flow passes `featuredTier` to all map components

### Emails
- [ ] Admin receives notification email on new subscription
- [ ] Admin email includes clinic slug `/pain-management/{slug}` for Adsense removal
- [ ] User welcome email has clear CTA to `/my-clinics`

### Owner Portal (/my-clinics)
- [ ] Featured clinics show subscription badge (Basic/Premium) instead of "Get Featured"
- [ ] Badge links to subscription management page
- [ ] Non-featured clinics still show "Get Featured" button

### Premium: Analytics Dashboard
- [ ] Premium subscribers can access analytics for their clinic
- [ ] Dashboard shows page views over 30 days
- [ ] Dashboard shows referrer sources
- [ ] Non-premium users cannot access analytics page

### Premium: Photo Uploads
- [ ] Basic subscribers can upload up to 5 photos
- [ ] Premium subscribers have unlimited photo uploads
- [ ] Non-subscribers see upgrade prompt
- [ ] Upload supports drag & drop with progress indicator
- [ ] Photos stored in Vercel Blob storage

## Dependencies

- Stripe subscription system (completed)
- Vercel Blob storage (configured for blog images, reuse for clinic photos)
- Analytics events table (exists, used for privacy-first tracking)

## Related Features

- Stripe webhook handlers (`src/lib/stripe-webhooks.ts`)
- Featured clinic queries (`src/lib/clinic-queries.ts`)
- Owner queries (`src/lib/owner-queries.ts`)
