# Action Required: Checkpoint Review Fixes

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [ ] **Ensure `REVALIDATE_SECRET` is set in Vercel** - After removing the hardcoded fallback, the env var must exist or revalidation will fail

## During Implementation

- [ ] **Run database migration after schema changes** - Execute `pnpm db:push` to create the webhook_events table

## After Implementation

- [ ] **Verify Stripe webhook events in dashboard** - Check that new webhook types (invoice.payment_failed) are enabled in Stripe webhook settings if not already
- [ ] **Test payment failure flow** - Use Stripe test mode to verify payment failure emails are sent correctly

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`
