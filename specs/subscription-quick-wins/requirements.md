# Requirements: Subscription Quick Wins

## Overview

Post-subscription enhancements to improve admin workflow, user experience, and subscription visibility. These are "quick wins" following the completion of the featured subscription benefits feature.

## Goals

1. **Admin Notification**: Alert administrators when new subscriptions are created so they can remove Adsense from paid clinic pages
2. **User Thank You**: Send a warm, personal thank you email to new subscribers with a direct link to their dashboard
3. **Subscription Visibility**: Show subscription status directly in the /my-clinics page with easy access to management

## User Stories

### Admin Notification
> As an **administrator**, I want to receive an email notification when a clinic subscribes, including the clinic's URL slug and a link to Google Adsense exclusion settings, so I can quickly remove ads from their page.

### User Thank You
> As a **subscriber**, I want to receive a personalized thank you email after subscribing, with a direct link to my dashboard, so I feel valued and can easily access my clinic management tools.

### Subscription Badge
> As a **clinic owner** with an active subscription, I want to see my subscription tier (Basic/Premium) displayed in the /my-clinics page with a link to manage it, instead of seeing "Get Featured" prompts.

## Acceptance Criteria

### Task 1: Admin Notification Email
- [ ] Email sent to admin when `subscription.create` event fires
- [ ] Email includes: clinic name, tier (Basic/Premium), billing cycle (Monthly/Annual), customer email
- [ ] Email includes clinic slug in format `/pain-management/{slug}` for easy reference
- [ ] Email includes direct link to Google Adsense exclusion settings
- [ ] Email follows existing admin notification template pattern
- [ ] Email logged to `email_logs` table

### Task 2: User Thank You Email
- [ ] Separate email sent (in addition to existing featured-welcome email)
- [ ] Warm, personal thank you message
- [ ] Includes clinic name and subscription tier
- [ ] Includes direct CTA link to `/my-clinics` dashboard
- [ ] Includes support contact (hello@painclinics.com)
- [ ] Professional signature from "The Pain Clinics Directory Team"
- [ ] Email logged to `email_logs` table

### Task 3: /my-clinics UI Update
- [ ] For clinics with `isFeatured=true` and active tier: Show clickable tier badge
- [ ] Badge displays "Basic" or "Premium" based on `featuredTier`
- [ ] Badge styled consistently with existing featured badges (amber colors)
- [ ] Badge links to `/my-clinics/{clinicId}/featured` for subscription management
- [ ] Badge has hover state indicating it's clickable
- [ ] For clinics without subscription: Continue showing "Get Featured" button (existing behavior)

## Dependencies

- Existing featured subscription system (completed)
- Stripe webhook handlers in `src/lib/stripe-webhooks.ts`
- Email infrastructure via Mailgun in `src/lib/email.ts`
- React Email templates in `src/emails/`

## Out of Scope

- Sales page feature delivery (marked for separate `/create-feature`)
- Subscription cancellation handling (already implemented)
- Failed payment handling (already implemented)
- Admin subscriptions dashboard (already exists at `/admin/subscriptions`)
