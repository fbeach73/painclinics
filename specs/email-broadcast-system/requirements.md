# Requirements: Email Broadcast System

## Overview

Build an admin interface to create and send HTML email broadcasts to clinic listings that have email addresses in the database. This enables marketing communications, announcements, and engagement with the ~3,185 clinics that have verified emails.

## Goals

1. **Create email campaigns** with rich HTML content using the existing Tiptap editor
2. **Target specific audiences** using filters (all clinics, featured only, by state, by subscription tier)
3. **Test before sending** with preview and test email functionality
4. **Track performance** with delivery, open, and click analytics
5. **Manage attachments** via Vercel Blob storage
6. **Respect rate limits** using Mailgun Foundation tier (300 emails/min)

## User Stories

### As an admin, I want to:
- Create a new email broadcast with subject, HTML content, and optional attachments
- Preview how the email will look before sending
- Select which clinics receive the email using filters
- See a count of recipients before sending
- Send a test email to myself to verify formatting
- Send the broadcast to all selected recipients
- View delivery statistics (sent, delivered, opened, clicked, bounced)
- Duplicate a previous broadcast to create a new one
- Save drafts and continue editing later

## Acceptance Criteria

### Email Creation
- [ ] Rich text editor (Tiptap) for HTML email content
- [ ] Subject line input with preview
- [ ] Preheader/preview text field
- [ ] Attachment upload to Vercel Blob (PDF, images)
- [ ] Auto-save draft functionality

### Recipient Targeting
- [ ] Filter: All clinics with email
- [ ] Filter: Featured clinics only (basic/premium tier)
- [ ] Filter: By state (multi-select)
- [ ] Filter: By subscription status (active/expired/none)
- [ ] Live recipient count preview
- [ ] Exclude previously unsubscribed emails

### Sending
- [ ] Test send to admin email address
- [ ] Batch sending with rate limiting (300/min)
- [ ] Progress indicator during send
- [ ] Automatic unsubscribe footer in all emails

### Analytics
- [ ] Total recipients count
- [ ] Sent/delivered/failed counts
- [ ] Open rate tracking
- [ ] Click rate tracking
- [ ] Bounce/complaint tracking
- [ ] Per-recipient status view

### Management
- [ ] List all broadcasts with status
- [ ] Edit drafts
- [ ] Duplicate existing broadcasts
- [ ] Delete drafts
- [ ] View completed broadcast details

## Dependencies

### Existing Infrastructure (Ready)
- Mailgun integration (`src/lib/email.ts`)
- Email logging system (`emailLogs` table)
- Unsubscribe token system
- Tiptap rich text editor
- Vercel Blob file storage
- Admin authentication

### New Components (To Build)
- `emailBroadcasts` database table
- Broadcast service with rate limiting
- Admin UI pages (list, create, view)
- API routes for CRUD + send operations
- Broadcast email template

## Out of Scope (v1)
- Scheduled sends (future enhancement)
- A/B testing
- Email templates library
- Automated drip campaigns
- Integration with external CRM

## Technical Constraints

- **Mailgun Foundation tier**: 50k emails/month, 300 emails/minute
- **Batch strategy**: 50 emails per batch, 200ms delay = ~250/min (safe margin)
- **3,185 clinics with emails** = ~13 minutes to send to all
- **Must respect unsubscribe preferences** from user table
