import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import {
  rotateFeaturedClinics,
  getRotationHistory,
  getCurrentRotationBatch,
  linkBroadcastToBatch,
} from "@/lib/rotation/featured-rotation";

/**
 * GET /api/admin/rotation
 * Get rotation history and current batch status.
 */
export async function GET() {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const [history, currentBatch] = await Promise.all([
    getRotationHistory(),
    getCurrentRotationBatch(),
  ]);

  return NextResponse.json({
    currentBatch: {
      count: currentBatch.length,
      batchId: currentBatch[0]?.batchId ?? null,
      featuredAt: currentBatch[0]?.featuredAt ?? null,
      clinics: currentBatch,
    },
    history,
  });
}

/**
 * POST /api/admin/rotation
 * Trigger a new rotation.
 * Body: { batchSize?: number, broadcastId?: string }
 */
export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const body = await request.json().catch(() => ({}));
  const batchSize =
    typeof body.batchSize === "number" ? body.batchSize : 150;

  if (batchSize < 1 || batchSize > 500) {
    return NextResponse.json(
      { error: "Batch size must be between 1 and 500" },
      { status: 400 }
    );
  }

  const result = await rotateFeaturedClinics(batchSize);

  // Link broadcast if provided
  if (body.broadcastId && result.featuredCount > 0) {
    await linkBroadcastToBatch(result.batchId, body.broadcastId);
  }

  return NextResponse.json(result);
}
