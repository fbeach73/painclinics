# Pain Clinics Directory

A comprehensive directory for finding pain management specialists across the United States. Built with Next.js 16, featuring SEO optimization, admin tools, and business owner portals.

## Features

- **Clinic Directory**: Browse 5,000+ pain management clinics by state and city
- **SEO Optimized**: Structured data, dynamic sitemaps, meta optimization
- **Blog System**: Full CMS with WordPress migration support
- **Admin Dashboard**: Analytics, clinic management, sync tools
- **Owner Portal**: Claim and manage clinic listings
- **Google Places Integration**: Automated review and data sync

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth with Google OAuth
- **UI**: shadcn/ui + Tailwind CSS 4
- **Email**: Mailgun transactional emails
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon, Vercel Postgres, or local)
- pnpm package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/fbeach73/painclinics.git
cd painclinics

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables

See `.env.example` for required variables:
- `POSTGRES_URL` - Database connection string
- `BETTER_AUTH_SECRET` - Auth secret key
- `GOOGLE_CLIENT_ID/SECRET` - OAuth credentials
- `MAILGUN_API_KEY` - Email service
- `NEXT_PUBLIC_APP_URL` - Site URL

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── blog/              # Blog pages
│   ├── pain-management/   # State/city/clinic pages
│   └── (owner)/           # Business owner portal
├── components/            # React components
├── lib/                   # Utilities and configs
└── types/                 # TypeScript types
```

## Scripts

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript check
pnpm db:push      # Push schema changes
pnpm db:studio    # Open Drizzle Studio
```

## License

Private repository. All rights reserved.
