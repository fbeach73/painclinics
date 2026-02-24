import { NextRequest, NextResponse } from "next/server";
import { getAdForPlacement, getAdsForPlacement } from "@/lib/ad-queries";
import { getAllowedTypes, getAllowedRatios } from "@/lib/ad-placement-specs";

// Never cache — each request gets a fresh weighted random ad selection
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const placement = searchParams.get("placement");
  const path = searchParams.get("path") ?? "";
  const countParam = searchParams.get("count");

  if (!placement) {
    return NextResponse.json({ error: "Missing placement" }, { status: 400 });
  }

  const allowedTypes = getAllowedTypes(placement);
  const allowedRatios = getAllowedRatios(placement);

  // Multi-ad mode: count > 1
  const count = countParam ? Math.min(Math.max(1, parseInt(countParam, 10) || 1), 6) : 1;

  if (count > 1) {
    const ads = await getAdsForPlacement(placement, path, count, allowedTypes, allowedRatios);
    return NextResponse.json({ ads });
  }

  // Single-ad mode (backward compatible)
  const ad = await getAdForPlacement(placement, path, allowedTypes, allowedRatios);

  if (!ad) {
    return NextResponse.json({ ad: null });
  }

  return NextResponse.json({ ad });
}
