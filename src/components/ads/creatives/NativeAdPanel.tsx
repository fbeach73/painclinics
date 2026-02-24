import type { AdForPlacement } from "@/lib/ad-queries";

interface NativeAdPanelProps {
  ads: AdForPlacement[];
  /** Number of columns on larger screens (default 3) */
  columns?: 2 | 3;
}

/**
 * Content-recommendation style native ad grid.
 * Renders multiple sponsored items in a Taboola/Outbrain-style layout
 * that blends with site content.
 */
export function NativeAdPanel({ ads, columns = 3 }: NativeAdPanelProps) {
  if (ads.length === 0) return null;

  const gridCols =
    columns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 my-8 border-t border-border pt-6">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
        Sponsored Content
      </p>
      <div className={`grid ${gridCols} gap-4`}>
        {ads.map((ad) => (
          <a
            key={ad.clickId}
            href={ad.clickUrl}
            target="_blank"
            rel="noreferrer sponsored"
            className="group block rounded-lg border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
          >
            {ad.creative.imageUrl && (
              <div className="aspect-[16/9] overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ad.creative.imageUrl}
                  alt={ad.creative.imageAlt ?? ad.creative.headline ?? ad.creative.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            )}
            <div className="p-3">
              {ad.creative.headline && (
                <p className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-foreground transition-colors">
                  {ad.creative.headline}
                </p>
              )}
              {ad.creative.bodyText && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {ad.creative.bodyText}
                </p>
              )}
              <div className="mt-2">
                <span className="inline-block text-xs font-semibold text-white bg-red-600 rounded px-2.5 py-1 group-hover:bg-red-700 transition-colors">
                  {ad.creative.ctaText || "Learn More"}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
