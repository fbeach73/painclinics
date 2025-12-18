import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

export interface CreateBlogPostInput {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  authorName?: string;
  status: "draft" | "published" | "archived";
  publishedAt?: Date;
}

export interface UpdateBlogPostInput {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  authorName?: string;
  status?: "draft" | "published" | "archived";
  publishedAt?: Date | null;
}

/**
 * Create a new blog post
 */
export async function createBlogPost(input: CreateBlogPostInput) {
  const id = createId();
  await db.insert(schema.blogPosts).values({
    id,
    title: input.title,
    slug: input.slug,
    content: input.content,
    excerpt: input.excerpt ?? null,
    metaTitle: input.metaTitle ?? null,
    metaDescription: input.metaDescription ?? null,
    featuredImageUrl: input.featuredImageUrl ?? null,
    featuredImageAlt: input.featuredImageAlt ?? null,
    authorName: input.authorName ?? null,
    status: input.status,
    publishedAt: input.publishedAt ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

/**
 * Update an existing blog post
 */
export async function updateBlogPost(id: string, input: UpdateBlogPostInput) {
  await db
    .update(schema.blogPosts)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(schema.blogPosts.id, id));
}

/**
 * Delete a blog post and its associations
 */
export async function deleteBlogPost(id: string) {
  // Delete associations first (cascade should handle this, but being explicit)
  await db
    .delete(schema.blogPostCategories)
    .where(eq(schema.blogPostCategories.postId, id));
  await db
    .delete(schema.blogPostTags)
    .where(eq(schema.blogPostTags.postId, id));
  await db.delete(schema.blogPosts).where(eq(schema.blogPosts.id, id));
}

/**
 * Set categories for a post (replaces existing)
 */
export async function setPostCategories(postId: string, categoryIds: string[]) {
  // Delete existing associations
  await db
    .delete(schema.blogPostCategories)
    .where(eq(schema.blogPostCategories.postId, postId));

  // Insert new associations
  if (categoryIds.length > 0) {
    await db.insert(schema.blogPostCategories).values(
      categoryIds.map((categoryId) => ({
        id: createId(),
        postId,
        categoryId,
      }))
    );
  }
}

/**
 * Set tags for a post (replaces existing)
 */
export async function setPostTags(postId: string, tagIds: string[]) {
  // Delete existing associations
  await db
    .delete(schema.blogPostTags)
    .where(eq(schema.blogPostTags.postId, postId));

  // Insert new associations
  if (tagIds.length > 0) {
    await db.insert(schema.blogPostTags).values(
      tagIds.map((tagId) => ({
        id: createId(),
        postId,
        tagId,
      }))
    );
  }
}

/**
 * Create a new category
 */
export async function createCategory(name: string, slug: string) {
  const id = createId();
  await db.insert(schema.blogCategories).values({
    id,
    name,
    slug,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { id, name, slug };
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string) {
  // Delete post associations first
  await db
    .delete(schema.blogPostCategories)
    .where(eq(schema.blogPostCategories.categoryId, id));
  await db.delete(schema.blogCategories).where(eq(schema.blogCategories.id, id));
}

/**
 * Create a new tag
 */
export async function createTag(name: string, slug: string) {
  const id = createId();
  await db.insert(schema.blogTags).values({
    id,
    name,
    slug,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { id, name, slug };
}

/**
 * Delete a tag
 */
export async function deleteTag(id: string) {
  // Delete post associations first
  await db
    .delete(schema.blogPostTags)
    .where(eq(schema.blogPostTags.tagId, id));
  await db.delete(schema.blogTags).where(eq(schema.blogTags.id, id));
}

/**
 * Check if a slug is available for a new post
 */
export async function isSlugAvailable(
  slug: string,
  excludePostId?: string
): Promise<boolean> {
  const existing = await db.query.blogPosts.findFirst({
    where: eq(schema.blogPosts.slug, slug),
    columns: { id: true },
  });

  if (!existing) return true;
  if (excludePostId && existing.id === excludePostId) return true;
  return false;
}

/**
 * Check if a category slug is available
 */
export async function isCategorySlugAvailable(slug: string): Promise<boolean> {
  const existing = await db.query.blogCategories.findFirst({
    where: eq(schema.blogCategories.slug, slug),
    columns: { id: true },
  });
  return !existing;
}

/**
 * Check if a tag slug is available
 */
export async function isTagSlugAvailable(slug: string): Promise<boolean> {
  const existing = await db.query.blogTags.findFirst({
    where: eq(schema.blogTags.slug, slug),
    columns: { id: true },
  });
  return !existing;
}
