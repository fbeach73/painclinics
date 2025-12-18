import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import type { BlogPostsQueryOptions, BlogPostsQueryResult } from "./types";

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
 */
export async function getAllPublishedPostSlugs(): Promise<string[]> {
  const posts = await db
    .select({ slug: schema.blogPosts.slug })
    .from(schema.blogPosts)
    .where(eq(schema.blogPosts.status, "published"));

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
 */
export async function getRecentPosts(limit = 5) {
  return db.query.blogPosts.findMany({
    where: eq(schema.blogPosts.status, "published"),
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
      eq(schema.blogPosts.status, "published")
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
 */
export async function getCategoriesWithCounts() {
  const categories = await db.query.blogCategories.findMany({
    orderBy: schema.blogCategories.name,
    with: {
      postCategories: {
        with: {
          post: {
            columns: { status: true },
          },
        },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    postCount: category.postCategories.filter(
      (pc) => pc.post.status === "published"
    ).length,
  }));
}

/**
 * Get tags with post counts for sidebar
 */
export async function getTagsWithCounts() {
  const tags = await db.query.blogTags.findMany({
    orderBy: schema.blogTags.name,
    with: {
      postTags: {
        with: {
          post: {
            columns: { status: true },
          },
        },
      },
    },
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    postCount: tag.postTags.filter((pt) => pt.post.status === "published")
      .length,
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
