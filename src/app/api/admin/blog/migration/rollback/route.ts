import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getBlogImportBatch } from "@/lib/blog/blog-queries";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { deleteFile } from "@/lib/storage";

/**
 * POST /api/admin/blog/migration/rollback
 * Rollback a migration batch - delete all posts imported in that batch
 *
 * Request body:
 * - batchId: ID of the batch to rollback
 * - deleteImages: boolean (default: false) - Also delete migrated images from storage
 */
export async function POST(request: Request) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  let body: { batchId: string; deleteImages?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { batchId, deleteImages = false } = body;

  if (!batchId) {
    return NextResponse.json(
      { success: false, error: "batchId is required" },
      { status: 400 }
    );
  }

  try {
    // Get the batch
    const batch = await getBlogImportBatch(batchId);
    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch not found" },
        { status: 404 }
      );
    }

    // Get all posts from this batch
    const posts = await db.query.blogPosts.findMany({
      where: eq(schema.blogPosts.importBatchId, batchId),
      columns: {
        id: true,
        slug: true,
        featuredImageUrl: true,
        migrationMetadata: true,
      },
    });

    if (posts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No posts to rollback",
        stats: {
          postsDeleted: 0,
          imagesDeleted: 0,
        },
      });
    }

    const postIds = posts.map((p) => p.id);
    let imagesDeleted = 0;

    // Delete images if requested
    if (deleteImages) {
      for (const post of posts) {
        // Delete featured image
        if (
          post.featuredImageUrl &&
          !post.featuredImageUrl.includes("painclinics.com")
        ) {
          try {
            await deleteFile(post.featuredImageUrl);
            imagesDeleted++;
          } catch {
            // Ignore delete errors
          }
        }

        // Delete content images from mapping
        const metadata = post.migrationMetadata as {
          imageMapping?: Record<string, string>;
        } | null;
        if (metadata?.imageMapping) {
          for (const newUrl of Object.values(metadata.imageMapping)) {
            if (newUrl && !newUrl.includes("painclinics.com")) {
              try {
                await deleteFile(newUrl);
                imagesDeleted++;
              } catch {
                // Ignore delete errors
              }
            }
          }
        }
      }
    }

    // Delete post-category associations
    await db
      .delete(schema.blogPostCategories)
      .where(inArray(schema.blogPostCategories.postId, postIds));

    // Delete post-tag associations
    await db
      .delete(schema.blogPostTags)
      .where(inArray(schema.blogPostTags.postId, postIds));

    // Delete the posts
    await db
      .delete(schema.blogPosts)
      .where(eq(schema.blogPosts.importBatchId, batchId));

    // Update batch status
    await db
      .update(schema.blogImportBatches)
      .set({ status: "rolled_back" })
      .where(eq(schema.blogImportBatches.id, batchId));

    // Note: We don't automatically delete orphaned categories/tags
    // as they might be used for future imports

    return NextResponse.json({
      success: true,
      message: `Rolled back batch ${batchId}`,
      stats: {
        postsDeleted: posts.length,
        imagesDeleted,
        batchStatus: "rolled_back",
      },
    });
  } catch (error) {
    console.error("Rollback error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Rollback failed",
      },
      { status: 500 }
    );
  }
}
