# Action Required: Direct Ad Server

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [ ] **No external accounts or API keys needed** - The ad server is fully self-contained within the existing painclinics.com infrastructure

## During Implementation

- [ ] **Run `pnpm db:push`** - Apply the new ad server tables to the production database after schema changes are merged
- [ ] **Run `pnpm tsx scripts/seed-ad-placements.ts`** - Seed the 5 default placement slots and global settings row

## After Implementation

- [ ] **Create first test campaign in admin** - Add a campaign with at least one creative to verify the system works end-to-end
- [ ] **Prepare advertiser creatives** - Gather optimized WebP/PNG images and destination URLs from advertisers before going live
- [ ] **Configure S2S postback URLs with advertisers** - Provide each advertiser with the postback template: `https://painclinics.com/api/ads/postback?click_id={CLICK_ID}&payout={PAYOUT}`
- [ ] **Set global ad server percentage** - Start with a low percentage (e.g., 10%) via admin dashboard to A/B test before scaling up

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`
