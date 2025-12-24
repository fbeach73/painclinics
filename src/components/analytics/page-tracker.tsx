"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface PageTrackerProps {
  clinicId?: string;
}

/**
 * Generates a browser fingerprint for session identification.
 * Combines user agent, language, screen properties, and timezone.
 */
function generateFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
  ];
  // Base64 encode and truncate to 32 chars
  return btoa(components.join("|")).slice(0, 32);
}

/**
 * PageTracker - Client-side analytics tracking component.
 *
 * Tracks pageviews and clinic views with deduplication.
 * - Generates a browser fingerprint for session tracking
 * - Prevents duplicate tracking of the same page in the same session
 * - Uses fire-and-forget fetch with keepalive
 * - Delays tracking to not block initial paint
 */
export function PageTracker({ clinicId }: PageTrackerProps) {
  const pathname = usePathname();
  const trackedPages = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Create a unique key for this page/clinic combination
    const trackingKey = clinicId ? `${pathname}:${clinicId}` : pathname;

    // Prevent duplicate tracking in the same session
    if (trackedPages.current.has(trackingKey)) {
      return;
    }

    // Delay tracking slightly to not block initial paint
    const timeoutId = setTimeout(() => {
      try {
        const fingerprint = generateFingerprint();
        const eventType = clinicId ? "clinic_view" : "pageview";

        // Fire and forget - we don't need to wait for the response
        fetch("/api/analytics/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventType,
            path: pathname,
            clinicId,
            referrer: document.referrer || undefined,
            fingerprint,
          }),
          keepalive: true, // Ensures request completes even if page navigates away
        }).catch(() => {
          // Silently ignore tracking errors - don't impact user experience
        });

        // Mark as tracked
        trackedPages.current.add(trackingKey);
      } catch {
        // Silently ignore any errors in fingerprint generation
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname, clinicId]);

  // This component renders nothing
  return null;
}
