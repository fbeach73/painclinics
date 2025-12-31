# Requirements: Touch-Ups Batch 1

## Overview

A collection of UI/UX improvements and admin features identified during recent feature implementations. These are refinements to existing functionality that improve usability, consistency, and admin capabilities.

## Features

### 1. Admin Customer Data Table

**What:** A unified admin page to view and manage paying subscribers and clinic claimants.

**Why:** Currently, subscription data and claim data are on separate pages with no admin actions. Admins need a single view to manage customers, cancel test subscriptions, and reverse fraudulent claims.

**Acceptance Criteria:**
- [ ] New `/admin/customers` page accessible from admin sidebar
- [ ] Tab filtering by subscription status (Active, Canceled, Past Due, Expired)
- [ ] Table displays: Clinic Name, Owner Name, Email, Tier, Status, Start Date
- [ ] "Cancel Subscription" action that syncs with Stripe
- [ ] "Reverse Claim" action that removes clinic ownership
- [ ] Confirmation dialogs for destructive actions

### 2. Stripe Thank You Page

**What:** A personalized thank you page shown after successful Stripe checkout.

**Why:** Currently redirects to a generic featured management page. Users should see a clear confirmation with their clinic name and a direct link to their dashboard.

**Acceptance Criteria:**
- [ ] New `/checkout/success` page
- [ ] Receives `session_id` from Stripe and fetches session details
- [ ] Displays clinic name, subscription tier, and billing cycle
- [ ] "Go to Your Clinic Dashboard" button linking to the specific clinic
- [ ] Optional: Link to Stripe Customer Portal for subscription management

### 3. Broadcast Email Manual Target Filter

**What:** Add ability to manually input comma-separated email addresses as broadcast recipients.

**Why:** Admins need to send targeted emails to specific addresses that may not match existing filter criteria (e.g., prospect lists, specific contacts).

**Acceptance Criteria:**
- [ ] New "Manual emails" option in target audience selector
- [ ] Textarea for comma/newline separated email input
- [ ] Basic email format validation
- [ ] Recipient count updates based on valid emails entered
- [ ] Emails sent to manual list when broadcast is executed

### 4. Dashboard UI Audit & Cleanup

**What:** Simplify and standardize dashboard card styling for better readability.

**Why:** Current dashboard has inconsistent colors across light/dark modes, making cards hard to read. Too many color variations create visual noise.

**Acceptance Criteria:**
- [ ] Unified color palette: Primary, Muted, and Amber (featured only)
- [ ] Quick action cards use consistent `bg-muted` backgrounds
- [ ] Icons use `text-muted-foreground` universally
- [ ] Dark mode works correctly without hardcoded color overrides
- [ ] Cards are easy to read in both light and dark themes

### 5. Email Link Fix

**What:** Fix the Featured Listing Activated email to use proper hyperlinks instead of plain text paths.

**Why:** Current email shows "/my-clinics" as plain text, which isn't clickable. Should be a proper hyperlink.

**Acceptance Criteria:**
- [ ] `/my-clinics` text replaced with clickable "Visit your clinic dashboard" link
- [ ] Link uses the full absolute URL passed via `dashboardUrl` prop
- [ ] Link styled appropriately for email (blue, underlined)

## Dependencies

- Stripe API for subscription cancellation (Task 1, Task 2)
- Database schema change for broadcast targeting enum (Task 3)

## Out of Scope (Removed)

- **Map icon differentiation** - Already implemented with gold gradient for premium markers
- **Custom Stripe receipts** - Keeping Stripe's automatic receipt emails
