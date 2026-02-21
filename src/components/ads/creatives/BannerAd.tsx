import type { AdCreativeResult } from "@/lib/ad-queries";

/** Placements that appear above the fold — should be eager-loaded for LCP. */
const EAGER_PLACEMENTS = new Set(["clinic-above-fold", "clinic-top-leaderboard"]);

interface BannerAdProps {
  creative: AdCreativeResult;
  clickUrl: string;
  /** Placement name used to determine image loading priority. */
  placement?: string;
}

export function BannerAd({ creative, clickUrl, placement }: BannerAdProps) {
  // Wide aspect ratios (16:9, 4:3, 3:2) fill the content width with no height cap.
  // Square (1:1) and auto keep a max-height to avoid dominating sidebar slots.
  const isWide = creative.aspectRatio === "16:9" || creative.aspectRatio === "4:3" || creative.aspectRatio === "3:2";

  // Above-the-fold placements should load eagerly to avoid LCP penalty.
  const loading = placement && EAGER_PLACEMENTS.has(placement) ? "eager" : "lazy";

  return (
    <a
      href={clickUrl}
      target="_blank"
      rel="noreferrer sponsored"
      className="block w-full text-center"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={creative.imageUrl ?? ""}
        alt={creative.imageAlt ?? creative.name}
        className={
          isWide
            ? "w-full h-auto rounded"
            : "mx-auto max-w-full max-h-[250px] w-auto h-auto rounded"
        }
        loading={loading}
      />
      {creative.headline && (
        <p className="text-sm font-medium mt-2 text-foreground">
          {creative.headline}
        </p>
      )}
    </a>
  );
}
