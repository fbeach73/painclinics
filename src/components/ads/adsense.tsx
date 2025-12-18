"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdUnitProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AdSense Ad Unit Component
 *
 * Usage:
 * <AdUnit slot="1234567890" format="auto" responsive />
 *
 * For manual placements, create ad units in AdSense dashboard and use the slot ID.
 * Common formats:
 * - "auto": Google chooses best format (recommended)
 * - "fluid": Native/in-feed ads
 * - "rectangle": Display ads (300x250, 336x280)
 * - "vertical": Skyscraper ads (120x600, 160x600)
 * - "horizontal": Banner ads (728x90, 970x90)
 */
export function AdUnit({
  slot,
  format = "auto",
  responsive = true,
  className = "",
  style,
}: AdUnitProps) {
  useEffect(() => {
    try {
      // Push ad to queue after component mounts
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <div className={`adsense-container ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          ...(responsive ? {} : style),
        }}
        data-ad-client="ca-pub-5028121986513144"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}

/**
 * In-Article Ad - Best for within blog content
 */
export function InArticleAd({ className = "" }: { className?: string }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <div className={`my-6 ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center" }}
        data-ad-client="ca-pub-5028121986513144"
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-slot="" // Create in-article ad unit in AdSense and add slot ID
      />
    </div>
  );
}

/**
 * Multiplex Ad - Grid of recommended content ads
 * Good for end of articles or sidebar
 */
export function MultiplexAd({ className = "" }: { className?: string }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <div className={`my-6 ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-5028121986513144"
        data-ad-format="autorelaxed"
        data-ad-slot="" // Create multiplex ad unit in AdSense and add slot ID
      />
    </div>
  );
}
