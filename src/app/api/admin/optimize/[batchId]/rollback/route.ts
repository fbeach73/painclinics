import { headers } from "next/headers";
import { eq } from "drizzle-orm";
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
 * POST /api/admin/optimize/[batchId]/rollback
 * Rollback all applied content versions in a batch
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const adminCheck = await checkAdmin();
  if ("error" in adminCheck) {
    return new Response(JSON.stringify({ error: adminCheck.error }), {
      status: adminCheck.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { batchId } = await params;

  try {
    const batch = await db.query.optimizationBatches.findFirst({
      where: eq(schema.optimizationBatches.id, batchId),
    });

    if (!batch) {
      return new Response(JSON.stringify({ error: "Batch not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
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
      return new Response(
        JSON.stringify({
          success: true,
          message: "No applied content versions to rollback",
          rolledBackCount: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
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

    return new Response(
      JSON.stringify({
        success: true,
        message: `Rolled back ${rolledBackCount} content versions`,
        rolledBackCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error rolling back batch:", error);
    return new Response(
      JSON.stringify({ error: "Failed to rollback batch" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
