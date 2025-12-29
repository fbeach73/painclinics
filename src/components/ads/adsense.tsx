"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

// Ad slot IDs from AdSense dashboard
// Data analysis (Nov 28 - Dec 27, 2025) showed:
// - Mobile = 74% of revenue with 5.7x higher RPM than desktop
// - Dynamic/responsive sizing earned $481 vs poor fixed-size performance
// - In-page ads had only 39% viewability - need better positioning
export const AD_SLOTS = {
  inPage: "9665261047", // painclinics-in-page (Display, responsive)
} as const;

/**
 * In-Page Display Ad - Responsive format
 *
 * Performance data:
 * - $221 earnings but only 39% viewability (needs better positioning)
 * - Using responsive format because dynamic sizing earned $481
 * - Mobile-first: 74% of revenue comes from mobile
 */
export function InPageAd({ className = "" }: { className?: string }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <div className={`w-full ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-5028121986513144"
        data-ad-slot={AD_SLOTS.inPage}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

/**
 * Ad Placement Wrapper
 * - Shows "Advertisement" label on desktop only (cleaner mobile experience)
 * - Mobile is 74% of revenue, keep it clean
 */
interface AdPlacementProps {
  children: React.ReactNode;
  className?: string;
  showLabel?: boolean;
}

export function AdPlacement({
  children,
  className = "",
  showLabel = true,
}: AdPlacementProps) {
  return (
    <div className={`my-4 ${className}`}>
      {showLabel && (
        <p className="hidden sm:block text-xs text-muted-foreground text-center mb-1">
          Advertisement
        </p>
      )}
      {children}
    </div>
  );
}

// =============================================================================
// Legacy components (kept for backwards compatibility)
// =============================================================================

interface AdUnitProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Generic AdSense Ad Unit Component (Legacy)
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
 * In-Article Ad (Legacy) - Best for within blog content
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
 * Multiplex Ad (Legacy) - Grid of recommended content ads
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
