import { headers } from "next/headers";
import { eq, inArray, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

type AdminCheckResult =
  | { error: string; status: 401 | 403 }
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
 * POST /api/admin/optimize/content/bulk
 * Bulk approve, reject, or apply content versions
 */
export async function POST(request: Request) {
  const adminCheck = await checkAdmin();
  if ("error" in adminCheck) {
    return new Response(JSON.stringify({ error: adminCheck.error }), {
      status: adminCheck.status,
      headers: { "Content-Type": "application/json" },
    });
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
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.action || !["approve", "reject", "apply"].includes(body.action)) {
    return new Response(
      JSON.stringify({
        error: "Invalid action. Must be approve, reject, or apply",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!body.versionIds || body.versionIds.length === 0) {
    return new Response(
      JSON.stringify({ error: "No version IDs provided" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
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

    return new Response(
      JSON.stringify({
        success: true,
        action: body.action,
        successCount,
        errorCount,
        totalProcessed: versions.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing bulk action:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process bulk action" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
