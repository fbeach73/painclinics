# Action Required: CSV Import System Overhaul

Manual steps that must be completed by a human. These cannot be automated.

## Before Implementation

- [ ] **Obtain placeholder image** - Need a 500x500 generic medical/clinic placeholder image for `public/images/clinic-placeholder.png`. Can use stock photo, icon, or simple design.

## During Implementation

None required - all implementation can be automated.

## After Implementation

- [ ] **Re-import clinics with new pipeline** - After implementation is complete, re-import CSV data to populate the new fields (existing clinics won't have the new data until re-imported or manually updated)

- [ ] **Verify AI content generation** - Test that AI content generation (amenities, services descriptions) properly uses the `allReviewsText` field for context

---

> **Note:** These tasks are also listed in context within `implementation-plan.md`
