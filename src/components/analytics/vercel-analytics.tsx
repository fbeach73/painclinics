"use client";

import { Analytics } from "@vercel/analytics/react";

export function VercelAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        // Don't track admin pages
        if (event.url.includes("/admin")) {
          return null;
        }
        return event;
      }}
    />
  );
}
