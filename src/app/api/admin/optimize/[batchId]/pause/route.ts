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
 * POST /api/admin/optimize/[batchId]/pause
 * Pause a running batch
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

    // Can only pause processing batches
    if (batch.status !== "processing") {
      return new Response(
        JSON.stringify({
          error: `Cannot pause batch with status: ${batch.status}`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
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

    return new Response(
      JSON.stringify({
        success: true,
        message: "Batch paused. Resume to continue processing.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error pausing batch:", error);
    return new Response(JSON.stringify({ error: "Failed to pause batch" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
