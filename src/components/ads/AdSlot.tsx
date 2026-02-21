import { getAdForPlacement, type CreativeType, type AspectRatio } from "@/lib/ad-queries";
import { AdPlacement, InPageAd } from "@/components/ads/adsense";
import { BannerAd } from "@/components/ads/creatives/BannerAd";
import { HtmlAd } from "@/components/ads/creatives/HtmlAd";
import { TextAd } from "@/components/ads/creatives/TextAd";
import { NativeAd } from "@/components/ads/creatives/NativeAd";

interface AdSlotProps {
  /** Placement name matching ad_placements.name (e.g. "clinic_sidebar") */
  placement: string;
  /** Current page path for impression tracking */
  path: string;
  /** Whether to attempt serving hosted ads (from shouldUseHostedAds()) */
  useHostedAds: boolean;
  /** Optional className passed to AdPlacement wrapper */
  className?: string;
  /** Whether to show the "Advertisement" label (default true) */
  showLabel?: boolean;
}

/** Placements that only render hosted ads — no AdSense fallback */
const HOSTED_ONLY_PLACEMENTS = new Set(["clinic-above-image"]);

/** Creative type restrictions per placement.
 *  If a placement is not listed, all types are allowed. */
const PLACEMENT_ALLOWED_TYPES: Record<string, CreativeType[]> = {
  "clinic-above-image": ["html", "text"],
  "clinic-above-fold": ["image_banner", "native"],
  "clinic-mid-content": ["image_banner", "native"],
};

/** Aspect ratio restrictions per placement.
 *  If a placement is not listed, all ratios are allowed.
 *  "auto" creatives always pass through (handled in query layer). */
const PLACEMENT_ALLOWED_RATIOS: Record<string, AspectRatio[]> = {
  "clinic-above-fold": ["1:1"],      // sidebar — square images only
  "clinic-mid-content": ["16:9", "4:3", "3:2"], // wide content area — landscape images only
};

export async function AdSlot({
  placement,
  path,
  useHostedAds,
  className,
  showLabel = true,
}: AdSlotProps) {
  const cls = className ?? "";
  const hostedOnly = HOSTED_ONLY_PLACEMENTS.has(placement);

  // AdSense mode — skip entirely for hosted-only placements
  if (!useHostedAds) {
    if (hostedOnly) return null;
    return (
      <AdPlacement className={cls} showLabel={showLabel}>
        <InPageAd />
      </AdPlacement>
    );
  }

  // Hosted ads mode — try to find an eligible creative
  const allowedTypes = PLACEMENT_ALLOWED_TYPES[placement];
  const allowedRatios = PLACEMENT_ALLOWED_RATIOS[placement];
  const ad = await getAdForPlacement(placement, path, allowedTypes, allowedRatios);

  // No eligible creative — fall back to AdSense (unless hosted-only)
  if (!ad) {
    if (hostedOnly) return null;
    return (
      <AdPlacement className={cls} showLabel={showLabel}>
        <InPageAd />
      </AdPlacement>
    );
  }

  // Render creative by type
  const { creative, clickUrl } = ad;

  return (
    <AdPlacement className={cls} showLabel={showLabel}>
      {creative.creativeType === "image_banner" && (
        <BannerAd creative={creative} clickUrl={clickUrl} placement={placement} />
      )}
      {creative.creativeType === "html" && (
        <HtmlAd creative={creative} clickUrl={clickUrl} />
      )}
      {creative.creativeType === "text" && (
        <TextAd creative={creative} clickUrl={clickUrl} />
      )}
      {creative.creativeType === "native" && (
        <NativeAd creative={creative} clickUrl={clickUrl} />
      )}
    </AdPlacement>
  );
}
