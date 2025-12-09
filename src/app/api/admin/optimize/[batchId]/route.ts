import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

/**
 * GET /api/admin/optimize/[batchId]
 * Get batch details with content version stats
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { batchId } = await params;

  try {
    const batch = await db.query.optimizationBatches.findFirst({
      where: eq(schema.optimizationBatches.id, batchId),
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    // Get content version stats for this batch
    const versionStats = await db
      .select({
        status: schema.contentVersions.status,
        count: sql<number>`count(*)`,
      })
      .from(schema.contentVersions)
      .where(eq(schema.contentVersions.optimizationBatchId, batchId))
      .groupBy(schema.contentVersions.status);

    // Get recent content versions with clinic info
    const recentVersions = await db
      .select({
        id: schema.contentVersions.id,
        clinicId: schema.contentVersions.clinicId,
        clinicTitle: schema.clinics.title,
        clinicCity: schema.clinics.city,
        clinicState: schema.clinics.state,
        status: schema.contentVersions.status,
        wordCountBefore: schema.contentVersions.wordCountBefore,
        wordCountAfter: schema.contentVersions.wordCountAfter,
        cost: schema.contentVersions.cost,
        validationPassed: schema.contentVersions.validationPassed,
        requiresManualReview: schema.contentVersions.requiresManualReview,
        createdAt: schema.contentVersions.createdAt,
      })
      .from(schema.contentVersions)
      .innerJoin(
        schema.clinics,
        eq(schema.contentVersions.clinicId, schema.clinics.id)
      )
      .where(eq(schema.contentVersions.optimizationBatchId, batchId))
      .orderBy(schema.contentVersions.createdAt)
      .limit(100);

    // Calculate stats from version stats
    const statsMap = Object.fromEntries(
      versionStats.map((s) => [s.status, s.count])
    );

    return NextResponse.json({
      batch,
      versionStats: {
        pending: statsMap.pending || 0,
        approved: statsMap.approved || 0,
        rejected: statsMap.rejected || 0,
        applied: statsMap.applied || 0,
        rolledBack: statsMap.rolled_back || 0,
      },
      recentVersions,
    });
  } catch (error) {
    console.error("Error fetching batch details:", error);
    return NextResponse.json(
      { error: "Failed to fetch batch details" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/optimize/[batchId]
 * Cancel/delete a batch (only if pending or paused)
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { batchId } = await params;

  try {
    const batch = await db.query.optimizationBatches.findFirst({
      where: eq(schema.optimizationBatches.id, batchId),
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    // Can only cancel pending, paused, or awaiting_review batches
    if (!["pending", "paused", "awaiting_review"].includes(batch.status || "")) {
      return NextResponse.json(
        { error: `Cannot cancel batch with status: ${batch.status}` },
        { status: 400 }
      );
    }

    // Delete all content versions for this batch that aren't applied
    await db
      .delete(schema.contentVersions)
      .where(eq(schema.contentVersions.optimizationBatchId, batchId));

    // Update batch status
    await db
      .update(schema.optimizationBatches)
      .set({
        status: "cancelled",
        completedAt: new Date(),
      })
      .where(eq(schema.optimizationBatches.id, batchId));

    return NextResponse.json({ success: true, message: "Batch cancelled" });
  } catch (error) {
    console.error("Error cancelling batch:", error);
    return NextResponse.json(
      { error: "Failed to cancel batch" },
      { status: 500 }
    );
  }
}
