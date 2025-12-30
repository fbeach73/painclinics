import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getBroadcast } from "@/lib/broadcast/broadcast-queries";
import { sendBroadcast } from "@/lib/broadcast/broadcast-service";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/admin/broadcasts/[id]/send
 * Start sending a broadcast to all target recipients
 *
 * This will update the broadcast status to "sending" and begin
 * the batch email process. The response returns immediately while
 * emails are sent in the background.
 */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const { id } = await params;

    // Check broadcast exists
    const broadcast = await getBroadcast(id);
    if (!broadcast) {
      return NextResponse.json(
        { error: "Broadcast not found" },
        { status: 404 }
      );
    }

    // Check broadcast is in draft status
    if (broadcast.status !== "draft") {
      return NextResponse.json(
        { error: `Broadcast is already ${broadcast.status}` },
        { status: 400 }
      );
    }

    // Validate broadcast has required content
    if (!broadcast.subject || !broadcast.htmlContent) {
      return NextResponse.json(
        { error: "Broadcast must have subject and content before sending" },
        { status: 400 }
      );
    }

    // Start sending (runs in the background for large lists)
    // For serverless environments, this will run synchronously
    const result = await sendBroadcast(id);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Failed to send broadcast",
          sentCount: result.sentCount,
          failedCount: result.failedCount,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      broadcastId: result.broadcastId,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
    });
  } catch (error) {
    console.error("Error sending broadcast:", error);
    return NextResponse.json(
      { error: "Failed to send broadcast" },
      { status: 500 }
    );
  }
}
