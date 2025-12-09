import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

/**
 * GET /api/admin/optimize/content/[versionId]
 * Get full content version details including original and optimized content
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ versionId: string }> }
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { versionId } = await params;

  try {
    const version = await db.query.contentVersions.findFirst({
      where: eq(schema.contentVersions.id, versionId),
    });

    if (!version) {
      return NextResponse.json(
        { error: "Content version not found" },
        { status: 404 }
      );
    }

    // Get clinic info
    const clinic = await db.query.clinics.findFirst({
      where: eq(schema.clinics.id, version.clinicId),
    });

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error fetching content version:", error);
    return NextResponse.json(
      { error: "Failed to fetch content version" },
      { status: 500 }
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
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
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
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.action || !["approve", "reject", "apply"].includes(body.action)) {
    return NextResponse.json(
      { error: "Invalid action. Must be approve, reject, or apply" },
      { status: 400 }
    );
  }

  try {
    const version = await db.query.contentVersions.findFirst({
      where: eq(schema.contentVersions.id, versionId),
    });

    if (!version) {
      return NextResponse.json(
        { error: "Content version not found" },
        { status: 404 }
      );
    }

    // Handle different actions
    switch (body.action) {
      case "approve": {
        // Can approve pending versions
        if (version.status !== "pending") {
          return NextResponse.json(
            { error: `Cannot approve version with status: ${version.status}` },
            { status: 400 }
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

        return NextResponse.json({ success: true, message: "Content approved" });
      }

      case "reject": {
        // Can reject pending versions
        if (version.status !== "pending") {
          return NextResponse.json(
            { error: `Cannot reject version with status: ${version.status}` },
            { status: 400 }
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

        return NextResponse.json({ success: true, message: "Content rejected" });
      }

      case "apply": {
        // Can apply approved versions
        if (version.status !== "approved") {
          return NextResponse.json(
            { error: `Cannot apply version with status: ${version.status}. Must be approved first.` },
            { status: 400 }
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

        return NextResponse.json({
          success: true,
          message: "Content applied to clinic",
        });
      }
    }
  } catch (error) {
    console.error("Error updating content version:", error);
    return NextResponse.json(
      { error: "Failed to update content version" },
      { status: 500 }
    );
  }
}
