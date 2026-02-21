"use client";

import type { AdCreativeResult } from "@/lib/ad-queries";

interface TextAdProps {
  creative: AdCreativeResult;
  clickUrl: string;
}

export function TextAd({ creative, clickUrl }: TextAdProps) {
  return (
    <a
      href={clickUrl}
      target="_blank"
      rel="noreferrer sponsored"
      className="group block rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-4 text-center hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all shadow-sm"
    >
      {creative.headline && (
        <>
          <style>{`
            @keyframes text-glow {
              0%, 100% { text-shadow: 0 0 4px rgba(255,255,255,0.2); }
              50%       { text-shadow: 0 0 16px rgba(255,255,255,0.6); }
            }
            .text-ad-headline {
              animation: text-glow 2.5s ease-in-out infinite;
            }
          `}</style>
          <p className="text-ad-headline font-semibold text-white text-base">
            {creative.headline}
          </p>
        </>
      )}
      {creative.bodyText && (
        <p className="text-sm text-blue-100 mt-2">
          {creative.bodyText}
        </p>
      )}
      {creative.ctaText && (
        <p className="text-xs font-medium text-white/90 mt-2 uppercase tracking-wide">
          {creative.ctaText}
        </p>
      )}
      {creative.destinationUrl && (
        <p className="text-xs text-blue-200/70 mt-1 truncate">
          {creative.destinationUrl.replace(/^https?:\/\//, "")}
        </p>
      )}
    </a>
  );
}
