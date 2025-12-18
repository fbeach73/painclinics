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

// Sitemap Types

export interface SitemapInfo {
  url: string;
  postCount: number;
}

export interface SitemapDiscoveryResult {
  sitemaps: SitemapInfo[];
  postUrls: string[];
}

// Blog Query Types

export interface BlogPostWithRelations {
  id: string;
  wpId: number | null;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  wpFeaturedImageUrl: string | null;
  authorName: string | null;
  authorSlug: string | null;
  status: "draft" | "published" | "archived";
  publishedAt: Date | null;
  wpCreatedAt: Date | null;
  wpModifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  importBatchId: string | null;
  migrationMetadata: unknown;
  postCategories: Array<{
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  postTags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
}

export interface BlogPostsQueryOptions {
  page?: number;
  limit?: number;
  status?: "published" | "draft" | "archived";
  categorySlug?: string;
  tagSlug?: string;
  search?: string;
}

export interface BlogPostsQueryResult {
  posts: BlogPostWithRelations[];
  total: number;
}
