# Action Required: Featured Subscription Benefits

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [ ] **Verify Vercel Blob storage is configured** - Required for photo uploads in Phase 6. Check `BLOB_READ_WRITE_TOKEN` env var exists.

## During Implementation

- [ ] **Remove ads from Adsense for featured clinic pages** - When admin email is received with clinic slug, manually add exclusion rule in Google Adsense for that URL path (`/pain-management/{slug}`).

## After Implementation

- [ ] **Test Stripe webhook flow end-to-end** - Purchase a test subscription and verify admin email is received with correct clinic slug.
- [ ] **Verify analytics data exists** - Check analytics_events table has data for clinic pages before testing analytics dashboard.

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`
