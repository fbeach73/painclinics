# Requirements: Transactional Email System with Mailgun

## Overview

Implement a comprehensive transactional email system using Mailgun with React Email templates, database logging, webhook tracking, unsubscribe management, and admin analytics dashboard.

## Background

The project already has Mailgun integrated (`mailgun.js` v12.4.0) with 6 inline HTML email templates in `/src/lib/email.ts`. The claim workflow emails (submitted/approved/rejected) are working. However, featured listing and subscription emails exist but aren't triggered by Polar webhooks. The system lacks email logging, modern templating, and analytics.

## Goals

1. **Modernize email templates** - Migrate from inline HTML strings to React Email components for maintainability
2. **Track email delivery** - Log all emails to database and track delivery/bounce/complaint status via webhooks
3. **CAN-SPAM compliance** - Add proper unsubscribe management with token-based links
4. **Wire payment emails** - Connect Polar subscription events to appropriate email triggers
5. **Admin visibility** - Create dashboard for email analytics and troubleshooting

## Acceptance Criteria

### Email Templates
- [ ] 9 React Email templates created (claim verification, claim approved, claim rejected, featured welcome, featured renewal, payment failed, subscription canceled, welcome, password reset)
- [ ] All templates use shared layout component with consistent branding
- [ ] Templates are mobile-responsive with 44px+ touch targets
- [ ] CAN-SPAM compliant footer with unsubscribe link and physical address placeholder

### Email Logging
- [ ] All sent emails are logged to `email_logs` table
- [ ] Logs capture: recipient, template, subject, Mailgun message ID, status, timestamps
- [ ] Failed sends are logged with error messages

### Mailgun Webhooks
- [ ] Webhook endpoint receives delivery events from Mailgun
- [ ] Email status updates: delivered, opened, clicked, bounced, complained, failed
- [ ] Webhook signature verification implemented

### Unsubscribe Management
- [ ] Each user has unique unsubscribe token
- [ ] Unsubscribe page marks user as unsubscribed
- [ ] Marketing emails respect unsubscribe status (transactional emails always sent)

### Polar Integration
- [ ] Featured welcome email sent on subscription activation
- [ ] Subscription canceled email sent on cancellation
- [ ] Payment failed email sent on payment failure (already wired)

### Admin Dashboard
- [ ] Email logs table with filtering by status, template, date
- [ ] Summary metrics: total sent, delivery rate, bounce rate, complaint rate
- [ ] Emails nav item in admin sidebar

### BetterAuth Integration
- [ ] Welcome email sent to new users on registration

## Dependencies

- Existing Mailgun integration (`mailgun.js` v12.4.0)
- Existing Polar integration (`@polar-sh/better-auth`)
- Existing BetterAuth setup (`/src/lib/auth.ts`)
- User must add `MAILGUN_WEBHOOK_SIGNING_KEY` env var
- User will update `COMPANY_ADDRESS` placeholder for CAN-SPAM

## Related Features

- Clinic Claiming System (uses claim emails)
- Featured Listings (uses subscription emails)
- Polar Payments (webhook triggers)
