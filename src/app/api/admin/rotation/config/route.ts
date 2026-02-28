import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import {
  getRotationConfig,
  saveRotationConfig,
} from "@/lib/rotation/featured-rotation";

/**
 * GET /api/admin/rotation/config
 * Get the rotation email template config.
 */
export async function GET() {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const config = await getRotationConfig();
  return NextResponse.json({ config });
}

/**
 * POST /api/admin/rotation/config
 * Save rotation email template config.
 */
export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const body = await request.json().catch(() => null);
  if (!body?.emailSubject || !body?.emailHtmlContent) {
    return NextResponse.json(
      { error: "emailSubject and emailHtmlContent are required" },
      { status: 400 }
    );
  }

  await saveRotationConfig({
    emailSubject: body.emailSubject,
    emailPreviewText: body.emailPreviewText || null,
    emailHtmlContent: body.emailHtmlContent,
    batchSize: typeof body.batchSize === "number" ? body.batchSize : 150,
  });

  return NextResponse.json({ success: true });
}
