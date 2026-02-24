"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { AdCreativeResult } from "@/lib/ad-queries";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

interface HtmlAdProps {
  creative: AdCreativeResult;
  clickUrl: string;
}

export function HtmlAd({ creative, clickUrl }: HtmlAdProps) {
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const sanitizedHtml = useMemo(() => {
    if (!isClient) return "";
    // DOMPurify requires window/document — only import on the client
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DOMPurify = require("dompurify") as { sanitize: (html: string, config: Record<string, unknown>) => string };
    return DOMPurify.sanitize(creative.htmlContent ?? "", {
      FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
      ALLOW_DATA_ATTR: false,
    });
  }, [creative.htmlContent, isClient]);

  return (
    <div className="w-full text-center">
      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes ad-glow-pulse {
  0%, 100% { text-shadow: 0 0 4px rgba(255,255,255,0.2); }
  50% { text-shadow: 0 0 18px rgba(255,255,255,0.7), 0 0 32px rgba(147,197,253,0.4); }
}
.ad-html-glow h1, .ad-html-glow h2, .ad-html-glow h3,
.ad-html-glow h4, .ad-html-glow h5, .ad-html-glow h6,
.ad-html-glow p, .ad-html-glow span, .ad-html-glow strong, .ad-html-glow b {
  animation: ad-glow-pulse 2.5s ease-in-out infinite;
}
`,
        }}
      />
      <a
        href={clickUrl}
        target="_blank"
        rel="noreferrer sponsored"
        className="block"
      >
        <div
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          className="ad-html-glow w-full [&>*]:mx-auto"
        />
      </a>
    </div>
  );
}
