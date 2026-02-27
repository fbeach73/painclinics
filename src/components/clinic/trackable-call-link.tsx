"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

type TrackEventType = "phone_click" | "directions_click" | "website_click";

interface TrackableLinkProps {
  href: string;
  clinicId: string;
  clinicName: string;
  eventType: TrackEventType;
  /** Extra fields pushed to dataLayer alongside event/clinic_id/clinic_name */
  dataLayerExtras?: Record<string, string>;
  target?: string | undefined;
  rel?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
}

interface TrackableCallLinkProps {
  clinicId: string;
  clinicName: string;
  phone: string;
  className?: string | undefined;
  children: ReactNode;
}

/**
 * Generates a browser fingerprint for session identification.
 * Duplicated from page-tracker to avoid coupling.
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
  return btoa(components.join("|")).slice(0, 32);
}

/**
 * Generic trackable link — pushes to dataLayer for GTM/GA4 and fires
 * a POST to our analytics API. Does NOT prevent default.
 */
export function TrackableLink({
  href,
  clinicId,
  clinicName,
  eventType,
  dataLayerExtras,
  target,
  rel,
  className,
  children,
}: TrackableLinkProps) {
  const pathname = usePathname();

  function handleClick() {
    try {
      const w = window as typeof window & { dataLayer?: Record<string, unknown>[] };
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({
        event: eventType,
        clinic_id: clinicId,
        clinic_name: clinicName,
        ...dataLayerExtras,
      });

      const fingerprint = generateFingerprint();
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          path: pathname,
          clinicId,
          referrer: document.referrer || undefined,
          fingerprint,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Silently ignore
    }
  }

  return (
    <a href={href} target={target} rel={rel} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}

/**
 * Convenience wrapper for tel: links with phone_click tracking.
 */
export function TrackableCallLink({
  clinicId,
  clinicName,
  phone,
  className,
  children,
}: TrackableCallLinkProps) {
  return (
    <TrackableLink
      href={`tel:${phone}`}
      clinicId={clinicId}
      clinicName={clinicName}
      eventType="phone_click"
      dataLayerExtras={{ phone_number: phone }}
      className={className}
    >
      {children}
    </TrackableLink>
  );
}
