import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import {
  createBroadcast,
  listBroadcasts,
  type BroadcastStatus,
  type TargetAudience,
  type TargetFilters,
  type Attachment,
} from "@/lib/broadcast/broadcast-queries";

/**
 * GET /api/admin/broadcasts
 * List broadcasts with pagination and optional status filter
 */
export async function GET(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") as BroadcastStatus | null;
    const offset = (page - 1) * limit;

    const result = await listBroadcasts(
      status
        ? { status, limit, offset }
        : { limit, offset }
    );

    return NextResponse.json({
      broadcasts: result.broadcasts,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  } catch (error) {
    console.error("Error fetching broadcasts:", error);
    return NextResponse.json(
      { error: "Failed to fetch broadcasts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/broadcasts
 * Create a new broadcast
 *
 * Body: { name, subject, previewText?, htmlContent, targetAudience?, targetFilters?, attachments? }
 */
export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
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

    // Validate required fields
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== "string") {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 }
      );
    }

    if (!htmlContent || typeof htmlContent !== "string") {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    // Validate targetAudience if provided
    const validAudiences: TargetAudience[] = [
      "all_with_email",
      "featured_only",
      "by_state",
      "by_tier",
      "custom",
      "manual",
    ];
    if (targetAudience && !validAudiences.includes(targetAudience)) {
      return NextResponse.json(
        { error: "Invalid target audience" },
        { status: 400 }
      );
    }

    // Create the broadcast
    const broadcast = await createBroadcast({
      name,
      subject,
      previewText,
      htmlContent,
      ...(targetAudience && { targetAudience: targetAudience as TargetAudience }),
      ...(targetFilters && { targetFilters: targetFilters as TargetFilters }),
      ...(attachments && { attachments: attachments as Attachment[] }),
      createdBy: adminCheck.user.id,
    });

    return NextResponse.json(broadcast, { status: 201 });
  } catch (error) {
    console.error("Error creating broadcast:", error);
    return NextResponse.json(
      { error: "Failed to create broadcast" },
      { status: 500 }
    );
  }
}
