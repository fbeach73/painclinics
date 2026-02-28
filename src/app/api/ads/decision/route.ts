import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Deprecated: always returns useHostedAds=true.
 * Per-placement ad decision is now handled by each slot fetching /api/ads/serve
 * directly; if no hosted campaign exists the slot falls back to AdSense.
 */
export async function GET() {
  return NextResponse.json({ useHostedAds: true });
}
