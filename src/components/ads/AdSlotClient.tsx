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
  /** Pre-resolved ad decision from server. Skips /api/ads/decision fetch when provided. */
  useHostedAds?: boolean;
}

/** Placements that only render hosted ads — no AdSense fallback */
const HOSTED_ONLY_PLACEMENTS = new Set(["clinic-above-image"]);

type AdState =
  | { status: "loading" }
  | { status: "adsense" }
  | { status: "hosted"; ad: AdForPlacement }
  | { status: "hidden" };

/**
 * Client-side ad slot that makes its own ad-type decision on every page load.
 * This bypasses ISR caching so the traffic split is applied per-visitor, not
 * per ISR regeneration cycle.
 */
export function AdSlotClient({
  placement,
  path,
  className,
  showLabel = true,
  useHostedAds: preResolvedDecision,
}: AdSlotClientProps) {
  const [state, setState] = useState<AdState>({ status: "loading" });
  const cls = className ?? "";
  const hostedOnly = HOSTED_ONLY_PLACEMENTS.has(placement);

  useEffect(() => {
    let cancelled = false;

    async function decide() {
      try {
        // Use pre-resolved decision if available (batched server-side),
        // otherwise fall back to per-slot /api/ads/decision fetch
        let shouldUseHosted: boolean;
        if (preResolvedDecision !== undefined) {
          shouldUseHosted = preResolvedDecision;
        } else {
          const decisionRes = await fetch("/api/ads/decision", { cache: "no-store" });
          if (!decisionRes.ok) throw new Error("decision fetch failed");
          const data = (await decisionRes.json()) as { useHostedAds: boolean };
          shouldUseHosted = data.useHostedAds;
        }

        if (cancelled) return;

        if (!shouldUseHosted) {
          setState(hostedOnly ? { status: "hidden" } : { status: "adsense" });
          return;
        }

        // Fetch a hosted ad for this placement
        const params = new URLSearchParams({ placement, path });
        const adRes = await fetch(`/api/ads/serve?${params}`, { cache: "no-store" });
        if (!adRes.ok) throw new Error("serve fetch failed");
        const { ad } = (await adRes.json()) as { ad: AdForPlacement | null };

        if (cancelled) return;

        if (!ad) {
          setState(hostedOnly ? { status: "hidden" } : { status: "adsense" });
        } else {
          setState({ status: "hosted", ad });
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
  }, [placement, path, preResolvedDecision]);

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
