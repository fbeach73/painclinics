import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

type AdminCheckResult =
  | { error: string; status: number }
  | { session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>; user: typeof schema.user.$inferSelect };

/**
 * Helper to check admin status for API routes
 */
async function checkAdmin(): Promise<AdminCheckResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, session.user.id),
  });

  if (!user || user.role !== "admin") {
    return { error: "Forbidden - Admin access required", status: 403 };
  }

  return { session, user };
}

/**
 * GET /api/admin/import/[batchId]
 * Get detailed status of an import batch
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const adminCheck = await checkAdmin();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  const { batchId } = await params;

  try {
    const batch = await db.query.importBatches.findFirst({
      where: eq(schema.importBatches.id, batchId),
    });

    if (!batch) {
      return NextResponse.json(
        { error: "Import batch not found" },
        { status: 404 }
      );
    }

    // Get clinics imported in this batch
    const clinicStats = await db
      .select({
        count: sql<number>`count(*)::int`,
        states: sql<string[]>`array_agg(DISTINCT state)`,
        avgRating: sql<number>`avg(rating)`,
        totalReviews: sql<number>`sum(review_count)::int`,
      })
      .from(schema.clinics)
      .where(eq(schema.clinics.importBatchId, batchId));

    // Get clinics by state
    const clinicsByState = await db
      .select({
        state: schema.clinics.state,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.clinics)
      .where(eq(schema.clinics.importBatchId, batchId))
      .groupBy(schema.clinics.state)
      .orderBy(sql`count(*) DESC`);

    return NextResponse.json({
      batch: {
        id: batch.id,
        fileName: batch.fileName,
        status: batch.status,
        totalRecords: batch.totalRecords,
        successCount: batch.successCount,
        errorCount: batch.errorCount,
        skipCount: batch.skipCount,
        errors: batch.errors,
        createdAt: batch.createdAt,
        completedAt: batch.completedAt,
      },
      stats: {
        clinicsInDatabase: clinicStats[0]?.count || 0,
        uniqueStates: clinicStats[0]?.states?.length || 0,
        averageRating: clinicStats[0]?.avgRating
          ? Number(clinicStats[0].avgRating.toFixed(2))
          : null,
        totalReviews: clinicStats[0]?.totalReviews || 0,
      },
      clinicsByState,
    });
  } catch (error) {
    console.error("Error getting batch status:", error);
    return NextResponse.json(
      { error: "Failed to get batch status" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/import/[batchId]
 * Rollback an import batch - delete all clinics associated with this batch
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const adminCheck = await checkAdmin();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  const { batchId } = await params;

  try {
    // Check batch exists
    const batch = await db.query.importBatches.findFirst({
      where: eq(schema.importBatches.id, batchId),
    });

    if (!batch) {
      return NextResponse.json(
        { error: "Import batch not found" },
        { status: 404 }
      );
    }

    // Prevent rolling back if already rolled back
    if (batch.status === "rolled_back") {
      return NextResponse.json(
        { error: "This batch has already been rolled back" },
        { status: 400 }
      );
    }

    // Count clinics to be deleted
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.clinics)
      .where(eq(schema.clinics.importBatchId, batchId));

    const clinicCount = countResult[0]?.count || 0;

    if (clinicCount === 0) {
      // No clinics to delete, just update status
      await db
        .update(schema.importBatches)
        .set({ status: "rolled_back" })
        .where(eq(schema.importBatches.id, batchId));

      return NextResponse.json({
        message: "No clinics found for this batch",
        deletedCount: 0,
        batchId,
      });
    }

    // Delete all clinics from this batch
    await db
      .delete(schema.clinics)
      .where(eq(schema.clinics.importBatchId, batchId));

    // Update batch status
    await db
      .update(schema.importBatches)
      .set({ status: "rolled_back" })
      .where(eq(schema.importBatches.id, batchId));

    return NextResponse.json({
      message: `Successfully rolled back import batch`,
      deletedCount: clinicCount,
      batchId,
    });
  } catch (error) {
    console.error("Rollback error:", error);
    return NextResponse.json(
      { error: "Failed to rollback import batch" },
      { status: 500 }
    );
  }
}
