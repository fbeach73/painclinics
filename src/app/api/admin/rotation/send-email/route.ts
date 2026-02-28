import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { createBroadcast } from "@/lib/broadcast/broadcast-queries";
import { sendBroadcast } from "@/lib/broadcast/broadcast-service";
import {
  getCurrentRotationBatch,
  linkBroadcastToBatch,
} from "@/lib/rotation/featured-rotation";

/**
 * POST /api/admin/rotation/send-email
 * Create and send a broadcast to the current rotation batch.
 * Body: { subject: string, htmlContent: string, previewText?: string }
 */
export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const body = await request.json().catch(() => null);
  if (!body?.subject || !body?.htmlContent) {
    return NextResponse.json(
      { error: "subject and htmlContent are required" },
      { status: 400 }
    );
  }

  // Get current rotation batch
  const currentBatch = await getCurrentRotationBatch();
  if (currentBatch.length === 0) {
    return NextResponse.json(
      { error: "No active rotation batch to email" },
      { status: 400 }
    );
  }

  const batchId = currentBatch[0]!.batchId;

  // Create a broadcast targeting the rotation batch via manual email list
  // We'll collect the clinic IDs and use the "manual" audience with their emails
  const clinicIds = currentBatch.map((c) => c.clinicId);

  // Create the broadcast as draft first
  const broadcast = await createBroadcast({
    name: `Rotation Batch ${batchId.slice(0, 8)} — ${new Date().toLocaleDateString()}`,
    subject: body.subject,
    previewText: body.previewText || undefined,
    htmlContent: body.htmlContent,
    targetAudience: "featured_only",
    targetFilters: {
      excludeUnsubscribed: true,
      // Store batch clinic IDs for reference
      rotationBatchClinicIds: clinicIds,
    } as Record<string, unknown>,
    createdBy: adminCheck.user.id,
  });

  // Send it
  const result = await sendBroadcast(broadcast.id);

  // Link broadcast to rotation batch
  await linkBroadcastToBatch(batchId, broadcast.id);

  return NextResponse.json({
    broadcastId: broadcast.id,
    batchId,
    sentCount: result.sentCount,
    failedCount: result.failedCount,
    success: result.success,
  });
}
