import { NextRequest, NextResponse } from "next/server";
import { getAdForPlacement } from "@/lib/ad-queries";
import { getAllowedTypes, getAllowedRatios } from "@/lib/ad-placement-specs";

// Never cache — each request gets a fresh weighted random ad selection
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const placement = searchParams.get("placement");
  const path = searchParams.get("path") ?? "";

  if (!placement) {
    return NextResponse.json({ error: "Missing placement" }, { status: 400 });
  }

  const allowedTypes = getAllowedTypes(placement);
  const allowedRatios = getAllowedRatios(placement);

  const ad = await getAdForPlacement(placement, path, allowedTypes, allowedRatios);

  if (!ad) {
    return NextResponse.json({ ad: null });
  }

  return NextResponse.json({ ad });
}
