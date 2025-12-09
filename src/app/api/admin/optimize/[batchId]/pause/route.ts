import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

/**
 * POST /api/admin/optimize/[batchId]/pause
 * Pause a running batch
 */
export async function POST(
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

    // Can only pause processing batches
    if (batch.status !== "processing") {
      return NextResponse.json(
        { error: `Cannot pause batch with status: ${batch.status}` },
        { status: 400 }
      );
    }

    // Update batch status to paused
    await db
      .update(schema.optimizationBatches)
      .set({
        status: "paused",
        pausedAt: new Date(),
      })
      .where(eq(schema.optimizationBatches.id, batchId));

    return NextResponse.json({
      success: true,
      message: "Batch paused. Resume to continue processing.",
    });
  } catch (error) {
    console.error("Error pausing batch:", error);
    return NextResponse.json(
      { error: "Failed to pause batch" },
      { status: 500 }
    );
  }
}
