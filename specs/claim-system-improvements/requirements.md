# Requirements: Clinic Claiming System Improvements

## Overview

Enhancements to the existing clinic claiming and verification system to improve admin workflow, user experience, and email branding consistency.

## Features

### 1. Admin Email Notification on New Claims

**What:** Send an email notification to admins when a user submits a new clinic claim request.

**Why:** Admins need timely awareness of pending claims to review and process them efficiently.

**Acceptance Criteria:**
- Email sent to admin addresses (`kyle@freddybeach.com`, `hello@painclinics.com`) when a claim is submitted
- Email includes: clinic name, claimant name, claimant email, role, submission timestamp
- Email uses consistent branding with other system emails
- Email is logged in the `email_logs` table for tracking

### 2. Admin Clinic Ownership Management

**What:** Allow admins to remove user ownership from a clinic, making it available for claiming again.

**Why:** Needed for handling ownership transfers, disputes, or when business ownership changes hands.

**Acceptance Criteria:**
- New "Ownership" section in admin clinic details page
- Display current owner info (name, email) when clinic is owned
- Display "Unclaimed" badge when clinic has no owner
- "Remove Ownership" button with confirmation dialog
- Confirmation lists consequences: removes owner, clears verification status, makes clinic claimable
- User's `clinic_owner` role is NOT demoted (they may own other clinics)
- Action is logged for audit purposes

### 3. Dashboard Link for Clinic Owners

**What:** Add "My Clinics" link in the user profile dropdown menu for users with `clinic_owner` role.

**Why:** Clinic owners need easy access to their dashboard without navigating manually.

**Acceptance Criteria:**
- Profile dropdown shows "My Clinics" link for users with `clinic_owner` or `admin` role
- Link navigates to `/my-clinics`
- Uses `Building2` icon from lucide-react
- Positioned after "Your Profile" and before admin section (if applicable)
- Does not show for regular `user` role

### 4. Email Branding Updates

**What:** Update email header branding from "Pain Clinics Directory" to "Painclinics.com".

**Why:** Strengthen domain-based brand recognition while maintaining established footer branding.

**Acceptance Criteria:**
- Email header displays "Painclinics.com" instead of "Pain Clinics Directory"
- Footer text remains "Pain Clinics Directory" (unchanged)
- Copyright line remains "Pain Clinics Directory" (unchanged)
- Change applies to all emails using `EmailLayout` component

## Dependencies

- Existing email system (`src/lib/email.ts`, `src/emails/`)
- Existing claim submission flow (`src/app/api/claims/route.ts`)
- Existing admin clinic management (`src/app/admin/clinics/[clinicId]/`)
- Existing user profile component (`src/components/auth/user-profile.tsx`)
- Better Auth authentication system

## Related Features

- Clinic claiming flow (`src/components/clinic/claim-form-modal.tsx`)
- Admin claims review (`src/app/admin/claims/`)
- Owner dashboard (`src/app/(owner)/my-clinics/`)
