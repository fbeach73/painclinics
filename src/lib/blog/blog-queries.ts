import { eq, desc, sql, and, inArray, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import type {
  BlogPostsQueryOptions,
  BlogPostsQueryResult,
  BlogPostWithRelations,
} from "./types";

/**
 * Get a single blog post by slug with categories and tags
 */
export async function getBlogPostBySlug(slug: string) {
  return db.query.blogPosts.findFirst({
    where: eq(schema.blogPosts.slug, slug),
    with: {
      postCategories: {
        with: {
          category: true,
        },
      },
      postTags: {
        with: {
          tag: true,
        },
      },
    },
  });
}

/**
 * Get a single blog post by WordPress ID
 */
export async function getBlogPostByWpId(wpId: number) {
  return db.query.blogPosts.findFirst({
    where: eq(schema.blogPosts.wpId, wpId),
  });
}

/**
 * Get paginated blog posts with filters
 */
export async function getBlogPosts(
  options: BlogPostsQueryOptions = {}
): Promise<BlogPostsQueryResult> {
  const {
    page = 1,
    limit = 12,
    status = "published",
    categorySlug,
    tagSlug,
    search,
  } = options;

  const offset = (page - 1) * limit;

  // Build base conditions
  const conditions = [eq(schema.blogPosts.status, status)];

  // For published posts, only show posts with publishedAt in the past
  // This ensures scheduled posts don't appear on the public blog
  if (status === "published") {
    conditions.push(
      sql`(${schema.blogPosts.publishedAt} IS NULL OR ${schema.blogPosts.publishedAt} <= NOW())`
    );
  }

  // Add search condition
  if (search) {
    conditions.push(
      sql`(${schema.blogPosts.title} ILIKE ${`%${search}%`} OR ${schema.blogPosts.content} ILIKE ${`%${search}%`})`
    );
  }

  // If filtering by category, get post IDs first
  let postIdsFromCategory: string[] | null = null;
  if (categorySlug) {
    const category = await db.query.blogCategories.findFirst({
      where: eq(schema.blogCategories.slug, categorySlug),
    });

    if (category) {
      const postCategories = await db
        .select({ postId: schema.blogPostCategories.postId })
        .from(schema.blogPostCategories)
        .where(eq(schema.blogPostCategories.categoryId, category.id));

      postIdsFromCategory = postCategories.map((pc) => pc.postId);
    } else {
      // Category not found, return empty result
      return { posts: [], total: 0 };
    }
  }

  // If filtering by tag, get post IDs
  let postIdsFromTag: string[] | null = null;
  if (tagSlug) {
    const tag = await db.query.blogTags.findFirst({
      where: eq(schema.blogTags.slug, tagSlug),
    });

    if (tag) {
      const postTags = await db
        .select({ postId: schema.blogPostTags.postId })
        .from(schema.blogPostTags)
        .where(eq(schema.blogPostTags.tagId, tag.id));

      postIdsFromTag = postTags.map((pt) => pt.postId);
    } else {
      // Tag not found, return empty result
      return { posts: [], total: 0 };
    }
  }

  // Combine category and tag filters
  if (postIdsFromCategory !== null && postIdsFromTag !== null) {
    // Intersection of both
    const intersection = postIdsFromCategory.filter((id) =>
      postIdsFromTag!.includes(id)
    );
    if (intersection.length === 0) {
      return { posts: [], total: 0 };
    }
    conditions.push(inArray(schema.blogPosts.id, intersection));
  } else if (postIdsFromCategory !== null) {
    if (postIdsFromCategory.length === 0) {
      return { posts: [], total: 0 };
    }
    conditions.push(inArray(schema.blogPosts.id, postIdsFromCategory));
  } else if (postIdsFromTag !== null) {
    if (postIdsFromTag.length === 0) {
      return { posts: [], total: 0 };
    }
    conditions.push(inArray(schema.blogPosts.id, postIdsFromTag));
  }

  // Fetch posts
  const posts = await db.query.blogPosts.findMany({
    where: and(...conditions),
    orderBy: desc(schema.blogPosts.publishedAt),
    limit,
    offset,
    with: {
      postCategories: {
        with: {
          category: true,
        },
      },
      postTags: {
        with: {
          tag: true,
        },
      },
    },
  });

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.blogPosts)
    .where(and(...conditions));

  return {
    posts: posts as BlogPostsQueryResult["posts"],
    total: Number(countResult[0]?.count || 0),
  };
}

/**
 * Get all published post slugs (for static generation)
 * Only returns posts that are published and have publishedAt in the past
 */
export async function getAllPublishedPostSlugs(): Promise<string[]> {
  const posts = await db
    .select({ slug: schema.blogPosts.slug })
    .from(schema.blogPosts)
    .where(
      and(
        eq(schema.blogPosts.status, "published"),
        sql`(${schema.blogPosts.publishedAt} IS NULL OR ${schema.blogPosts.publishedAt} <= NOW())`
      )
    );

  return posts.map((p) => p.slug);
}

/**
 * Get all categories
 */
export async function getAllCategories() {
  return db.query.blogCategories.findMany({
    orderBy: schema.blogCategories.name,
  });
}

/**
 * Get a category by slug with post count
 */
export async function getCategoryBySlug(slug: string) {
  const category = await db.query.blogCategories.findFirst({
    where: eq(schema.blogCategories.slug, slug),
    with: {
      postCategories: true,
    },
  });

  if (!category) return null;

  return {
    ...category,
    postCount: category.postCategories.length,
  };
}

/**
 * Get all tags
 */
export async function getAllTags() {
  return db.query.blogTags.findMany({
    orderBy: schema.blogTags.name,
  });
}

/**
 * Get a tag by slug with post count
 */
export async function getTagBySlug(slug: string) {
  const tag = await db.query.blogTags.findFirst({
    where: eq(schema.blogTags.slug, slug),
    with: {
      postTags: true,
    },
  });

  if (!tag) return null;

  return {
    ...tag,
    postCount: tag.postTags.length,
  };
}

/**
 * Get recent posts (for sidebar)
 * Only returns posts that are published and have publishedAt in the past
 */
export async function getRecentPosts(limit = 5) {
  return db.query.blogPosts.findMany({
    where: and(
      eq(schema.blogPosts.status, "published"),
      sql`(${schema.blogPosts.publishedAt} IS NULL OR ${schema.blogPosts.publishedAt} <= NOW())`
    ),
    orderBy: desc(schema.blogPosts.publishedAt),
    limit,
    columns: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImageUrl: true,
      publishedAt: true,
    },
  });
}

/**
 * Get related posts (same categories)
 */
export async function getRelatedPosts(postId: string, limit = 3) {
  // Get categories for the current post
  const postCategories = await db
    .select({ categoryId: schema.blogPostCategories.categoryId })
    .from(schema.blogPostCategories)
    .where(eq(schema.blogPostCategories.postId, postId));

  if (postCategories.length === 0) {
    // No categories, return recent posts instead
    return getRecentPosts(limit);
  }

  const categoryIds = postCategories.map((pc) => pc.categoryId);

  // Get other posts in same categories
  const relatedPostIds = await db
    .selectDistinct({ postId: schema.blogPostCategories.postId })
    .from(schema.blogPostCategories)
    .where(
      and(
        inArray(schema.blogPostCategories.categoryId, categoryIds),
        sql`${schema.blogPostCategories.postId} != ${postId}`
      )
    )
    .limit(limit);

  if (relatedPostIds.length === 0) {
    return getRecentPosts(limit);
  }

  return db.query.blogPosts.findMany({
    where: and(
      inArray(
        schema.blogPosts.id,
        relatedPostIds.map((p) => p.postId)
      ),
      eq(schema.blogPosts.status, "published"),
      sql`(${schema.blogPosts.publishedAt} IS NULL OR ${schema.blogPosts.publishedAt} <= NOW())`
    ),
    orderBy: desc(schema.blogPosts.publishedAt),
    limit,
    columns: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImageUrl: true,
      publishedAt: true,
    },
  });
}

/**
 * Get category by WordPress ID
 */
export async function getCategoryByWpId(wpId: number) {
  return db.query.blogCategories.findFirst({
    where: eq(schema.blogCategories.wpId, wpId),
  });
}

/**
 * Get tag by WordPress ID
 */
export async function getTagByWpId(wpId: number) {
  return db.query.blogTags.findFirst({
    where: eq(schema.blogTags.wpId, wpId),
  });
}

/**
 * Get categories with post counts for sidebar
 * Only counts posts that are published and have publishedAt in the past
 */
export async function getCategoriesWithCounts() {
  const categories = await db.query.blogCategories.findMany({
    orderBy: schema.blogCategories.name,
    with: {
      postCategories: {
        with: {
          post: {
            columns: { status: true, publishedAt: true },
          },
        },
      },
    },
  });

  const now = new Date();
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    postCount: category.postCategories.filter(
      (pc) =>
        pc.post.status === "published" &&
        (pc.post.publishedAt === null || new Date(pc.post.publishedAt) <= now)
    ).length,
  }));
}

/**
 * Get tags with post counts for sidebar
 * Only counts posts that are published and have publishedAt in the past
 */
export async function getTagsWithCounts() {
  const tags = await db.query.blogTags.findMany({
    orderBy: schema.blogTags.name,
    with: {
      postTags: {
        with: {
          post: {
            columns: { status: true, publishedAt: true },
          },
        },
      },
    },
  });

  const now = new Date();
  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    postCount: tag.postTags.filter(
      (pt) =>
        pt.post.status === "published" &&
        (pt.post.publishedAt === null || new Date(pt.post.publishedAt) <= now)
    ).length,
  }));
}

/**
 * Get blog import batch by ID
 */
export async function getBlogImportBatch(batchId: string) {
  return db.query.blogImportBatches.findFirst({
    where: eq(schema.blogImportBatches.id, batchId),
  });
}

/**
 * Get most recent blog import batch
 */
export async function getLatestBlogImportBatch() {
  return db.query.blogImportBatches.findFirst({
    orderBy: desc(schema.blogImportBatches.createdAt),
  });
}

/**
 * Get minimal post data for interlinking
 * Returns published posts with their category IDs for the internal linking system
 */
export async function getPostsForInterlinking(): Promise<
  {
    id: string;
    title: string;
    slug: string;
    categoryIds: string[];
  }[]
> {
  const posts = await db.query.blogPosts.findMany({
    where: and(
      eq(schema.blogPosts.status, "published"),
      lte(schema.blogPosts.publishedAt, new Date())
    ),
    columns: { id: true, title: true, slug: true },
    with: {
      postCategories: {
        columns: { categoryId: true },
      },
    },
  });

  return posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    categoryIds: p.postCategories.map((pc) => pc.categoryId),
  }));
}

// ============================================
// Admin Query Functions
// ============================================

export interface AdminBlogPostsQueryOptions {
  page?: number;
  limit?: number;
  status?: "draft" | "published" | "archived" | "all";
  search?: string | undefined;
}

export interface AdminBlogPostsQueryResult {
  posts: BlogPostWithRelations[];
  total: number;
}

/**
 * Get a single blog post by ID with categories and tags (for admin editing)
 */
export async function getBlogPostById(
  id: string
): Promise<BlogPostWithRelations | null> {
  const result = await db.query.blogPosts.findFirst({
    where: eq(schema.blogPosts.id, id),
    with: {
      postCategories: {
        with: {
          category: true,
        },
      },
      postTags: {
        with: {
          tag: true,
        },
      },
    },
  });

  return result as BlogPostWithRelations | null;
}

/**
 * Get paginated blog posts for admin panel (includes all statuses)
 */
export async function getBlogPostsAdmin(
  options: AdminBlogPostsQueryOptions = {}
): Promise<AdminBlogPostsQueryResult> {
  const { page = 1, limit = 50, status = "all", search } = options;
  const offset = (page - 1) * limit;

  // Build conditions
  const conditions = [];

  // Status filter
  if (status !== "all") {
    conditions.push(eq(schema.blogPosts.status, status));
  }

  // Search filter (search in title)
  if (search) {
    conditions.push(
      sql`${schema.blogPosts.title} ILIKE ${`%${search}%`}`
    );
  }

  // Fetch posts
  const posts = await db.query.blogPosts.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: desc(schema.blogPosts.updatedAt),
    limit,
    offset,
    with: {
      postCategories: {
        with: {
          category: true,
        },
      },
      postTags: {
        with: {
          tag: true,
        },
      },
    },
  });

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.blogPosts)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return {
    posts: posts as BlogPostWithRelations[],
    total: Number(countResult[0]?.count || 0),
  };
}

/**
 * Get post counts by status for admin dashboard
 */
export async function getBlogPostCountsByStatus() {
  const results = await db
    .select({
      status: schema.blogPosts.status,
      count: sql<number>`count(*)`,
    })
    .from(schema.blogPosts)
    .groupBy(schema.blogPosts.status);

  const counts = {
    all: 0,
    draft: 0,
    published: 0,
    archived: 0,
  };

  for (const row of results) {
    const status = row.status as "draft" | "published" | "archived";
    counts[status] = Number(row.count);
    counts.all += Number(row.count);
  }

  return counts;
}
