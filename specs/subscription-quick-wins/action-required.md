# Action Required: Subscription Quick Wins

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [ ] **Get Google Adsense exclusion URL** - Needed for the admin notification email. Navigate to Google Adsense > Sites > URL exclusions to get your specific URL with publisher ID.

## After Implementation

- [ ] **Set `ADSENSE_EXCLUSION_URL` environment variable** - Add your Adsense URL to Vercel environment variables so admin emails include the correct link.

- [ ] **Test subscription flow** - Create a test subscription via Stripe test mode to verify both emails are sent correctly.

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`
