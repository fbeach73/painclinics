import { Stethoscope } from "lucide-react";
import type { AdCreativeResult } from "@/lib/ad-queries";

interface NativeAdProps {
  creative: AdCreativeResult;
  clickUrl: string;
}

export function NativeAd({ creative, clickUrl }: NativeAdProps) {
  return (
    <a
      href={clickUrl}
      target="_blank"
      rel="noreferrer sponsored"
      className="flex items-center gap-4 transition-colors group"
    >
      {creative.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={creative.imageUrl}
          alt={creative.imageAlt ?? creative.name}
          className="h-20 w-20 shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-200/70 dark:bg-slate-700/50">
          <Stethoscope className="h-8 w-8 text-slate-900 dark:text-slate-200" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        {creative.headline && (
          <p className="font-bold text-base text-slate-900 dark:text-foreground">{creative.headline}</p>
        )}
        {creative.bodyText && (
          <p className="text-sm text-slate-600 dark:text-muted-foreground mt-1 line-clamp-2">
            {creative.bodyText}
          </p>
        )}
        {creative.ctaText && (
          <span className="inline-block mt-2.5 rounded-md bg-red-600 px-4 py-1.5 text-xs font-bold text-white group-hover:bg-red-700 transition-colors">
            {creative.ctaText} &rarr;
          </span>
        )}
      </div>
    </a>
  );
}
