import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
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
 * GET /api/admin/optimize/content/[versionId]
 * Get full content version details including original and optimized content
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ versionId: string }> }
) {
  const adminCheck = await checkAdmin();
  if ("error" in adminCheck) {
    return new Response(JSON.stringify({ error: adminCheck.error }), {
      status: adminCheck.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { versionId } = await params;

  try {
    const version = await db.query.contentVersions.findFirst({
      where: eq(schema.contentVersions.id, versionId),
    });

    if (!version) {
      return new Response(
        JSON.stringify({ error: "Content version not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get clinic info
    const clinic = await db.query.clinics.findFirst({
      where: eq(schema.clinics.id, version.clinicId),
    });

    return new Response(
      JSON.stringify({
        version,
        clinic: clinic
          ? {
              id: clinic.id,
              title: clinic.title,
              city: clinic.city,
              state: clinic.state,
              streetAddress: clinic.streetAddress,
              phone: clinic.phone,
              rating: clinic.rating,
              reviewCount: clinic.reviewCount,
              reviewKeywords: clinic.reviewKeywords,
            }
          : null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching content version:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch content version" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * PUT /api/admin/optimize/content/[versionId]
 * Update content version status (approve, reject, apply)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ versionId: string }> }
) {
  const adminCheck = await checkAdmin();
  if ("error" in adminCheck) {
    return new Response(JSON.stringify({ error: adminCheck.error }), {
      status: adminCheck.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { user } = adminCheck;
  const { versionId } = await params;

  let body: {
    action: "approve" | "reject" | "apply";
    reviewNotes?: string;
    editedContent?: string;
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
      JSON.stringify({ error: "Invalid action. Must be approve, reject, or apply" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const version = await db.query.contentVersions.findFirst({
      where: eq(schema.contentVersions.id, versionId),
    });

    if (!version) {
      return new Response(
        JSON.stringify({ error: "Content version not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle different actions
    switch (body.action) {
      case "approve": {
        // Can approve pending versions
        if (version.status !== "pending") {
          return new Response(
            JSON.stringify({
              error: `Cannot approve version with status: ${version.status}`,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        await db
          .update(schema.contentVersions)
          .set({
            status: "approved",
            optimizedContent: body.editedContent || version.optimizedContent,
            reviewedAt: new Date(),
            reviewedBy: user.id,
            reviewNotes: body.reviewNotes,
          })
          .where(eq(schema.contentVersions.id, versionId));

        // Update batch counts
        if (version.optimizationBatchId) {
          await db.execute(sql`
            UPDATE optimization_batches
            SET pending_review_count = pending_review_count - 1,
                approved_count = approved_count + 1
            WHERE id = ${version.optimizationBatchId}
          `);
        }

        return new Response(
          JSON.stringify({ success: true, message: "Content approved" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      case "reject": {
        // Can reject pending versions
        if (version.status !== "pending") {
          return new Response(
            JSON.stringify({
              error: `Cannot reject version with status: ${version.status}`,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        await db
          .update(schema.contentVersions)
          .set({
            status: "rejected",
            reviewedAt: new Date(),
            reviewedBy: user.id,
            reviewNotes: body.reviewNotes,
          })
          .where(eq(schema.contentVersions.id, versionId));

        // Update batch counts
        if (version.optimizationBatchId) {
          await db.execute(sql`
            UPDATE optimization_batches
            SET pending_review_count = pending_review_count - 1,
                rejected_count = rejected_count + 1
            WHERE id = ${version.optimizationBatchId}
          `);
        }

        return new Response(
          JSON.stringify({ success: true, message: "Content rejected" }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      case "apply": {
        // Can apply approved versions
        if (version.status !== "approved") {
          return new Response(
            JSON.stringify({
              error: `Cannot apply version with status: ${version.status}. Must be approved first.`,
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
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
          .where(eq(schema.contentVersions.id, versionId));

        return new Response(
          JSON.stringify({
            success: true,
            message: "Content applied to clinic",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }
  } catch (error) {
    console.error("Error updating content version:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update content version" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
