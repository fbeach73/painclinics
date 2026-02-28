import { getAdForPlacement } from "@/lib/ad-queries";
import { getAllowedTypes, getAllowedRatios, isHostedOnly, getAdsenseSlotId, getAdsenseFormat } from "@/lib/ad-placement-specs";
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
  /** Optional className passed to AdPlacement wrapper */
  className?: string;
  /** Whether to show the "Advertisement" label (default true) */
  showLabel?: boolean;
}

export async function AdSlot({
  placement,
  path,
  className,
  showLabel = true,
}: AdSlotProps) {
  const cls = className ?? "";
  const hostedOnly = isHostedOnly(placement);

  // Always try to find a hosted ad for this placement
  const allowedTypes = getAllowedTypes(placement);
  const allowedRatios = getAllowedRatios(placement);
  const ad = await getAdForPlacement(placement, path, allowedTypes, allowedRatios);

  // No eligible creative — fall back to AdSense (unless hosted-only)
  if (!ad) {
    if (hostedOnly) return null;
    return (
      <AdPlacement className={cls} showLabel={showLabel}>
        <InPageAd slot={getAdsenseSlotId(placement)} format={getAdsenseFormat(placement)} />
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
