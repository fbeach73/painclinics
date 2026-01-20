# Requirements: Lead Follow-up System

## Overview

Create an admin leads management system to track contact form submissions from the "Contact the Clinic" form and enable follow-up with clinics to verify leads reached the correct contact.

## Problem Statement

Currently, when patients submit the contact form on clinic detail pages:
- Two emails are sent (to clinic + confirmation to patient)
- Submissions are NOT stored in the database - only email delivery logs exist
- There's no way to track if leads reached the right person at the clinic
- No system for following up with clinics to verify receipt or get correct email endpoints

## Goals

1. **Track all lead submissions** - Store every contact form submission in the database
2. **Easy follow-up workflow** - Admin page to see leads needing follow-up (2+ business days old)
3. **Send follow-up emails** - Compose and send emails to clinics asking if they received the inquiry
4. **Private notes** - Ability to add notes from phone calls with clinics
5. **Status management** - Track lead lifecycle from new → contacted → qualified → closed

## User Stories

### As an admin, I want to:
- See a list of all contact form submissions with clinic name, patient info, and dates
- Filter leads by status (All, Needs Follow-up, New, Contacted, Qualified, Closed)
- Click on a lead to see the full submission details (what was sent to the clinic)
- Send a follow-up email to the clinic asking if they received the inquiry
- Add private notes about phone calls or other follow-up activities
- Update the lead status as I work through the follow-up process
- See email delivery status (did the original email get delivered/opened?)

## Acceptance Criteria

### Lead Storage
- [ ] All contact form submissions are saved to `clinic_leads` table
- [ ] Lead record links to both email logs (clinic email + patient confirmation)
- [ ] Full form data is preserved in JSONB for reference

### Admin List Page (`/admin/leads`)
- [ ] Displays all leads in a table with: Date, Clinic, Patient Name, Email, Status, Follow-up indicator
- [ ] Filter tabs show counts: All | Needs Follow-up | New | Contacted | Qualified | Closed
- [ ] "Needs Follow-up" shows leads 2+ business days old (skip weekends) that haven't been followed up
- [ ] Clicking a row navigates to lead detail page

### Lead Detail Page (`/admin/leads/[leadId]`)
- [ ] Shows clinic information with link to clinic admin page
- [ ] Shows patient contact info (name, email, phone, preferred contact time)
- [ ] Shows medical intake info (pain type, duration, treatment history, insurance)
- [ ] Shows email delivery status for both emails sent
- [ ] Follow-up email compose section with send button
- [ ] Status dropdown to update lead status
- [ ] Notes textarea that saves and persists
- [ ] Displays follow-up history (when followed up, emails sent)

### Follow-up Email
- [ ] Pre-filled template asking if clinic received the inquiry
- [ ] Editable message before sending
- [ ] Sends via Mailgun and logs to emailLogs
- [ ] Auto-marks lead as followed up with timestamp

## Dependencies

- Existing contact form (`/api/contact` route)
- Mailgun email infrastructure
- emailLogs table for delivery tracking
- Admin layout and patterns

## Related Features

- Contact form modal (`src/components/clinic/contact-clinic-modal.tsx`)
- Email templates (`src/emails/`)
- Admin claims page (similar list/detail pattern)
