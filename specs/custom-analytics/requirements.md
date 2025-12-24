# Requirements: Custom Analytics System

## Overview

Build a privacy-first, bot-resistant analytics system to replace reliance on GA4 (which is vulnerable to measurement protocol spam). The system tracks pageviews, referrer sources, and clinic profile views with dashboards for both site administrators and clinic owners.

## Problem Statement

GA4 is being polluted with fake bot traffic from cities like Lanzhou (China) via measurement protocol spam. These bots send fake hits directly to Google's servers without visiting the actual site, making server-side blocking ineffective. A custom analytics solution provides:

1. Full control over data collection and validation
2. Bot filtering at the point of collection
3. Clean data for business decisions
4. Value-add feature for clinic owners (profile analytics)

## Goals

1. **Privacy-first**: No cookies, no localStorage, no PII storage
2. **Bot-resistant**: Server-side UA filtering before recording
3. **Simple but expandable**: Start with core metrics, add more over time
4. **Dual audience**: Admin dashboard + clinic owner widget
5. **Forever retention**: Keep all historical data

## Features

### Admin Analytics Dashboard (`/admin/analytics`)

- **Overview Stats**: Total pageviews, unique visitors (today, 7d, 30d, all-time)
- **Referrer Sources**: Table showing traffic sources (Google, direct, Facebook, etc.) with counts
- **Top Pages**: Most viewed pages with view counts and unique visitors
- **Views Over Time**: Line chart showing traffic trends
- **Date Range Filter**: Select time period for all metrics

### Clinic Owner Analytics Widget

Compact card embedded in `/my-clinics/[clinicId]` page showing:

- Total profile views (30 days)
- Unique visitors count
- Sparkline chart of views over time
- Top referrer sources as badges

### Tracking System

- Lightweight client-side tracker component
- Server-side validation and bot filtering
- Automatic referrer categorization
- Privacy-safe session fingerprinting (hashed, non-reversible)

## Acceptance Criteria

### Tracking
- [ ] Pageviews are recorded for all site pages
- [ ] Clinic profile views are linked to the specific clinic
- [ ] Bot traffic (common UA patterns) is filtered out
- [ ] Referrers are automatically categorized (google, facebook, direct, etc.)
- [ ] Session fingerprints are hashed (no way to identify individuals)
- [ ] Tracking does not block page rendering

### Admin Dashboard
- [ ] Shows total pageviews and unique visitors
- [ ] Shows top referrer sources with counts
- [ ] Shows top pages by views
- [ ] Displays line chart of views over time
- [ ] Supports date range filtering (today, 7d, 30d, all-time)
- [ ] Only accessible to admin users

### Owner Widget
- [ ] Shows profile views for the specific clinic
- [ ] Shows unique visitor count
- [ ] Displays sparkline of views over time
- [ ] Shows top referrer sources
- [ ] Only shows data for clinics the user owns

## Non-Goals (Out of Scope)

- Real-time analytics (batch is fine)
- Conversion tracking / funnels
- A/B testing
- Heatmaps or session recordings
- Data export functionality (can add later)
- Automatic data cleanup/retention policies

## Dependencies

- Existing PostgreSQL database with Drizzle ORM
- Existing admin authentication (`checkAdminApi`)
- Existing owner authentication (`requireClinicOwnership`)
- shadcn/ui component library
- Recharts for visualizations (to be installed)

## Related Features

- Admin stats page (`/admin/stats`) - pattern to follow
- Owner dashboard (`/my-clinics/[clinicId]`) - integration point
- Turnstile verification (`src/lib/turnstile.ts`) - similar validation pattern
