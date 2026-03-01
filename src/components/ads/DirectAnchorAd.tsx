"use client";

import { useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { InPageAd } from "@/components/ads/adsense";

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

export function DirectAnchorAd() {
  const pathname = usePathname();
  const [minimized, setMinimized] = useState(false);
  const [localDismissed, setLocalDismissed] = useState(false);
  const storageDismissed = useSyncExternalStore(subscribeToDismiss, getDismissSnapshot, getDismissServerSnapshot);
  const dismissed = storageDismissed || localDismissed;

  if (isExcludedRoute(pathname) || dismissed) return null;

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

      {/* Ad content */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: minimized ? "0px" : "110px",
          opacity: minimized ? 0 : 1,
        }}
      >
        <div className="px-3 pb-3 flex justify-center">
          <InPageAd slot="5827778104" className="max-w-[720px] !min-h-[90px]" />
        </div>
      </div>
    </div>
  );
}
