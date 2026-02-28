"use client";

import { useEffect, useState } from "react";
import { AdPlacement, InPageAd } from "@/components/ads/adsense";
import { getAdsenseSlotId, getAdsenseFormat } from "@/lib/ad-placement-specs";
import { BannerAd } from "@/components/ads/creatives/BannerAd";
import { HtmlAd } from "@/components/ads/creatives/HtmlAd";
import { TextAd } from "@/components/ads/creatives/TextAd";
import { NativeAd } from "@/components/ads/creatives/NativeAd";
import type { AdForPlacement } from "@/lib/ad-queries";

interface AdSlotClientProps {
  placement: string;
  path: string;
  className?: string;
  showLabel?: boolean;
}

/** Placements that only render hosted ads — no AdSense fallback */
const HOSTED_ONLY_PLACEMENTS = new Set(["clinic-above-image"]);

type AdState =
  | { status: "loading" }
  | { status: "adsense" }
  | { status: "hosted"; ad: AdForPlacement }
  | { status: "hidden" };

/**
 * Client-side ad slot. Tries /api/ads/serve for a hosted campaign first;
 * if none exists, falls back to AdSense (unless hosted-only placement).
 */
export function AdSlotClient({
  placement,
  path,
  className,
  showLabel = true,
}: AdSlotClientProps) {
  const [state, setState] = useState<AdState>({ status: "loading" });
  const cls = className ?? "";
  const hostedOnly = HOSTED_ONLY_PLACEMENTS.has(placement);

  useEffect(() => {
    let cancelled = false;

    async function decide() {
      try {
        const params = new URLSearchParams({ placement, path });
        const adRes = await fetch(`/api/ads/serve?${params}`, { cache: "no-store" });
        if (!adRes.ok) throw new Error("serve fetch failed");
        const { ad } = (await adRes.json()) as { ad: AdForPlacement | null };

        if (cancelled) return;

        if (ad) {
          setState({ status: "hosted", ad });
        } else {
          setState(hostedOnly ? { status: "hidden" } : { status: "adsense" });
        }
      } catch {
        if (!cancelled) {
          setState(hostedOnly ? { status: "hidden" } : { status: "adsense" });
        }
      }
    }

    void decide();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement, path]);

  if (state.status === "loading") {
    // Render an invisible placeholder to reserve space and avoid CLS
    return (
      <div
        className={`my-4 contain-layout ${cls}`}
        style={{ minHeight: "90px" }}
        aria-hidden="true"
      />
    );
  }

  if (state.status === "hidden") return null;

  if (state.status === "adsense") {
    return (
      <AdPlacement className={cls} showLabel={showLabel}>
        <InPageAd slot={getAdsenseSlotId(placement)} format={getAdsenseFormat(placement)} />
      </AdPlacement>
    );
  }

  const { creative, clickUrl } = state.ad;

  return (
    <AdPlacement className={cls} showLabel={showLabel}>
      {creative.creativeType === "image_banner" && (
        <BannerAd creative={creative} clickUrl={clickUrl} />
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
