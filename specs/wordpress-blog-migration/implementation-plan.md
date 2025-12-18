# Implementation Plan: WordPress Blog Migration

## Overview

Build a complete blog migration system to transfer all posts from WordPress (painclinics.com) to Next.js. This includes database schema, WordPress API integration, image migration to Vercel Blob, admin migration interface with real-time progress, and public blog pages.

---

## Phase 1: Database Schema

Add blog-related tables to the PostgreSQL database using Drizzle ORM.

### Tasks

- [x] Add blog post status enum to schema
- [x] Create `blogPosts` table with all required fields
- [x] Create `blogCategories` table with hierarchy support
- [x] Create `blogTags` table
- [x] Create `blogPostCategories` junction table
- [x] Create `blogPostTags` junction table
- [x] Create `blogImportBatches` table for migration tracking
- [x] Add relations for all blog tables
- [x] Generate and run database migration

### Technical Details

**File to modify:** `src/lib/schema.ts`

**Blog Post Status Enum:**
```typescript
export const blogPostStatusEnum = pgEnum("blog_post_status", [
  "draft",
  "published",
  "archived",
]);
```

**blogPosts Table:**
```typescript
export const blogPosts = pgTable(
  "blog_posts",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    wpId: integer("wp_id").unique(), // WordPress ID for deduplication
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(), // Must match WordPress exactly
    content: text("content").notNull(), // Processed HTML with Blob URLs
    excerpt: text("excerpt"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    featuredImageUrl: text("featured_image_url"), // Vercel Blob URL
    featuredImageAlt: text("featured_image_alt"),
    wpFeaturedImageUrl: text("wp_featured_image_url"), // Original WP URL
    authorName: text("author_name"),
    authorSlug: text("author_slug"),
    status: blogPostStatusEnum("status").default("published").notNull(),
    publishedAt: timestamp("published_at"),
    wpCreatedAt: timestamp("wp_created_at"),
    wpModifiedAt: timestamp("wp_modified_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
    importBatchId: text("import_batch_id"),
    migrationMetadata: jsonb("migration_metadata"), // { wpUrl, imageMapping, errors }
  },
  (table) => [
    index("blog_posts_slug_idx").on(table.slug),
    index("blog_posts_wp_id_idx").on(table.wpId),
    index("blog_posts_status_idx").on(table.status),
    index("blog_posts_published_at_idx").on(table.publishedAt),
    index("blog_posts_import_batch_idx").on(table.importBatchId),
  ]
);
```

**blogCategories Table:**
```typescript
export const blogCategories = pgTable(
  "blog_categories",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    wpId: integer("wp_id").unique(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    parentId: text("parent_id"), // Self-reference for hierarchy
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => [
    index("blog_categories_slug_idx").on(table.slug),
    index("blog_categories_wp_id_idx").on(table.wpId),
    index("blog_categories_parent_idx").on(table.parentId),
  ]
);
```

**blogTags Table:**
```typescript
export const blogTags = pgTable(
  "blog_tags",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    wpId: integer("wp_id").unique(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
  },
  (table) => [
    index("blog_tags_slug_idx").on(table.slug),
    index("blog_tags_wp_id_idx").on(table.wpId),
  ]
);
```

**Junction Tables:**
```typescript
export const blogPostCategories = pgTable(
  "blog_post_categories",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    postId: text("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
    categoryId: text("category_id").notNull().references(() => blogCategories.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("blog_post_categories_post_idx").on(table.postId),
    index("blog_post_categories_category_idx").on(table.categoryId),
  ]
);

export const blogPostTags = pgTable(
  "blog_post_tags",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    postId: text("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
    tagId: text("tag_id").notNull().references(() => blogTags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("blog_post_tags_post_idx").on(table.postId),
    index("blog_post_tags_tag_idx").on(table.tagId),
  ]
);
```

**blogImportBatches Table:**
```typescript
export const blogImportBatches = pgTable("blog_import_batches", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  status: text("status").default("pending"), // pending, fetching, migrating_images, processing, completed, failed
  sourceUrl: text("source_url"),
  totalPostsFound: integer("total_posts_found").default(0),
  postsProcessed: integer("posts_processed").default(0),
  postsSuccess: integer("posts_success").default(0),
  postsError: integer("posts_error").default(0),
  postsSkipped: integer("posts_skipped").default(0),
  imagesProcessed: integer("images_processed").default(0),
  imagesSuccess: integer("images_success").default(0),
  imagesError: integer("images_error").default(0),
  categoriesCreated: integer("categories_created").default(0),
  tagsCreated: integer("tags_created").default(0),
  errors: jsonb("errors"),
  imageMapping: jsonb("image_mapping"), // { wpUrl: blobUrl }
  redirects: jsonb("redirects"), // Array of { source, destination }
  importedBy: text("imported_by").references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});
```

**Relations to add:**
```typescript
export const blogPostsRelations = relations(blogPosts, ({ many }) => ({
  postCategories: many(blogPostCategories),
  postTags: many(blogPostTags),
}));

export const blogCategoriesRelations = relations(blogCategories, ({ one, many }) => ({
  parent: one(blogCategories, {
    fields: [blogCategories.parentId],
    references: [blogCategories.id],
  }),
  children: many(blogCategories),
  postCategories: many(blogPostCategories),
}));

export const blogTagsRelations = relations(blogTags, ({ many }) => ({
  postTags: many(blogPostTags),
}));

export const blogPostCategoriesRelations = relations(blogPostCategories, ({ one }) => ({
  post: one(blogPosts, { fields: [blogPostCategories.postId], references: [blogPosts.id] }),
  category: one(blogCategories, { fields: [blogPostCategories.categoryId], references: [blogCategories.id] }),
}));

export const blogPostTagsRelations = relations(blogPostTags, ({ one }) => ({
  post: one(blogPosts, { fields: [blogPostTags.postId], references: [blogPosts.id] }),
  tag: one(blogTags, { fields: [blogPostTags.tagId], references: [blogTags.id] }),
}));
```

**CLI Commands:**
```bash
pnpm db:generate  # Generate migration
pnpm db:migrate   # Apply migration
```

---

## Phase 2: Core Blog Libraries

Create utility libraries for WordPress API integration, sitemap parsing, image migration, and content processing.

### Tasks

- [x] Create TypeScript types for WordPress API responses and blog entities (`src/lib/blog/types.ts`)
- [x] Implement sitemap parser to extract post URLs (`src/lib/blog/sitemap-parser.ts`)
- [x] Implement WordPress REST API client (`src/lib/blog/wordpress-api.ts`)
- [x] Implement image migrator with Vercel Blob upload (`src/lib/blog/image-migrator.ts`)
- [x] Implement content processor to update URLs in HTML (`src/lib/blog/content-processor.ts`)
- [x] Implement blog database queries (`src/lib/blog/blog-queries.ts`)

### Technical Details

**File: `src/lib/blog/types.ts`**
```typescript
// WordPress API Response Types
export interface WPPost {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    author?: Array<{ name: string; slug: string }>;
    "wp:featuredmedia"?: Array<{
      source_url: string;
      alt_text: string;
    }>;
  };
}

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  parent: number;
  count: number;
}

export interface WPTag {
  id: number;
  name: string;
  slug: string;
  count: number;
}

// Migration Types
export interface ImageMigrationResult {
  originalUrl: string;
  newUrl: string;
  success: boolean;
  error?: string;
}

export interface PostMigrationResult {
  wpId: number;
  slug: string;
  success: boolean;
  postId?: string;
  imagesMigrated: number;
  imagesFailed: number;
  error?: string;
}

export interface MigrationProgress {
  phase: "categories" | "tags" | "posts" | "images" | "complete";
  current: number;
  total: number;
  percentage: number;
  currentItem?: string;
}
```

**File: `src/lib/blog/sitemap-parser.ts`**
```typescript
export async function fetchAndParseSitemap(sitemapUrl: string): Promise<string[]> {
  const response = await fetch(sitemapUrl);
  if (!response.ok) throw new Error(`Failed to fetch sitemap: ${response.status}`);

  const xml = await response.text();
  const urlMatches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
  return Array.from(urlMatches, m => m[1]);
}

export async function discoverPostUrls(baseUrl: string): Promise<{
  sitemaps: Array<{ url: string; postCount: number }>;
  postUrls: string[];
}> {
  const sitemapUrls = [
    `${baseUrl}/post-sitemap1.xml`,
    `${baseUrl}/post-sitemap2.xml`,
  ];

  const sitemaps: Array<{ url: string; postCount: number }> = [];
  const allPostUrls: string[] = [];

  for (const url of sitemapUrls) {
    try {
      const urls = await fetchAndParseSitemap(url);
      sitemaps.push({ url, postCount: urls.length });
      allPostUrls.push(...urls);
    } catch {
      // Sitemap may not exist
    }
  }

  return { sitemaps, postUrls: allPostUrls };
}

export function extractSlugFromUrl(wpUrl: string): string {
  // https://painclinics.com/post-slug/ -> post-slug
  const url = new URL(wpUrl);
  const pathParts = url.pathname.split("/").filter(Boolean);
  return pathParts[pathParts.length - 1] || "";
}
```

**File: `src/lib/blog/wordpress-api.ts`**
```typescript
const WP_BASE_URL = "https://painclinics.com";
const WP_API_BASE = `${WP_BASE_URL}/wp-json/wp/v2`;

export async function fetchWPPosts(page = 1, perPage = 100): Promise<{
  posts: WPPost[];
  totalPages: number;
  totalPosts: number;
}> {
  const url = `${WP_API_BASE}/posts?page=${page}&per_page=${perPage}&_embed`;
  const response = await fetch(url);

  if (!response.ok) throw new Error(`WP API error: ${response.status}`);

  return {
    posts: await response.json(),
    totalPages: parseInt(response.headers.get("X-WP-TotalPages") || "1"),
    totalPosts: parseInt(response.headers.get("X-WP-Total") || "0"),
  };
}

export async function fetchWPPostBySlug(slug: string): Promise<WPPost | null> {
  const url = `${WP_API_BASE}/posts?slug=${slug}&_embed`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const posts = await response.json();
  return posts[0] || null;
}

export async function fetchAllWPCategories(): Promise<WPCategory[]> {
  const categories: WPCategory[] = [];
  let page = 1;

  while (true) {
    const response = await fetch(`${WP_API_BASE}/categories?page=${page}&per_page=100`);
    if (!response.ok) break;

    const batch = await response.json();
    if (batch.length === 0) break;

    categories.push(...batch);
    page++;
  }

  return categories;
}

export async function fetchAllWPTags(): Promise<WPTag[]> {
  const tags: WPTag[] = [];
  let page = 1;

  while (true) {
    const response = await fetch(`${WP_API_BASE}/tags?page=${page}&per_page=100`);
    if (!response.ok) break;

    const batch = await response.json();
    if (batch.length === 0) break;

    tags.push(...batch);
    page++;
  }

  return tags;
}
```

**File: `src/lib/blog/image-migrator.ts`**
```typescript
import { upload } from "@/lib/storage";

export async function migrateImage(wpImageUrl: string): Promise<ImageMigrationResult> {
  try {
    const response = await fetch(wpImageUrl);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

    const buffer = Buffer.from(await response.arrayBuffer());
    const urlPath = new URL(wpImageUrl).pathname;
    const filename = urlPath.split("/").pop() || "image.jpg";

    const result = await upload(buffer, filename, "blog");

    return { originalUrl: wpImageUrl, newUrl: result.url, success: true };
  } catch (error) {
    return {
      originalUrl: wpImageUrl,
      newUrl: wpImageUrl, // Keep original on failure
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function extractImageUrls(htmlContent: string, wpDomain = "painclinics.com"): string[] {
  const srcMatches = htmlContent.matchAll(/src=["']([^"']+)["']/gi);
  const urls = Array.from(srcMatches, m => m[1]);

  return urls.filter(url =>
    url.includes(wpDomain) && /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url)
  );
}

export async function migrateAllImages(
  imageUrls: string[],
  onProgress?: (current: number, total: number, url: string) => void
): Promise<Record<string, string>> {
  const mapping: Record<string, string> = {};

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    onProgress?.(i + 1, imageUrls.length, url);

    const result = await migrateImage(url);
    mapping[result.originalUrl] = result.newUrl;

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  return mapping;
}
```

**File: `src/lib/blog/content-processor.ts`**
```typescript
export interface ContentProcessingOptions {
  imageMapping: Record<string, string>;
  baseUrl?: string;
}

export function processContent(html: string, options: ContentProcessingOptions): string {
  let processed = html;

  // 1. Replace image URLs
  for (const [wpUrl, blobUrl] of Object.entries(options.imageMapping)) {
    processed = processed.replaceAll(wpUrl, blobUrl);
  }

  // 2. Update internal blog links (root level → /blog/)
  // /post-slug/ → /blog/post-slug
  processed = processed.replace(
    /href=["']https?:\/\/painclinics\.com\/([a-z0-9-]+)\/?["']/gi,
    (match, slug) => {
      // Skip known non-blog paths
      if (["pain-management", "about", "contact", "privacy", "terms"].includes(slug)) {
        return match;
      }
      return `href="/blog/${slug}"`;
    }
  );

  // 3. Update clinic links (already at correct path)
  processed = processed.replace(
    /href=["']https?:\/\/painclinics\.com\/pain-management\/([^"']+)\/?["']/gi,
    'href="/pain-management/$1"'
  );

  // 4. Update any remaining absolute links to relative
  processed = processed.replace(
    /href=["']https?:\/\/painclinics\.com\//gi,
    'href="/'
  );

  return processed;
}

export function generateRedirectConfig(slugs: string[]): Array<{ source: string; destination: string; permanent: boolean }> {
  return slugs.map(slug => ({
    source: `/${slug}`,
    destination: `/blog/${slug}`,
    permanent: true,
  }));
}
```

**File: `src/lib/blog/blog-queries.ts`**
```typescript
import { db } from "@/lib/db";
import { eq, desc, and, ilike } from "drizzle-orm";
import * as schema from "@/lib/schema";

export async function getBlogPostBySlug(slug: string) {
  return db.query.blogPosts.findFirst({
    where: eq(schema.blogPosts.slug, slug),
    with: {
      postCategories: { with: { category: true } },
      postTags: { with: { tag: true } },
    },
  });
}

export async function getBlogPosts(options: {
  page?: number;
  limit?: number;
  status?: "published" | "draft" | "archived";
  categorySlug?: string;
  tagSlug?: string;
  search?: string;
}) {
  const { page = 1, limit = 12, status = "published" } = options;
  const offset = (page - 1) * limit;

  const posts = await db.query.blogPosts.findMany({
    where: eq(schema.blogPosts.status, status),
    orderBy: desc(schema.blogPosts.publishedAt),
    limit,
    offset,
    with: {
      postCategories: { with: { category: true } },
      postTags: { with: { tag: true } },
    },
  });

  const countResult = await db.select({ count: sql`count(*)` })
    .from(schema.blogPosts)
    .where(eq(schema.blogPosts.status, status));

  return { posts, total: Number(countResult[0]?.count || 0) };
}

export async function getAllPublishedPostSlugs(): Promise<string[]> {
  const posts = await db.select({ slug: schema.blogPosts.slug })
    .from(schema.blogPosts)
    .where(eq(schema.blogPosts.status, "published"));
  return posts.map(p => p.slug);
}

export async function getAllCategories() {
  return db.query.blogCategories.findMany({
    orderBy: schema.blogCategories.name,
  });
}

export async function getAllTags() {
  return db.query.blogTags.findMany({
    orderBy: schema.blogTags.name,
  });
}
```

---

## Phase 3: Migration API Endpoints

Create API routes for the migration process with SSE streaming for real-time progress.

### Tasks

- [x] Create sitemaps discovery endpoint (`/api/admin/blog/migration/sitemaps/route.ts`)
- [x] Create migration preview endpoint (`/api/admin/blog/migration/preview/route.ts`)
- [x] Create migration execute endpoint with SSE streaming (`/api/admin/blog/migration/execute/route.ts`) [complex]
  - [x] Implement categories/tags import
  - [x] Implement post import with image migration
  - [x] Implement SSE progress events
  - [x] Implement redirect config generation
- [x] Create migration status endpoint (`/api/admin/blog/migration/status/route.ts`)
- [x] Create rollback endpoint (`/api/admin/blog/migration/rollback/route.ts`)

### Technical Details

**File: `src/app/api/admin/blog/migration/sitemaps/route.ts`**
```typescript
import { NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { discoverPostUrls } from "@/lib/blog/sitemap-parser";

export async function GET() {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) return adminErrorResponse(adminCheck);

  try {
    const result = await discoverPostUrls("https://painclinics.com");
    return NextResponse.json({
      sitemaps: result.sitemaps,
      totalPosts: result.postUrls.length,
      postUrls: result.postUrls,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch sitemaps" },
      { status: 500 }
    );
  }
}
```

**File: `src/app/api/admin/blog/migration/execute/route.ts`**

Uses SSE pattern from existing import route. Key events:
- `event: status` - Phase status messages
- `event: progress` - Progress updates with counts
- `event: image` - Per-post image progress
- `event: complete` - Final results
- `event: error` - Error messages

**Migration Flow:**
1. Create import batch record
2. Fetch and import categories (map wpId → localId)
3. Fetch and import tags (map wpId → localId)
4. For each post:
   - Check if exists by wpId (skip if exists)
   - Extract image URLs from content
   - Download images → upload to Vercel Blob
   - Process content (update URLs)
   - Insert post record
   - Create category/tag associations
   - Stream progress
5. Generate redirect config
6. Update batch record with results

---

## Phase 4: Admin Migration Interface

Build the admin UI for managing the migration process.

### Tasks

- [x] Create migration page layout (`src/app/admin/blog/migration/page.tsx`)
- [x] Create migration wizard component with 4 steps (`src/components/admin/blog/migration-wizard.tsx`)
- [x] Create sitemaps discovery step component
- [x] Create preview step component (`src/components/admin/blog/migration-preview.tsx`)
- [x] Create progress step component with SSE consumption (`src/components/admin/blog/migration-progress.tsx`)
- [x] Create results step component with CSV export (`src/components/admin/blog/migration-results.tsx`)
- [x] Add Blog Migration link to admin sidebar

### Technical Details

**File: `src/app/admin/blog/migration/page.tsx`**
```typescript
import { requireAdmin } from "@/lib/session";
import { MigrationWizard } from "@/components/admin/blog/migration-wizard";

export default async function BlogMigrationPage() {
  await requireAdmin();

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">WordPress Blog Migration</h1>
      <MigrationWizard />
    </div>
  );
}
```

**Migration Wizard Steps:**
1. **Discover** - Button to fetch sitemaps, shows post count
2. **Preview** - Table of posts/categories/tags to import
3. **Execute** - Progress bars, real-time stats, cancel button
4. **Results** - Summary cards, error table, CSV download

**SSE Consumption Pattern:**
```typescript
const response = await fetch("/api/admin/blog/migration/execute", {
  method: "POST",
  body: JSON.stringify({ mode: "full" }),
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  const lines = text.split("\n");

  for (const line of lines) {
    if (line.startsWith("event: ")) {
      currentEvent = line.slice(7);
    } else if (line.startsWith("data: ")) {
      const data = JSON.parse(line.slice(6));
      handleEvent(currentEvent, data);
    }
  }
}
```

**UI Components to use:**
- Card, CardHeader, CardContent (containers)
- Progress (progress bars)
- Table (preview data)
- Badge (status indicators)
- Button (actions)
- Alert (errors/warnings)
- ScrollArea (error logs)

---

## Phase 5: Public Blog Pages

Create the public-facing blog pages with SEO optimization.

### Tasks

- [x] Create blog listing page (`src/app/blog/page.tsx`)
- [x] Create individual blog post page (`src/app/blog/[slug]/page.tsx`)
- [x] Create category archive page (`src/app/blog/category/[slug]/page.tsx`)
- [x] Create tag archive page (`src/app/blog/tag/[slug]/page.tsx`)
- [x] Create blog post card component (`src/components/blog/blog-post-card.tsx`)
- [x] Create blog post content component (`src/components/blog/blog-post-content.tsx`)
- [x] Create blog sidebar component (`src/components/blog/blog-sidebar.tsx`)
- [x] Create blog pagination component (`src/components/blog/blog-pagination.tsx`)
- [x] Add structured data (Article schema) to post pages

### Technical Details

**File: `src/app/blog/page.tsx`**
```typescript
export const metadata: Metadata = {
  title: "Pain Management Blog | Pain Clinics",
  description: "Expert articles on chronic pain, treatments, and finding relief.",
};

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page = "1" } = await searchParams;
  const { posts, total } = await getBlogPosts({
    page: parseInt(page),
    limit: 12,
    status: "published",
  });

  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Pain Management Blog</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid gap-6">
          {posts.map(post => (
            <BlogPostCard key={post.id} post={post} />
          ))}
          <BlogPagination current={parseInt(page)} total={Math.ceil(total / 12)} />
        </div>
        <aside>
          <BlogSidebar />
        </aside>
      </div>
    </main>
  );
}
```

**File: `src/app/blog/[slug]/page.tsx`**
```typescript
export async function generateStaticParams() {
  const slugs = await getAllPublishedPostSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) return { title: "Post Not Found" };

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt || "",
      images: post.featuredImageUrl ? [post.featuredImageUrl] : [],
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.wpModifiedAt?.toISOString(),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.wpModifiedAt?.toISOString(),
    author: { "@type": "Person", name: post.authorName },
    image: post.featuredImageUrl,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="container mx-auto py-8 max-w-4xl">
        <BlogPostContent post={post} />
      </article>
    </>
  );
}
```

**BlogPostCard Component:**
- Featured image with Next.js Image component
- Title as link to post
- Excerpt (truncated)
- Publish date
- Category badges

**BlogSidebar Component:**
- Categories list with post counts
- Tags cloud
- Recent posts (5 most recent)

---

## Phase 6: Redirects and Validation

Generate 301 redirects and validate the migration.

### Tasks

- [ ] Add redirect generation to migration execute endpoint
- [ ] Create redirect config export endpoint (`/api/admin/blog/migration/redirects/route.ts`)
- [ ] Document manual step: Add redirects to next.config.ts
- [ ] Create validation endpoint to check all posts (`/api/admin/blog/migration/validate/route.ts`)
- [ ] Add validation step to migration results UI

### Technical Details

**Redirect Config Format:**
```typescript
// Generated JSON to add to next.config.ts
{
  redirects: [
    { source: "/post-slug-1", destination: "/blog/post-slug-1", permanent: true },
    { source: "/post-slug-2", destination: "/blog/post-slug-2", permanent: true },
    // ... for all posts
  ]
}
```

**Validation Checks:**
1. Post count matches sitemap count
2. All images are accessible (HEAD request)
3. All category/tag links work
4. No duplicate slugs

**File: `src/app/api/admin/blog/migration/redirects/route.ts`**
```typescript
export async function GET() {
  const slugs = await getAllPublishedPostSlugs();
  const redirects = generateRedirectConfig(slugs);

  return NextResponse.json({
    count: redirects.length,
    redirects,
    configSnippet: `
async redirects() {
  return ${JSON.stringify(redirects, null, 2)};
}`,
  });
}
```

---

## Summary

| Phase | Files Created | Key Deliverables |
|-------|--------------|------------------|
| 1 | 1 modified | Database schema with 7 tables |
| 2 | 6 new | Core libraries for WP API, images, content |
| 3 | 5 new | Migration API with SSE streaming |
| 4 | 6 new | Admin migration wizard UI |
| 5 | 8 new | Public blog pages with SEO |
| 6 | 2 new | Redirects and validation |

**Total: ~28 files to create/modify**
