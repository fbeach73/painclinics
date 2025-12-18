# Requirements: WordPress Blog Migration

## Overview

Migrate all blog posts from the WordPress site (painclinics.com) to the Next.js application before shutting down WordPress. The migration must preserve SEO value by maintaining URL structure (via redirects), original publish dates, and all content including images.

## Background

- WordPress blog at painclinics.com has blog posts accessible via sitemaps
- Blog sitemaps: `post-sitemap1.xml`, `post-sitemap2.xml`
- WordPress REST API available for data extraction
- Next.js already has Vercel Blob storage configured for images
- The Next.js app currently has NO blog system - it's a clinic directory

## Goals

1. **Zero content loss** - All posts, categories, tags, and images migrated
2. **SEO preservation** - 301 redirects from old URLs, original dates preserved
3. **Image reliability** - All images hosted on Vercel Blob (no WordPress dependencies)
4. **Admin visibility** - Migration progress trackable via admin interface
5. **Safe shutdown** - WordPress can be decommissioned after migration

## Functional Requirements

### Blog Content Migration

- Extract all blog posts from WordPress via REST API
- Preserve post titles, content (HTML), excerpts
- Preserve publish dates and modified dates
- Migrate categories (including hierarchy) and tags
- Download all images (featured + inline) to Vercel Blob
- Update image URLs in content to use Blob URLs
- Update internal links (WordPress URLs → Next.js URLs)

### URL Strategy

- **WordPress URLs**: Posts at root level (`/post-slug/`)
- **Next.js URLs**: Posts at `/blog/post-slug`
- **301 Redirects**: Automatic redirects from old URLs to new URLs
- Categories at `/blog/category/[slug]`
- Tags at `/blog/tag/[slug]`

### Admin Migration Interface

- Located at `/admin/blog/migration`
- Step 1: Discover - Fetch sitemaps, show post count
- Step 2: Preview - Show what will be imported
- Step 3: Execute - Real-time progress via SSE
- Step 4: Results - Success/error counts, CSV export
- Support for rollback (delete posts by import batch)

### Public Blog Pages

- Blog listing at `/blog` with pagination
- Individual posts at `/blog/[slug]`
- Category archives at `/blog/category/[slug]`
- Tag archives at `/blog/tag/[slug]`
- SEO metadata (meta title, description, OG images)
- Sidebar with categories, tags, recent posts

## Non-Functional Requirements

### Performance

- Batch processing for large migrations
- SSE streaming for real-time progress (no polling)
- Image downloads with retry logic

### Reliability

- Idempotent migration (can re-run safely)
- Skip already-imported posts by WordPress ID
- Continue from failures without losing progress
- Detailed error logging with export capability

### SEO

- Preserve original publish dates (wpCreatedAt → publishedAt)
- Generate 301 redirect config for next.config.ts
- Proper meta tags and structured data (Article schema)

## Data Requirements

### Per Post

- Title, slug, content (HTML)
- Excerpt (meta description)
- Published date, modified date
- Author name
- Categories (with hierarchy)
- Tags
- Featured image
- All inline content images
- WordPress post ID (for deduplication)

### Migration Tracking

- Import batch records with status
- Success/error/skip counts
- Image URL mapping (WordPress → Blob)
- Detailed error log

## Acceptance Criteria

- [ ] All posts from both sitemaps are imported
- [ ] Zero broken images in migrated content
- [ ] Post slugs match WordPress exactly
- [ ] 301 redirects generated for all posts
- [ ] Categories and tags created and linked correctly
- [ ] Internal links in content updated to Next.js URLs
- [ ] Original publish dates preserved
- [ ] Admin can track migration progress in real-time
- [ ] Migration report available as CSV download
- [ ] Blog listing page shows all posts with pagination
- [ ] Individual post pages render correctly with images
- [ ] Category and tag archive pages work

## Dependencies

- Existing Vercel Blob storage configuration (`src/lib/storage.ts`)
- Existing admin authentication (`requireAdmin()`, `checkAdminApi()`)
- Existing SSE streaming pattern (`src/app/api/admin/import/execute/route.ts`)
- WordPress REST API access (no authentication required for public posts)

## Out of Scope

- Comments migration (WordPress comments not being migrated)
- Author user accounts (author names stored as text, not linked to users)
- WordPress media library (only images referenced in posts)
- Blog post editing in admin (separate feature)
