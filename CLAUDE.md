# Pain Clinics Directory - AI Assistant Guidelines

## Project Overview

Pain Clinics Directory is a comprehensive medical directory site for finding pain management specialists across the United States. Features 5,000+ clinic listings with SEO optimization, admin tools, blog CMS, and business owner portals.

**Live Site**: https://painclinics.com

### Tech Stack

- **Framework**: Next.js 16 with App Router, React 19, TypeScript
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: Better Auth with Google OAuth
- **UI**: shadcn/ui components with Tailwind CSS 4
- **Email**: Mailgun for transactional emails
- **Maps**: Mapbox GL for clinic maps
- **Hosting**: Vercel
- **Analytics**: Custom privacy-first analytics (UTC-04 timezone)

## Project Structure

```
src/
├── app/
│   ├── admin/                    # Admin dashboard
│   │   ├── analytics/           # Traffic analytics
│   │   ├── blog/                # Blog management
│   │   ├── clinics/             # Clinic CRUD
│   │   ├── google-sync/         # Google Places sync
│   │   └── stats/               # Database stats
│   ├── api/
│   │   ├── auth/[...all]/       # Better Auth routes
│   │   ├── analytics/           # Analytics tracking
│   │   ├── admin/               # Admin API endpoints
│   │   └── webhooks/            # External webhooks
│   ├── blog/                    # Blog pages
│   │   ├── [slug]/              # Individual posts
│   │   ├── category/[slug]/     # Category pages
│   │   └── tag/[slug]/          # Tag pages
│   ├── pain-management/         # Directory pages
│   │   ├── [state]/             # State listing
│   │   ├── [state]/[city]/      # City listing
│   │   └── [slug]/              # Individual clinic
│   ├── (owner)/                 # Business owner portal
│   │   └── my-clinics/          # Claimed clinics
│   └── [static pages]           # About, FAQ, etc.
├── components/
│   ├── admin/                   # Admin components
│   ├── blog/                    # Blog components
│   ├── clinics/                 # Clinic display
│   ├── auth/                    # Auth components
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── analytics/               # Analytics utilities
│   ├── blog/                    # Blog queries & utils
│   ├── auth.ts                  # Better Auth config
│   ├── db.ts                    # Database connection
│   ├── schema.ts                # Drizzle schema
│   ├── structured-data.ts       # JSON-LD schemas
│   └── email/                   # Email templates
└── types/                       # TypeScript types
```

## Key Database Tables

- `clinics` - Main clinic listings (5,000+ records)
- `blog_posts`, `blog_categories`, `blog_tags` - Blog CMS
- `analytics_events` - Privacy-first pageview tracking
- `clinic_claims` - Ownership claim requests
- `not_found_logs` - 404 error tracking
- `sync_schedules`, `sync_logs` - Google Places sync

## Environment Variables

Required (see `.env.example`):

```env
POSTGRES_URL=              # Neon PostgreSQL connection
BETTER_AUTH_SECRET=        # Auth secret (32+ chars)
GOOGLE_CLIENT_ID=          # OAuth client ID
GOOGLE_CLIENT_SECRET=      # OAuth client secret
GOOGLE_PLACES_API_KEY=     # Google Places API
MAILGUN_API_KEY=           # Mailgun API key
MAILGUN_DOMAIN=            # Mailgun sending domain
NEXT_PUBLIC_APP_URL=       # https://painclinics.com
NEXT_PUBLIC_MAPBOX_TOKEN=  # Mapbox public token
```

## Available Scripts

```bash
pnpm dev          # Start dev server (user runs this)
pnpm build        # Production build
pnpm lint         # Run ESLint (ALWAYS run after changes)
pnpm typecheck    # TypeScript check (ALWAYS run after changes)
pnpm db:push      # Push schema to database
pnpm db:studio    # Open Drizzle Studio GUI
pnpm db:generate  # Generate migrations
```

## Guidelines for AI Assistants

### Critical Rules

1. **ALWAYS run lint and typecheck** after changes:
   ```bash
   pnpm lint && pnpm typecheck
   ```

2. **NEVER start the dev server yourself** - ask user if needed

3. **Database**:
   - Use Drizzle ORM from `@/lib/db`
   - Schema in `@/lib/schema.ts`
   - PostgreSQL syntax (not SQLite/MySQL)

4. **Styling**:
   - Use shadcn/ui components
   - Tailwind utility classes
   - Support dark mode (`dark:` variants)

5. **SEO**:
   - Use structured data from `@/lib/structured-data.ts`
   - Maintain redirects in `next.config.ts`
   - Check 404 logs for broken links

6. **Authentication**:
   - Server: `import { auth } from "@/lib/auth"`
   - Client: `import { useSession } from "@/lib/auth-client"`
   - Admin routes require `role === "admin"`

### Common Tasks

**Adding a clinic page feature:**
1. Update component in `src/components/clinics/`
2. Modify page in `src/app/pain-management/[slug]/`
3. Test with `pnpm lint && pnpm typecheck`

**Adding structured data:**
1. Add generator in `src/lib/structured-data.ts`
2. Import and use in page component
3. Test with Google Rich Results Test

**Blog operations:**
1. Blog queries in `src/lib/blog/blog-queries.ts`
2. Components in `src/components/blog/`
3. Admin management in `src/app/admin/blog/`

**Analytics:**
1. Tracking in `src/lib/analytics/`
2. Bot filtering in `src/lib/analytics/bot-filter.ts`
3. Uses UTC-04 (AST) for date boundaries

**Redirects:**
1. Add to `next.config.ts` redirects array
2. Use permanent: true for 301 redirects
3. Check 404 logs in admin for patterns

### Directory-Specific Patterns

- Clinic URLs: `/pain-management/[clinic-slug]`
- State URLs: `/pain-management/[state-abbrev]`
- City URLs: `/pain-management/[state-abbrev]/[city-slug]`
- Blog URLs: `/blog/[post-slug]`
- Sitemap: Dynamic generation in `src/app/sitemap.ts`

## Package Manager

This project uses **pnpm**. Always use `pnpm` commands, not `npm`.
