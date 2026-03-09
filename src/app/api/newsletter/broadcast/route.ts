import { NextRequest, NextResponse } from "next/server";
import { createBroadcast } from "@/lib/broadcast/broadcast-queries";
import { sendBroadcast } from "@/lib/broadcast/broadcast-service";

/**
 * POST /api/newsletter/broadcast
 *
 * External endpoint for the standalone newsletter app to send broadcasts.
 * Auth: X-API-Key header must match NEWSLETTER_API_KEY env var.
 *
 * Body:
 * {
 *   "subject": "...",
 *   "html_content": "<html>...</html>",
 *   "plain_text": "...",          // stored but not currently used by Mailgun send
 *   "preview_text": "...",        // optional inbox preview line
 *   "audience": "contacts_all"    // optional, defaults to "contacts_all"
 * }
 */
export async function POST(request: NextRequest) {
  // 1. Validate API key
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.NEWSLETTER_API_KEY;

  if (!expectedKey) {
    console.error("NEWSLETTER_API_KEY env var not set");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  if (!apiKey || apiKey !== expectedKey) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // 2. Parse and validate body
  let body: {
    subject?: string;
    html_content?: string;
    plain_text?: string;
    preview_text?: string;
    audience?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { subject, html_content, preview_text, audience } = body;

  if (!subject || !html_content) {
    return NextResponse.json(
      { error: "subject and html_content are required" },
      { status: 400 }
    );
  }

  try {
    // 3. Create broadcast record
    const broadcast = await createBroadcast({
      name: `Newsletter: ${subject}`,
      subject,
      htmlContent: html_content,
      ...(preview_text ? { previewText: preview_text as string } : {}),
      targetAudience: (audience as "contacts_all") || "contacts_all",
    });

    // 4. Send it
    const result = await sendBroadcast(broadcast.id);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Failed to send broadcast",
          broadcast_id: broadcast.id,
          sent_count: result.sentCount,
          failed_count: result.failedCount,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      broadcast_id: broadcast.id,
      sent_count: result.sentCount,
      failed_count: result.failedCount,
    });
  } catch (error) {
    console.error("Newsletter broadcast error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
