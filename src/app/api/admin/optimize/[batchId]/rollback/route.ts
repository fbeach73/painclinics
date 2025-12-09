import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

/**
 * POST /api/admin/optimize/[batchId]/rollback
 * Rollback all applied content versions in a batch
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

    // Get all applied content versions for this batch
    const appliedVersions = await db
      .select()
      .from(schema.contentVersions)
      .where(eq(schema.contentVersions.optimizationBatchId, batchId));

    const appliedCount = appliedVersions.filter(
      (v) => v.status === "applied"
    ).length;

    if (appliedCount === 0) {
      return NextResponse.json({
        success: true,
        message: "No applied content versions to rollback",
        rolledBackCount: 0,
      });
    }

    // Rollback each applied version
    let rolledBackCount = 0;
    const errors: Array<{ clinicId: string; error: string }> = [];

    for (const version of appliedVersions) {
      if (version.status !== "applied") continue;

      try {
        // Restore original content to clinic
        if (version.originalContent) {
          await db
            .update(schema.clinics)
            .set({
              content: version.originalContent,
              updatedAt: new Date(),
            })
            .where(eq(schema.clinics.id, version.clinicId));
        }

        // Mark version as rolled back
        await db
          .update(schema.contentVersions)
          .set({
            status: "rolled_back",
          })
          .where(eq(schema.contentVersions.id, version.id));

        rolledBackCount++;
      } catch (error) {
        errors.push({
          clinicId: version.clinicId,
          error:
            error instanceof Error ? error.message : "Unknown rollback error",
        });
      }
    }

    // Update batch status
    await db
      .update(schema.optimizationBatches)
      .set({
        approvedCount: Math.max(0, (batch.approvedCount || 0) - rolledBackCount),
      })
      .where(eq(schema.optimizationBatches.id, batchId));

    return NextResponse.json({
      success: true,
      message: `Rolled back ${rolledBackCount} content versions`,
      rolledBackCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error rolling back batch:", error);
    return NextResponse.json(
      { error: "Failed to rollback batch" },
      { status: 500 }
    );
  }
}
