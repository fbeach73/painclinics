# Action Required: AdSense Manual Ad Placements

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [ ] **Create "painclinics-anchor" ad unit in AdSense** - Your top performer ($245, 95% viewability). Go to Ads > By ad unit > Anchor ads > Create.

- [ ] **Create "painclinics-in-page" ad unit in AdSense** - Display ad with responsive format. Go to Ads > By ad unit > Display ads > Create.

- [ ] **Copy slot IDs** - After creating each unit, copy the `data-ad-slot` value for the code implementation.

## During Implementation

- [ ] **Add slot IDs to AD_SLOTS config** - Update `src/components/ads/adsense.tsx` with the actual slot ID values.

## After Implementation

- [ ] **Adjust auto-ads settings** - Go to AdSense > Ads > By site > painclinics.com:
  - Turn OFF auto "Anchor ads" (to avoid duplicates with manual anchor)
  - Keep "Vignette ads" ON (they perform well at $20.97 RPM)

- [ ] **Test on mobile device** - Mobile is 74% of revenue. Verify:
  - Anchor ad is visible but not obstructing content
  - In-page ads render correctly
  - No layout shift issues

- [ ] **Monitor metrics after 1 week** - Check AdSense dashboard for:
  - In-page viewability (target: improve from 39% to 60%+)
  - Anchor viewability (target: maintain 95%)
  - Mobile RPM (target: maintain $51.63+)

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`
