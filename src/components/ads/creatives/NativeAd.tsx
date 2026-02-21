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
      className="flex items-start gap-4 rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors"
    >
      {creative.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={creative.imageUrl}
          alt={creative.imageAlt ?? creative.name}
          className="h-12 w-12 shrink-0 rounded object-contain"
          loading="lazy"
        />
      )}
      <div className="min-w-0 flex-1">
        {creative.headline && (
          <p className="font-semibold text-sm">{creative.headline}</p>
        )}
        {creative.bodyText && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {creative.bodyText}
          </p>
        )}
        {creative.ctaText && (
          <span className="inline-block mt-2 text-xs font-medium text-primary">
            {creative.ctaText} &rarr;
          </span>
        )}
      </div>
    </a>
  );
}
