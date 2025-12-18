import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getBlogImportBatch, getLatestBlogImportBatch } from "@/lib/blog/blog-queries";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

/**
 * GET /api/admin/blog/migration/status
 * Get the status of migration batches
 *
 * Query params:
 * - batchId: Get status of specific batch
 * - latest: If true, get the latest batch
 * - history: Number of past batches to include (default: 5)
 */
export async function GET(request: Request) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batchId");
  const latest = searchParams.get("latest") === "true";
  const historyCount = parseInt(searchParams.get("history") || "5");

  try {
    // If requesting specific batch
    if (batchId) {
      const batch = await getBlogImportBatch(batchId);
      if (!batch) {
        return NextResponse.json(
          { success: false, error: "Batch not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        batch,
      });
    }

    // If requesting latest batch only
    if (latest) {
      const batch = await getLatestBlogImportBatch();
      return NextResponse.json({
        success: true,
        batch: batch || null,
      });
    }

    // Get batch history
    const batches = await db.query.blogImportBatches.findMany({
      orderBy: desc(schema.blogImportBatches.createdAt),
      limit: historyCount,
    });

    // Get overall blog stats
    const [postsCount, categoriesCount, tagsCount] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(schema.blogPosts),
      db
        .select({ count: sql<number>`count(*)` })
        .from(schema.blogCategories),
      db
        .select({ count: sql<number>`count(*)` })
        .from(schema.blogTags),
    ]);

    // Get posts by status
    const postsByStatus = await db
      .select({
        status: schema.blogPosts.status,
        count: sql<number>`count(*)`,
      })
      .from(schema.blogPosts)
      .groupBy(schema.blogPosts.status);

    return NextResponse.json({
      success: true,
      stats: {
        totalPosts: Number(postsCount[0]?.count || 0),
        totalCategories: Number(categoriesCount[0]?.count || 0),
        totalTags: Number(tagsCount[0]?.count || 0),
        postsByStatus: postsByStatus.reduce(
          (acc, row) => {
            acc[row.status] = Number(row.count);
            return acc;
          },
          {} as Record<string, number>
        ),
      },
      batches,
    });
  } catch (error) {
    console.error("Migration status error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get status",
      },
      { status: 500 }
    );
  }
}
