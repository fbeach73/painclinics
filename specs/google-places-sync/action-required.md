# Action Required: Google Places Sync

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [ ] **Set up Google Cloud Project with Places API (New)** - Required for API access. Go to Google Cloud Console, enable "Places API (New)", create API key with appropriate restrictions.

- [ ] **Add GOOGLE_PLACES_API_KEY to environment** - Add the API key to `.env.local` and Vercel environment variables for the API client to authenticate.

- [ ] **Add CRON_SECRET to environment** - Generate a random 32-character secret for securing the cron endpoint. Add to `.env.local` and Vercel environment variables.

## During Implementation

- [ ] **Review Google Places API billing tier** - Reviews data requires the "Atmosphere" tier which has additional cost. Confirm budget allocation for expected API usage.

## After Implementation

- [ ] **Configure Vercel Cron in production** - After deploying `vercel.json`, verify cron job is registered in Vercel dashboard under Settings > Cron Jobs.

- [ ] **Test API key restrictions** - Ensure API key has appropriate HTTP referrer or IP restrictions for production security.

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`
