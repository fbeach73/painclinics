# Requirements: AdSense Manual Ad Placements (Data-Optimized)

## Overview

Implement manual AdSense ad placements based on actual performance data analysis. Focus on proven high-performers while keeping auto-ads for formats that already work well.

## Data-Driven Decision Summary

Analysis of Nov 28 - Dec 27, 2025 data revealed:

| Insight | Data Point | Strategic Decision |
|---------|------------|-------------------|
| Mobile dominates | 74% of revenue, $51.63 RPM vs $8.96 desktop | Mobile-first approach |
| Anchor ads win | $245 earnings, 95% viewability, $18.58 RPM | Priority #1 ad unit |
| Dynamic sizing best | $481 earnings from responsive ads | No fixed sizes |
| Vignettes work | $72, $20.97 RPM on auto-placement | Keep on auto-ads |
| In-page needs help | $221 but only 39% viewability | Better positioning |
| Desktop sidebar low ROI | Only $8.96 RPM | Skip sidebar ads |

## Goals

1. Implement manual anchor ad (top performer) globally
2. Add strategically-placed in-page ads with better viewability positioning
3. Keep auto-ads running for vignettes (proven effective)
4. Maintain mobile-first design (74% of revenue)
5. Use only responsive/dynamic ad sizing

## Ad Units to Create

| Unit | Type | Format | Rationale |
|------|------|--------|-----------|
| painclinics-anchor | Anchor | Responsive | #1 performer - $245, 95% viewability |
| painclinics-in-page | Display | Responsive | Volume driver, needs better placement |

**Units NOT creating:**
- Sidebar ads (desktop RPM too low)
- Multiplex (auto-ads handle well)
- Fixed-size ads (dynamic outperforms)

## Target Pages

- **Clinic detail pages** - Highest value, 2 in-page placements
- **State listing pages** - 1 in-page placement
- **City listing pages** - 1 in-page placement
- **Homepage** - 1 in-page placement (minimal, drive traffic to clinic pages)
- **All pages** - Global anchor ad via layout

## Acceptance Criteria

- [ ] 2 ad units created in AdSense dashboard (anchor + in-page)
- [ ] Anchor ad appears on all pages (via root layout)
- [ ] In-page ads positioned for higher viewability (above fold where possible)
- [ ] All ads use responsive sizing
- [ ] Auto-ads vignettes remain enabled
- [ ] Mobile experience prioritized
- [ ] In-page viewability improves from 39% baseline
- [ ] No significant CLS impact

## Success Metrics (Week 1)

| Metric | Baseline | Target |
|--------|----------|--------|
| In-page viewability | 39% | 60%+ |
| Anchor viewability | 95% | Maintain |
| Mobile RPM | $51.63 | Maintain or improve |
| Daily earnings | ~$18 | Increase |

## Dependencies

- Google AdSense account (ca-pub-5028121986513144)
- Slot IDs from new ad units
- Auto-ads enabled for vignettes

## Out of Scope

- Sidebar ads (data shows poor ROI)
- Multiplex ads (auto-ads work well)
- Fixed ad sizes (dynamic performs better)
- Desktop-specific optimizations (mobile is priority)
