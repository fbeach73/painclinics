"use client";

import { useEffect } from "react";

export function NotFoundLogger() {
  useEffect(() => {
    const logNotFound = async () => {
      try {
        await fetch("/api/404-log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: window.location.pathname,
            fullUrl: window.location.href,
            referrer: document.referrer || undefined,
          }),
        });
      } catch (error) {
        // Silently fail - we don't want to break the 404 page
        console.error("Failed to log 404:", error);
      }
    };

    logNotFound();
  }, []);

  return null;
}
