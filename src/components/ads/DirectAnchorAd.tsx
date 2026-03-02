"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp, X } from "lucide-react";

const DISMISS_KEY = "anchor-ad-dismissed";

/** Routes where the anchor ad should not appear */
const AD_FREE_PATHS = new Set([
  "/pain-management/amir-abdel-kader-md-de-19804", // Paying featured subscriber
]);

function isExcludedRoute(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/my-clinics") || AD_FREE_PATHS.has(pathname);
}

function subscribeToDismiss(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getDismissSnapshot() {
  return sessionStorage.getItem(DISMISS_KEY) === "1";
}

function getDismissServerSnapshot() {
  return true; // default hidden on server
}

/**
 * Detect if AdSense auto anchor ad is showing (top of page).
 * AdSense injects an ins.adsbygoogle with data-anchor-status or a
 * div with id containing "google_ads_iframe" at position:fixed top:0.
 * We check for any fixed-position AdSense overlay at the top.
 */
function useAutoAnchorDetected() {
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    // Check after AdSense has had time to inject auto ads
    const timer = setTimeout(() => {
      // AdSense auto anchor ads create elements with these patterns
      const autoAnchors = document.querySelectorAll(
        'ins.adsbygoogle[data-ad-status][data-anchor-status], div[id*="google_ads_iframe"][style*="position: fixed"]'
      );
      if (autoAnchors.length > 0) {
        setDetected(true);
        return;
      }
      // Also check for any fixed-position AdSense container at top of viewport
      const allFixed = document.querySelectorAll('div[style*="position: fixed"][style*="top: 0"]');
      for (const el of allFixed) {
        if (el.querySelector('ins.adsbygoogle') || el.id.includes("google_ads")) {
          setDetected(true);
          return;
        }
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return detected;
}

export function DirectAnchorAd() {
  const pathname = usePathname();
  const [minimized, setMinimized] = useState(false);
  const [localDismissed, setLocalDismissed] = useState(false);
  const storageDismissed = useSyncExternalStore(subscribeToDismiss, getDismissSnapshot, getDismissServerSnapshot);
  const dismissed = storageDismissed || localDismissed;
  const autoAnchorShowing = useAutoAnchorDetected();

  // Hide on mobile when AdSense auto anchor ad is showing at the top
  const mq = typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)") : null;
  const isMobile = useSyncExternalStore(
    (cb) => { mq?.addEventListener("change", cb); return () => mq?.removeEventListener("change", cb); },
    () => mq?.matches ?? false,
    () => false,
  );

  if (isExcludedRoute(pathname) || dismissed) return null;
  // Don't double-stack anchor ads on mobile
  if (isMobile && autoAnchorShowing) return null;

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setLocalDismissed(true);
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.08)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.3)] transition-all duration-300 ease-in-out"
      style={{ maxHeight: minimized ? "40px" : "150px" }}
    >
      {/* Control bar */}
      <div className="flex items-center justify-between px-3 h-10 shrink-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Sponsored
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

      {/* Ad content — responsive format per AdSense optimization recommendation */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: minimized ? "0px" : "110px",
          opacity: minimized ? 0 : 1,
        }}
      >
        <div className="px-3 pb-3 flex justify-center">
          <ResponsiveAnchorAd />
        </div>
      </div>
    </div>
  );
}

/** Responsive AdSense unit for anchor-bottom (slot 5827778104) */
function ResponsiveAnchorAd() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <div className="w-full max-w-[720px]">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-5028121986513144"
        data-ad-slot="5827778104"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
