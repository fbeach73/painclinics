"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { getAdsenseSlotId, getAdsenseFormat } from "@/lib/ad-placement-specs";
import { InPageAd } from "@/components/ads/adsense";
import { BannerAd } from "@/components/ads/creatives/BannerAd";
import { HtmlAd } from "@/components/ads/creatives/HtmlAd";
import { TextAd } from "@/components/ads/creatives/TextAd";
import { NativeAd } from "@/components/ads/creatives/NativeAd";
import type { AdForPlacement } from "@/lib/ad-queries";

const DISMISS_KEY = "top-leaderboard-dismissed";

type AdState =
  | { status: "loading" }
  | { status: "adsense" }
  | { status: "hosted"; ad: AdForPlacement }
  | { status: "hidden" };

interface TopLeaderboardAdProps {
  placement: string;
  path: string;
}

export function TopLeaderboardAd({
  placement,
  path,
}: TopLeaderboardAdProps) {
  const [state, setState] = useState<AdState>({ status: "loading" });
  const [minimized, setMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(true); // hidden until check

  // Check session dismissal
  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  // Fetch hosted ad — fall back to AdSense if none
  useEffect(() => {
    let cancelled = false;

    async function decide() {
      try {
        const params = new URLSearchParams({ placement, path });
        const adRes = await fetch(`/api/ads/serve?${params}`, { cache: "no-store" });
        if (!adRes.ok) throw new Error("serve fetch failed");
        const { ad } = (await adRes.json()) as { ad: AdForPlacement | null };

        if (cancelled) return;
        setState(ad ? { status: "hosted", ad } : { status: "adsense" });
      } catch {
        if (!cancelled) setState({ status: "adsense" });
      }
    }

    void decide();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placement, path]);

  // Don't render anything while loading, hidden, or dismissed
  if (state.status === "loading" || state.status === "hidden" || dismissed) return null;

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  const isHosted = state.status === "hosted";

  // For AdSense: render without the SPONSORED card wrapper — AdSense provides its own label
  if (state.status === "adsense") {
    return (
      <InPageAd slot={getAdsenseSlotId(placement)} format={getAdsenseFormat(placement)} />
    );
  }

  // Hosted ad: render in the styled card container
  const headline = isHosted ? state.ad.creative.headline : null;

  return (
    <div className="relative rounded-xl border border-border bg-card shadow-sm px-4 py-3">
      {/* SPONSORED label + controls */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {minimized && headline ? headline : "Sponsored"}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized((v) => !v)}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label={minimized ? "Expand ad" : "Minimize ad"}
          >
            {minimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close ad"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Ad content */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: minimized ? "0px" : "300px",
          opacity: minimized ? 0 : 1,
        }}
      >
        {state.ad.creative.creativeType === "image_banner" && (
          <BannerAd creative={state.ad.creative} clickUrl={state.ad.clickUrl} placement={placement} />
        )}
        {state.ad.creative.creativeType === "html" && (
          <HtmlAd creative={state.ad.creative} clickUrl={state.ad.clickUrl} />
        )}
        {state.ad.creative.creativeType === "text" && (
          <TextAd creative={state.ad.creative} clickUrl={state.ad.clickUrl} />
        )}
        {state.ad.creative.creativeType === "native" && (
          <NativeAd creative={state.ad.creative} clickUrl={state.ad.clickUrl} />
        )}
      </div>
    </div>
  );
}
