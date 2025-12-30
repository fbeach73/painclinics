import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getBroadcast } from "@/lib/broadcast/broadcast-queries";
import { sendTestEmail } from "@/lib/broadcast/broadcast-service";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/admin/broadcasts/[id]/test
 * Send a test email for this broadcast
 *
 * Body: { testEmail: string }
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { testEmail } = body;

    // Validate test email
    if (!testEmail || typeof testEmail !== "string") {
      return NextResponse.json(
        { error: "Test email is required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Check broadcast exists
    const broadcast = await getBroadcast(id);
    if (!broadcast) {
      return NextResponse.json(
        { error: "Broadcast not found" },
        { status: 404 }
      );
    }

    // Send test email
    const result = await sendTestEmail(id, testEmail);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send test email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    );
  }
}
