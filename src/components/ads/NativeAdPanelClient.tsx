"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NativeAdPanel } from "@/components/ads/creatives/NativeAdPanel";
import type { AdForPlacement } from "@/lib/ad-queries";

const PLACEMENT = "native-panel-bottom";
const COUNT = 3;

function isExcludedRoute(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/my-clinics");
}

export function NativeAdPanelClient() {
  const pathname = usePathname();
  const [ads, setAds] = useState<AdForPlacement[]>([]);

  useEffect(() => {
    if (isExcludedRoute(pathname)) return;

    let cancelled = false;

    async function load() {
      try {
        const decisionRes = await fetch("/api/ads/decision", { cache: "no-store" });
        if (!decisionRes.ok) return;
        const { useHostedAds } = (await decisionRes.json()) as { useHostedAds: boolean };

        if (cancelled || !useHostedAds) return;

        const params = new URLSearchParams({
          placement: PLACEMENT,
          path: pathname,
          count: String(COUNT),
        });
        const adRes = await fetch(`/api/ads/serve?${params}`, { cache: "no-store" });
        if (!adRes.ok) return;
        const { ads: fetched } = (await adRes.json()) as { ads: AdForPlacement[] };

        if (!cancelled && fetched?.length) {
          setAds(fetched);
        }
      } catch {
        // silently fail — panel just won't render
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [pathname]);

  if (isExcludedRoute(pathname) || ads.length === 0) return null;

  return <NativeAdPanel ads={ads} columns={3} />;
}
