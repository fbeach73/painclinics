"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { getAdsenseSlotId } from "@/lib/ad-placement-specs";
import { BannerAd } from "@/components/ads/creatives/BannerAd";
import { HtmlAd } from "@/components/ads/creatives/HtmlAd";
import { TextAd } from "@/components/ads/creatives/TextAd";
import { NativeAd } from "@/components/ads/creatives/NativeAd";
import type { AdForPlacement } from "@/lib/ad-queries";

const PLACEMENT = "anchor-bottom";
const DISMISS_KEY = "anchor-ad-dismissed";

/** Routes where the anchor ad should not appear */
function isExcludedRoute(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/my-clinics");
}

type AdState =
  | { status: "loading" }
  | { status: "adsense" }
  | { status: "hosted"; ad: AdForPlacement }
  | { status: "hidden" };

export function StickyAnchorAd() {
  const pathname = usePathname();
  const [state, setState] = useState<AdState>({ status: "loading" });
  const [minimized, setMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(true); // default hidden until check

  // Check session dismissal
  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  // Fetch ad decision
  useEffect(() => {
    if (isExcludedRoute(pathname)) {
      setState({ status: "hidden" });
      return;
    }

    let cancelled = false;

    async function decide() {
      try {
        const decisionRes = await fetch("/api/ads/decision", { cache: "no-store" });
        if (!decisionRes.ok) throw new Error("decision fetch failed");
        const { useHostedAds } = (await decisionRes.json()) as { useHostedAds: boolean };

        if (cancelled) return;

        if (!useHostedAds) {
          setState({ status: "adsense" });
          return;
        }

        const params = new URLSearchParams({ placement: PLACEMENT, path: pathname });
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
  }, [pathname]);

  // Don't render anything on excluded routes, while loading, or if dismissed
  if (isExcludedRoute(pathname)) return null;
  if (state.status === "loading" || state.status === "hidden") return null;
  if (dismissed) return null;

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  const isHosted = state.status === "hosted";
  const headline = isHosted ? state.ad.creative.headline : null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.08)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.3)] transition-all duration-300 ease-in-out"
      style={{ maxHeight: minimized ? "40px" : "150px" }}
    >
      {/* Control bar */}
      <div className="flex items-center justify-between px-3 h-10 shrink-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {minimized && headline ? headline : "Sponsored"}
        </p>
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
          maxHeight: minimized ? "0px" : "110px",
          opacity: minimized ? 0 : 1,
        }}
      >
        <div className="px-3 pb-3 flex justify-center">
          {state.status === "adsense" && <AnchorAdsenseUnit slot={getAdsenseSlotId(PLACEMENT)} />}
          {isHosted && (
            <>
              {state.ad.creative.creativeType === "image_banner" && (
                <BannerAd creative={state.ad.creative} clickUrl={state.ad.clickUrl} placement={PLACEMENT} />
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Fixed 720×90 leaderboard AdSense unit for the anchor bar */
function AnchorAdsenseUnit({ slot }: { slot: string }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <div className="w-full max-w-[720px] h-[90px] overflow-hidden">
      <ins
        className="adsbygoogle"
        style={{ display: "inline-block", width: 720, height: 90 }}
        data-ad-client="ca-pub-5028121986513144"
        data-ad-slot={slot}
      />
    </div>
  );
}
