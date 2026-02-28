import { getAdsForPlacement } from "@/lib/ad-queries";
import { NativeAdPanel } from "@/components/ads/creatives/NativeAdPanel";

interface NativeAdPanelSlotProps {
  /** Placement name matching ad_placements.name */
  placement: string;
  /** Current page path for impression tracking */
  path: string;
  /** Number of ad cards to show (default 6) */
  count?: number;
  /** Grid columns on large screens (default 3) */
  columns?: 2 | 3;
}

/**
 * Server component that renders a Taboola/Outbrain-style native ad grid.
 * Renders nothing if no eligible creatives exist for this placement.
 */
export async function NativeAdPanelSlot({
  placement,
  path,
  count = 6,
  columns = 3,
}: NativeAdPanelSlotProps) {
  const ads = await getAdsForPlacement(placement, path, count);
  if (ads.length === 0) return null;

  return <NativeAdPanel ads={ads} columns={columns} />;
}
