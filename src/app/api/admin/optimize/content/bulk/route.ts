import { NextResponse } from "next/server";
import { eq, inArray, sql } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

/**
 * POST /api/admin/optimize/content/bulk
 * Bulk approve, reject, or apply content versions
 */
export async function POST(request: Request) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { user } = adminCheck;

  let body: {
    action: "approve" | "reject" | "apply";
    versionIds: string[];
    reviewNotes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.action || !["approve", "reject", "apply"].includes(body.action)) {
    return NextResponse.json(
      { error: "Invalid action. Must be approve, reject, or apply" },
      { status: 400 }
    );
  }

  if (!body.versionIds || body.versionIds.length === 0) {
    return NextResponse.json(
      { error: "No version IDs provided" },
      { status: 400 }
    );
  }

  try {
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ versionId: string; error: string }> = [];

    // Get all versions
    const versions = await db
      .select()
      .from(schema.contentVersions)
      .where(inArray(schema.contentVersions.id, body.versionIds));

    for (const version of versions) {
      try {
        switch (body.action) {
          case "approve": {
            if (version.status !== "pending") {
              errors.push({
                versionId: version.id,
                error: `Cannot approve version with status: ${version.status}`,
              });
              errorCount++;
              continue;
            }

            await db
              .update(schema.contentVersions)
              .set({
                status: "approved",
                reviewedAt: new Date(),
                reviewedBy: user.id,
                reviewNotes: body.reviewNotes,
              })
              .where(eq(schema.contentVersions.id, version.id));

            // Update batch counts
            if (version.optimizationBatchId) {
              await db.execute(sql`
                UPDATE optimization_batches
                SET pending_review_count = pending_review_count - 1,
                    approved_count = approved_count + 1
                WHERE id = ${version.optimizationBatchId}
              `);
            }

            successCount++;
            break;
          }

          case "reject": {
            if (version.status !== "pending") {
              errors.push({
                versionId: version.id,
                error: `Cannot reject version with status: ${version.status}`,
              });
              errorCount++;
              continue;
            }

            await db
              .update(schema.contentVersions)
              .set({
                status: "rejected",
                reviewedAt: new Date(),
                reviewedBy: user.id,
                reviewNotes: body.reviewNotes,
              })
              .where(eq(schema.contentVersions.id, version.id));

            // Update batch counts
            if (version.optimizationBatchId) {
              await db.execute(sql`
                UPDATE optimization_batches
                SET pending_review_count = pending_review_count - 1,
                    rejected_count = rejected_count + 1
                WHERE id = ${version.optimizationBatchId}
              `);
            }

            successCount++;
            break;
          }

          case "apply": {
            if (version.status !== "approved") {
              errors.push({
                versionId: version.id,
                error: `Cannot apply version with status: ${version.status}. Must be approved first.`,
              });
              errorCount++;
              continue;
            }

            // Update clinic content
            await db
              .update(schema.clinics)
              .set({
                content: version.optimizedContent,
                updatedAt: new Date(),
              })
              .where(eq(schema.clinics.id, version.clinicId));

            // Update version status
            await db
              .update(schema.contentVersions)
              .set({
                status: "applied",
                appliedAt: new Date(),
                appliedBy: user.id,
              })
              .where(eq(schema.contentVersions.id, version.id));

            successCount++;
            break;
          }
        }
      } catch (error) {
        errors.push({
          versionId: version.id,
          error:
            error instanceof Error ? error.message : "Unknown error",
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      action: body.action,
      successCount,
      errorCount,
      totalProcessed: versions.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error processing bulk action:", error);
    return NextResponse.json(
      { error: "Failed to process bulk action" },
      { status: 500 }
    );
  }
}
