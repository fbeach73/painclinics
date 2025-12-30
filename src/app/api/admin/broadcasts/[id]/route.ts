import { NextRequest, NextResponse } from "next/server";

import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import {
  getBroadcast,
  updateBroadcast,
  deleteBroadcast,
  type TargetAudience,
  type TargetFilters,
  type Attachment,
} from "@/lib/broadcast/broadcast-queries";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/admin/broadcasts/[id]
 * Get a single broadcast by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const { id } = await params;
    const broadcast = await getBroadcast(id);

    if (!broadcast) {
      return NextResponse.json(
        { error: "Broadcast not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(broadcast);
  } catch (error) {
    console.error("Error fetching broadcast:", error);
    return NextResponse.json(
      { error: "Failed to fetch broadcast" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/broadcasts/[id]
 * Update a draft broadcast
 *
 * Body: { name?, subject?, previewText?, htmlContent?, targetAudience?, targetFilters?, attachments? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const { id } = await params;
    const broadcast = await getBroadcast(id);

    if (!broadcast) {
      return NextResponse.json(
        { error: "Broadcast not found" },
        { status: 404 }
      );
    }

    // Only allow editing drafts
    if (broadcast.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft broadcasts can be edited" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      subject,
      previewText,
      htmlContent,
      targetAudience,
      targetFilters,
      attachments,
    } = body;

    // Validate targetAudience if provided
    if (targetAudience) {
      const validAudiences: TargetAudience[] = [
        "all_with_email",
        "featured_only",
        "by_state",
        "by_tier",
        "custom",
      ];
      if (!validAudiences.includes(targetAudience)) {
        return NextResponse.json(
          { error: "Invalid target audience" },
          { status: 400 }
        );
      }
    }

    const updated = await updateBroadcast(id, {
      ...(name !== undefined && { name }),
      ...(subject !== undefined && { subject }),
      ...(previewText !== undefined && { previewText }),
      ...(htmlContent !== undefined && { htmlContent }),
      ...(targetAudience !== undefined && { targetAudience: targetAudience as TargetAudience }),
      ...(targetFilters !== undefined && { targetFilters: targetFilters as TargetFilters }),
      ...(attachments !== undefined && { attachments: attachments as Attachment[] }),
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update broadcast" },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating broadcast:", error);
    return NextResponse.json(
      { error: "Failed to update broadcast" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/broadcasts/[id]
 * Delete a draft broadcast
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const { id } = await params;
    const broadcast = await getBroadcast(id);

    if (!broadcast) {
      return NextResponse.json(
        { error: "Broadcast not found" },
        { status: 404 }
      );
    }

    // Only allow deleting drafts
    if (broadcast.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft broadcasts can be deleted" },
        { status: 400 }
      );
    }

    const deleted = await deleteBroadcast(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete broadcast" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting broadcast:", error);
    return NextResponse.json(
      { error: "Failed to delete broadcast" },
      { status: 500 }
    );
  }
}
