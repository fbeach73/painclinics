import { NextRequest, NextResponse } from "next/server";
import { createBroadcast } from "@/lib/broadcast/broadcast-queries";
import { sendBroadcast } from "@/lib/broadcast/broadcast-service";
import {
  getCurrentRotationBatch,
  getRotationConfig,
  getRotationHistory,
  linkBroadcastToBatch,
} from "@/lib/rotation/featured-rotation";

/**
 * GET /api/cron/rotation-email
 * Monday AM cron: sends "your listing is expiring" email to current featured batch.
 * Only sends if:
 *   - batch has been featured for at least 5 days (skips freshly rotated batches)
 *   - batch hasn't already been emailed (no broadcastId linked)
 *   - rotation config (email template) exists
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get current batch
  const currentBatch = await getCurrentRotationBatch();
  if (currentBatch.length === 0) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: "No active rotation batch",
    });
  }

  const batchId = currentBatch[0]!.batchId;
  const featuredAt = new Date(currentBatch[0]!.featuredAt);

  // Skip if batch is less than 5 days old (handles first-week skip)
  const ageMs = Date.now() - featuredAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays < 5) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: `Batch is only ${ageDays.toFixed(1)} days old, need 5+`,
    });
  }

  // Check if already emailed
  const history = await getRotationHistory(50);
  const batchHistory = history.find((h) => h.batchId === batchId);
  if (batchHistory?.broadcastId) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: "Batch already emailed",
    });
  }

  // Get email template from config
  const config = await getRotationConfig();
  if (!config) {
    return NextResponse.json({
      success: false,
      skipped: true,
      reason: "No rotation email template configured — set one in /admin/rotation",
    });
  }

  // Create and send broadcast
  const broadcastInput: Parameters<typeof createBroadcast>[0] = {
    name: `Rotation Email — ${new Date().toLocaleDateString()}`,
    subject: config.emailSubject,
    htmlContent: config.emailHtmlContent,
    targetAudience: "featured_only",
    targetFilters: { excludeUnsubscribed: true },
  };
  if (config.emailPreviewText) {
    broadcastInput.previewText = config.emailPreviewText;
  }
  const broadcast = await createBroadcast(broadcastInput);

  const result = await sendBroadcast(broadcast.id);
  await linkBroadcastToBatch(batchId, broadcast.id);

  return NextResponse.json({
    success: result.success,
    broadcastId: broadcast.id,
    sentCount: result.sentCount,
    failedCount: result.failedCount,
  });
}
