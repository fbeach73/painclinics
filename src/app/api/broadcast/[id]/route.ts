import { NextRequest, NextResponse } from "next/server";
import { validateNewsletterApiKey } from "@/lib/newsletter/auth";
import {
  getNewsletterBroadcast,
  updateNewsletterBroadcastStatus,
} from "@/lib/newsletter/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateNewsletterApiKey(request);
  if (authError) return authError;

  const { id } = await params;
  const broadcast = await getNewsletterBroadcast(id);

  if (!broadcast) {
    return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
  }

  return NextResponse.json({
    broadcast_id: broadcast.broadcastId,
    status: broadcast.status,
    subject: broadcast.subject,
    sent_at: broadcast.sentAt?.toISOString() ?? null,
    stats: {
      recipients: broadcast.recipientCount ?? 0,
      delivered: broadcast.deliveredCount ?? 0,
      opened: broadcast.openedCount ?? 0,
      clicked: broadcast.clickedCount ?? 0,
      bounced: broadcast.bouncedCount ?? 0,
      unsubscribed: broadcast.unsubscribedCount ?? 0,
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateNewsletterApiKey(request);
  if (authError) return authError;

  const { id } = await params;
  const broadcast = await getNewsletterBroadcast(id);

  if (!broadcast) {
    return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
  }

  if (broadcast.status !== "queued") {
    return NextResponse.json(
      { error: "Broadcast has already been sent and cannot be cancelled" },
      { status: 409 }
    );
  }

  await updateNewsletterBroadcastStatus(id, "cancelled");

  return NextResponse.json({
    broadcast_id: broadcast.broadcastId,
    status: "cancelled",
  });
}
