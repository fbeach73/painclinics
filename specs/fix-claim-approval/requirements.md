# Requirements: Fix Clinic Claim Approval Process

## Problem Statement

The clinic claim approval process is broken. When an admin attempts to approve a pending claim at `/admin/claims/`, the operation fails with "Failed to approve claim" error. This results in:

1. No email notification sent to the claimant
2. Clinic ownership not transferred
3. User role not updated to `clinic_owner`
4. User cannot access their claimed clinic in `/my-clinics` dashboard

## Background

The claim flow involves:
1. User submits claim via `/api/claims` (works correctly)
2. Claim appears in admin dashboard at `/admin/claims/` (works correctly)
3. Admin reviews and approves claim (FAILS)
4. System should: update claim status, transfer clinic ownership, update user role, expire competing claims, send approval email

## Root Cause

The `approveClaim()` function performs 5 sequential database operations without a transaction. If any operation fails, previous operations are not rolled back, leaving the database in an inconsistent state. Current error handling provides no visibility into which step failed.

## Acceptance Criteria

### Functional
- [ ] Admin can successfully approve pending claims
- [ ] Claim status updates to "approved"
- [ ] Clinic `ownerUserId` is set to the claimant's user ID
- [ ] Clinic `isVerified` is set to `true`
- [ ] Clinic `claimedAt` is set to current timestamp
- [ ] User role updates to `clinic_owner` (if not already admin)
- [ ] Other pending claims for the same clinic are expired
- [ ] Approval email is sent to claimant's business email
- [ ] Claimant can access `/my-clinics` and see their clinic

### Technical
- [ ] All database operations wrapped in a transaction (atomic)
- [ ] If any DB operation fails, all changes are rolled back
- [ ] Email sending happens outside transaction (failures don't affect DB)
- [ ] Detailed error logging identifies which step failed
- [ ] API returns specific error messages for debugging

### Error Handling
- [ ] Each step logs start/completion with context (claimId, userId, clinicId)
- [ ] Failed steps log full error details
- [ ] API response includes which step failed (when applicable)
- [ ] Client displays meaningful error messages to admin

## Dependencies

- Drizzle ORM transaction support
- Existing email infrastructure (Mailgun)
- Better Auth session management

## Related Files

- `src/lib/claim-queries.ts` - Core approval logic
- `src/app/api/admin/claims/[claimId]/approve/route.ts` - API endpoint
- `src/app/admin/claims/[claimId]/claim-actions.tsx` - Admin UI
- `src/lib/email.ts` - Email sending functions
- `src/lib/session.ts` - Role-based access control
