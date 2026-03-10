import { NextRequest, NextResponse } from "next/server";
import { validateNewsletterApiKey } from "@/lib/newsletter/auth";
import { listNewsletterBroadcasts } from "@/lib/newsletter/queries";

export async function GET(request: NextRequest) {
  const authError = validateNewsletterApiKey(request);
  if (authError) return authError;

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

  try {
    const { broadcasts, total } = await listNewsletterBroadcasts({ limit, offset });

    return NextResponse.json({
      broadcasts: broadcasts.map((b) => ({
        broadcast_id: b.broadcastId,
        subject: b.subject,
        status: b.status,
        sent_at: b.sentAt?.toISOString() ?? null,
        recipient_count: b.recipientCount ?? 0,
      })),
      total,
    });
  } catch (error) {
    console.error("Failed to list newsletter broadcasts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
