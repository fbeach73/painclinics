import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdForPlacement, getAdsForPlacement } from "@/lib/ad-queries";
import { getAllowedTypes, getAllowedRatios } from "@/lib/ad-placement-specs";

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
  const count = countParam ? Math.min(Math.max(1, parseInt(countParam, 10) || 1), 6) : 1;

  // Cache ad selections for 5 minutes per placement+path to reduce DB wakeups
  // Tradeoff: same ad shown for 5min per combo
  const cacheKey = `ad:${placement}:${path}:${count}`;

  const result = await unstable_cache(
    async () => {
      if (count > 1) {
        const ads = await getAdsForPlacement(placement, path, count, allowedTypes, allowedRatios);
        return { ads };
      }
      const ad = await getAdForPlacement(placement, path, allowedTypes, allowedRatios);
      return { ad: ad ?? null };
    },
    [cacheKey],
    { revalidate: 300, tags: ["ads"] }
  )();

  return NextResponse.json(result);
}
