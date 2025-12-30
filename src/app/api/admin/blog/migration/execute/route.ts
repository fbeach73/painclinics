import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { checkAdminApi } from "@/lib/admin-auth";
import { getBlogPostByWpId, getCategoryByWpId, getTagByWpId } from "@/lib/blog/blog-queries";
import { processContent, generateRedirectConfig, cleanupWordPressHtml, extractExcerpt, sanitizeHtml } from "@/lib/blog/content-processor";
import { extractImageUrls, migrateAllImages, migrateFeaturedImage } from "@/lib/blog/image-migrator";
import type { WPCategory } from "@/lib/blog/types";
import {
  fetchAllWPPosts,
  fetchAllWPCategories,
  fetchAllWPTags,
  decodeHtmlEntities,
  getFeaturedImageFromPost,
  getAuthorFromPost,
} from "@/lib/blog/wordpress-api";
import { db } from "@/lib/db";
import { stripHtmlTags } from "@/lib/html-utils";
import * as schema from "@/lib/schema";

/**
 * POST /api/admin/blog/migration/execute
 * Execute the migration from WordPress with SSE progress streaming
 *
 * Request body:
 * - skipExisting: boolean (default: true) - Skip posts that already exist
 * - migrateImages: boolean (default: true) - Migrate images to Vercel Blob
 */
export async function POST(request: Request) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return new Response(JSON.stringify({ error: adminCheck.error }), {
      status: adminCheck.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { skipExisting?: boolean; migrateImages?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // Use defaults if no body provided
  }

  const skipExisting = body.skipExisting ?? true;
  const migrateImages = body.migrateImages ?? true;

  // Create SSE response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) => {
        const sseMessage = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(sseMessage));
      };

      const batchId = createId();
      let categoriesCreated = 0;
      let tagsCreated = 0;
      let postsProcessed = 0;
      let postsSuccess = 0;
      let postsError = 0;
      let postsSkipped = 0;
      let imagesProcessed = 0;
      let imagesSuccess = 0;
      let imagesError = 0;
      const errors: Array<{ type: string; item: string; error: string }> = [];
      const globalImageMapping: Record<string, string> = {};
      const importedSlugs: string[] = [];

      try {
        // Create import batch record
        await db.insert(schema.blogImportBatches).values({
          id: batchId,
          status: "fetching",
          sourceUrl: "https://painclinics.com",
          importedBy: adminCheck.user.id,
        });

        send("status", { phase: "fetching", message: "Fetching WordPress data..." });

        // ============================================
        // Phase 1: Fetch all data from WordPress
        // ============================================

        send("progress", { phase: "categories", current: 0, total: 0, message: "Fetching categories..." });
        const wpCategories = await fetchAllWPCategories();
        send("progress", { phase: "categories", current: wpCategories.length, total: wpCategories.length, message: `Found ${wpCategories.length} categories` });

        send("progress", { phase: "tags", current: 0, total: 0, message: "Fetching tags..." });
        const wpTags = await fetchAllWPTags();
        send("progress", { phase: "tags", current: wpTags.length, total: wpTags.length, message: `Found ${wpTags.length} tags` });

        send("progress", { phase: "posts", current: 0, total: 0, message: "Fetching posts..." });
        const wpPosts = await fetchAllWPPosts((current, total) => {
          send("progress", { phase: "posts", current, total, message: `Fetching posts... ${current}/${total}` });
        });
        send("progress", { phase: "posts", current: wpPosts.length, total: wpPosts.length, message: `Found ${wpPosts.length} posts` });

        // Update batch with total
        await db
          .update(schema.blogImportBatches)
          .set({ totalPostsFound: wpPosts.length, status: "processing" })
          .where(eq(schema.blogImportBatches.id, batchId));

        // ============================================
        // Phase 2: Import categories
        // ============================================

        send("status", { phase: "categories", message: "Importing categories..." });

        // Build WP ID to local ID mapping
        const categoryWpToLocalId: Record<number, string> = {};

        // Sort categories to process parents first
        const sortedCategories = sortByParent(wpCategories);

        for (const [index, wpCat] of sortedCategories.entries()) {
          try {
            const existing = await getCategoryByWpId(wpCat.id);
            if (existing) {
              categoryWpToLocalId[wpCat.id] = existing.id;
            } else {
              // Find parent local ID if exists
              let parentId: string | null = null;
              if (wpCat.parent > 0) {
                parentId = categoryWpToLocalId[wpCat.parent] || null;
              }

              const newCat = {
                id: createId(),
                wpId: wpCat.id,
                name: decodeHtmlEntities(wpCat.name),
                slug: wpCat.slug,
                description: wpCat.description || null,
                parentId,
              };

              await db.insert(schema.blogCategories).values(newCat);
              categoryWpToLocalId[wpCat.id] = newCat.id;
              categoriesCreated++;
            }

            send("progress", {
              phase: "categories",
              current: index + 1,
              total: sortedCategories.length,
              item: decodeHtmlEntities(wpCat.name),
            });
          } catch (error) {
            errors.push({
              type: "category",
              item: wpCat.name,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        // ============================================
        // Phase 3: Import tags
        // ============================================

        send("status", { phase: "tags", message: "Importing tags..." });

        const tagWpToLocalId: Record<number, string> = {};

        for (const [index, wpTag] of wpTags.entries()) {
          try {
            const existing = await getTagByWpId(wpTag.id);
            if (existing) {
              tagWpToLocalId[wpTag.id] = existing.id;
            } else {
              const newTag = {
                id: createId(),
                wpId: wpTag.id,
                name: decodeHtmlEntities(wpTag.name),
                slug: wpTag.slug,
              };

              await db.insert(schema.blogTags).values(newTag);
              tagWpToLocalId[wpTag.id] = newTag.id;
              tagsCreated++;
            }

            send("progress", {
              phase: "tags",
              current: index + 1,
              total: wpTags.length,
              item: decodeHtmlEntities(wpTag.name),
            });
          } catch (error) {
            errors.push({
              type: "tag",
              item: wpTag.name,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        // ============================================
        // Phase 4: Import posts with image migration
        // ============================================

        send("status", { phase: "posts", message: "Importing posts..." });

        for (const [index, wpPost] of wpPosts.entries()) {
          try {
            postsProcessed++;
            const postTitle = decodeHtmlEntities(wpPost.title.rendered);

            send("progress", {
              phase: "posts",
              current: index + 1,
              total: wpPosts.length,
              item: postTitle,
              subphase: "checking",
            });

            // Check if post already exists
            const existing = await getBlogPostByWpId(wpPost.id);
            if (existing && skipExisting) {
              postsSkipped++;
              send("post_skipped", { wpId: wpPost.id, slug: wpPost.slug, reason: "Already exists" });
              continue;
            }

            // Get author and featured image info
            const author = getAuthorFromPost(wpPost);
            const featuredImageInfo = getFeaturedImageFromPost(wpPost);

            // Extract images from content
            const content = wpPost.content.rendered;
            let processedContent = content;
            let featuredImageUrl = featuredImageInfo.url;
            const postImageMapping: Record<string, string> = {};

            if (migrateImages) {
              send("progress", {
                phase: "posts",
                current: index + 1,
                total: wpPosts.length,
                item: postTitle,
                subphase: "images",
              });

              // Extract all images from content
              const contentImages = extractImageUrls(content);

              if (contentImages.length > 0) {
                // Migrate content images
                const imageMappingResult = await migrateAllImages(
                  contentImages,
                  (current, total, url) => {
                    send("image", {
                      postSlug: wpPost.slug,
                      current,
                      total,
                      url: url.split("/").pop() || url,
                    });
                  }
                );

                // Update counters and mapping
                for (const [origUrl, newUrl] of Object.entries(imageMappingResult)) {
                  postImageMapping[origUrl] = newUrl;
                  globalImageMapping[origUrl] = newUrl;
                  imagesProcessed++;
                  if (origUrl !== newUrl) {
                    imagesSuccess++;
                  } else {
                    imagesError++;
                  }
                }
              }

              // Migrate featured image
              if (featuredImageInfo.url) {
                const featuredResult = await migrateFeaturedImage(featuredImageInfo.url);
                if (featuredResult.success && featuredResult.url) {
                  featuredImageUrl = featuredResult.url;
                  imagesProcessed++;
                  imagesSuccess++;
                } else if (featuredResult.error) {
                  imagesProcessed++;
                  imagesError++;
                }
              }
            }

            // Process content (update image URLs and internal links)
            processedContent = processContent(content, { imageMapping: postImageMapping });
            processedContent = cleanupWordPressHtml(processedContent);
            processedContent = sanitizeHtml(processedContent);

            // Generate excerpt if not provided
            const rawExcerpt = wpPost.excerpt.rendered
              ? stripHtmlTags(decodeHtmlEntities(wpPost.excerpt.rendered))
              : extractExcerpt(content);

            // Create the post
            const postId = createId();
            const postData = {
              id: postId,
              wpId: wpPost.id,
              title: postTitle,
              slug: wpPost.slug,
              content: processedContent,
              excerpt: rawExcerpt,
              metaTitle: postTitle,
              metaDescription: rawExcerpt,
              featuredImageUrl,
              featuredImageAlt: featuredImageInfo.alt,
              wpFeaturedImageUrl: featuredImageInfo.url,
              authorName: author.name,
              authorSlug: author.slug,
              status: "published" as const,
              publishedAt: new Date(wpPost.date),
              wpCreatedAt: new Date(wpPost.date),
              wpModifiedAt: new Date(wpPost.modified),
              importBatchId: batchId,
              migrationMetadata: {
                wpUrl: `https://painclinics.com/${wpPost.slug}/`,
                imageMapping: postImageMapping,
                imagesTotal: Object.keys(postImageMapping).length,
              },
            };

            if (existing) {
              // Update existing post
              await db
                .update(schema.blogPosts)
                .set(postData)
                .where(eq(schema.blogPosts.id, existing.id));
            } else {
              // Insert new post
              await db.insert(schema.blogPosts).values(postData);
            }

            // Create category associations
            for (const wpCatId of wpPost.categories) {
              const localCatId = categoryWpToLocalId[wpCatId];
              if (localCatId) {
                // Check if association already exists
                const existingAssoc = await db.query.blogPostCategories.findFirst({
                  where: (pc, { and, eq }) =>
                    and(eq(pc.postId, postId), eq(pc.categoryId, localCatId)),
                });

                if (!existingAssoc) {
                  await db.insert(schema.blogPostCategories).values({
                    id: createId(),
                    postId,
                    categoryId: localCatId,
                  });
                }
              }
            }

            // Create tag associations
            for (const wpTagId of wpPost.tags) {
              const localTagId = tagWpToLocalId[wpTagId];
              if (localTagId) {
                // Check if association already exists
                const existingAssoc = await db.query.blogPostTags.findFirst({
                  where: (pt, { and, eq }) =>
                    and(eq(pt.postId, postId), eq(pt.tagId, localTagId)),
                });

                if (!existingAssoc) {
                  await db.insert(schema.blogPostTags).values({
                    id: createId(),
                    postId,
                    tagId: localTagId,
                  });
                }
              }
            }

            importedSlugs.push(wpPost.slug);
            postsSuccess++;

            send("post_complete", {
              wpId: wpPost.id,
              slug: wpPost.slug,
              title: postTitle,
              imagesCount: Object.keys(postImageMapping).length,
            });
          } catch (error) {
            postsError++;
            errors.push({
              type: "post",
              item: wpPost.slug,
              error: error instanceof Error ? error.message : "Unknown error",
            });
            send("post_error", {
              wpId: wpPost.id,
              slug: wpPost.slug,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        // ============================================
        // Phase 5: Generate redirects
        // ============================================

        send("status", { phase: "redirects", message: "Generating redirects..." });

        const redirects = generateRedirectConfig(importedSlugs);

        // ============================================
        // Phase 6: Update batch record
        // ============================================

        await db
          .update(schema.blogImportBatches)
          .set({
            status: "completed",
            postsProcessed,
            postsSuccess,
            postsError,
            postsSkipped,
            imagesProcessed,
            imagesSuccess,
            imagesError,
            categoriesCreated,
            tagsCreated,
            errors: errors.length > 0 ? errors : null,
            imageMapping: globalImageMapping,
            redirects,
            completedAt: new Date(),
          })
          .where(eq(schema.blogImportBatches.id, batchId));

        // Send completion event
        send("complete", {
          batchId,
          stats: {
            categoriesCreated,
            tagsCreated,
            postsProcessed,
            postsSuccess,
            postsError,
            postsSkipped,
            imagesProcessed,
            imagesSuccess,
            imagesError,
          },
          redirectsCount: redirects.length,
          errorsCount: errors.length,
        });
      } catch (error) {
        // Update batch as failed
        await db
          .update(schema.blogImportBatches)
          .set({
            status: "failed",
            errors: [
              {
                type: "fatal",
                item: "migration",
                error: error instanceof Error ? error.message : "Unknown error",
              },
            ],
          })
          .where(eq(schema.blogImportBatches.id, batchId));

        send("error", {
          message: error instanceof Error ? error.message : "Migration failed",
          batchId,
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/**
 * Sort categories so parents come before children
 */
function sortByParent(categories: WPCategory[]): WPCategory[] {
  const sorted: WPCategory[] = [];
  const remaining = [...categories];
  const processed = new Set<number>();

  // First pass: add all categories with no parent
  for (const cat of categories) {
    if (cat.parent === 0) {
      sorted.push(cat);
      processed.add(cat.id);
    }
  }

  // Keep adding children until all are processed
  let iterations = 0;
  const maxIterations = categories.length * 2;

  while (sorted.length < categories.length && iterations < maxIterations) {
    for (const cat of remaining) {
      if (!processed.has(cat.id) && processed.has(cat.parent)) {
        sorted.push(cat);
        processed.add(cat.id);
      }
    }
    iterations++;
  }

  // Add any remaining (shouldn't happen with valid data)
  for (const cat of remaining) {
    if (!processed.has(cat.id)) {
      sorted.push(cat);
    }
  }

  return sorted;
}
