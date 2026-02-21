import { NextRequest, NextResponse } from "next/server";
import { getAdForPlacement, type CreativeType, type AspectRatio } from "@/lib/ad-queries";

// Never cache — each request gets a fresh weighted random ad selection
export const dynamic = "force-dynamic";

/** Placement → allowed creative types (mirrors AdSlot.tsx config) */
const PLACEMENT_ALLOWED_TYPES: Record<string, CreativeType[]> = {
  "clinic-above-image": ["html", "text"],
  "clinic-above-fold": ["image_banner", "native"],
  "clinic-mid-content": ["image_banner", "native"],
};

/** Placement → allowed aspect ratios (mirrors AdSlot.tsx config) */
const PLACEMENT_ALLOWED_RATIOS: Record<string, AspectRatio[]> = {
  "clinic-above-fold": ["1:1"],
  "clinic-mid-content": ["16:9", "4:3", "3:2"],
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const placement = searchParams.get("placement");
  const path = searchParams.get("path") ?? "";

  if (!placement) {
    return NextResponse.json({ error: "Missing placement" }, { status: 400 });
  }

  const allowedTypes = PLACEMENT_ALLOWED_TYPES[placement];
  const allowedRatios = PLACEMENT_ALLOWED_RATIOS[placement];

  const ad = await getAdForPlacement(placement, path, allowedTypes, allowedRatios);

  if (!ad) {
    return NextResponse.json({ ad: null });
  }

  return NextResponse.json({ ad });
}
