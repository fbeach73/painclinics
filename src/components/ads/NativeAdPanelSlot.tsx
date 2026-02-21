import { getAdsForPlacement } from "@/lib/ad-queries";
import { NativeAdPanel } from "@/components/ads/creatives/NativeAdPanel";

interface NativeAdPanelSlotProps {
  /** Placement name matching ad_placements.name */
  placement: string;
  /** Current page path for impression tracking */
  path: string;
  /** Whether to attempt serving hosted ads (from shouldUseHostedAds()) */
  useHostedAds: boolean;
  /** Number of ad cards to show (default 6) */
  count?: number;
  /** Grid columns on large screens (default 3) */
  columns?: 2 | 3;
}

/**
 * Server component that renders a Taboola/Outbrain-style native ad grid.
 * Renders nothing if hosted ads are off or no eligible creatives exist.
 */
export async function NativeAdPanelSlot({
  placement,
  path,
  useHostedAds,
  count = 6,
  columns = 3,
}: NativeAdPanelSlotProps) {
  if (!useHostedAds) return null;

  const ads = await getAdsForPlacement(placement, path, count);
  if (ads.length === 0) return null;

  return <NativeAdPanel ads={ads} columns={columns} />;
}
