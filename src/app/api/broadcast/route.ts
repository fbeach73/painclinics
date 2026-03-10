import { NextRequest, NextResponse } from "next/server";
import { validateNewsletterApiKey } from "@/lib/newsletter/auth";
import { createNewsletterBroadcast } from "@/lib/newsletter/queries";
import { getSubscriberCount } from "@/lib/newsletter/send";
import { sendNewsletterBroadcast } from "@/lib/newsletter/send";

export async function POST(request: NextRequest) {
  const authError = validateNewsletterApiKey(request);
  if (authError) return authError;

  let body: {
    subject?: string;
    html_content?: string;
    plain_text?: string;
    preview_text?: string;
    list_id?: string;
    tags?: string[];
    send_at?: string | null;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  if (!body.subject || typeof body.subject !== "string") {
    return NextResponse.json({ error: "Missing required field: subject" }, { status: 400 });
  }
  if (!body.html_content || typeof body.html_content !== "string") {
    return NextResponse.json({ error: "Missing required field: html_content" }, { status: 400 });
  }
  if (!body.plain_text || typeof body.plain_text !== "string") {
    return NextResponse.json({ error: "Missing required field: plain_text" }, { status: 400 });
  }

  const listId = body.list_id || "newsletter";
  const scheduledAt = body.send_at ? new Date(body.send_at) : null;

  // Validate send_at is a valid date if provided
  if (body.send_at && isNaN(scheduledAt!.getTime())) {
    return NextResponse.json({ error: "Invalid send_at date format. Use ISO 8601." }, { status: 400 });
  }

  // Get recipient count for the target list
  const recipientCount = await getSubscriberCount(listId);

  try {
    const broadcast = await createNewsletterBroadcast({
      subject: body.subject,
      htmlContent: body.html_content,
      plainText: body.plain_text,
      previewText: body.preview_text,
      listId,
      tags: body.tags,
      scheduledAt,
      recipientCount,
      status: scheduledAt ? "queued" : "sending",
    });

    // If no scheduled time, start sending immediately (fire and forget)
    if (!scheduledAt) {
      sendNewsletterBroadcast(broadcast.broadcastId).catch((err) => {
        console.error(`Newsletter broadcast ${broadcast.broadcastId} failed:`, err);
      });
    }

    return NextResponse.json({
      broadcast_id: broadcast.broadcastId,
      status: scheduledAt ? "queued" : "sending",
      recipient_count: recipientCount,
      scheduled_at: scheduledAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Failed to create newsletter broadcast:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
