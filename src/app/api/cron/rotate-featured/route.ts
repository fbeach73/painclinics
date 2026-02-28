import { NextRequest, NextResponse } from "next/server";
import { rotateFeaturedClinics } from "@/lib/rotation/featured-rotation";

/**
 * GET /api/cron/rotate-featured
 * Weekly cron job to rotate featured clinics.
 * Protected by CRON_SECRET via Authorization header (Vercel Cron).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await rotateFeaturedClinics(150);

  return NextResponse.json({
    success: true,
    batchId: result.batchId,
    unfeaturedCount: result.unfeaturedCount,
    featuredCount: result.featuredCount,
  });
}
