import type { AdCreativeResult } from "@/lib/ad-queries";

interface BannerAdProps {
  creative: AdCreativeResult;
  clickUrl: string;
}

export function BannerAd({ creative, clickUrl }: BannerAdProps) {
  // Wide aspect ratios (16:9, 4:3, 3:2) fill the content width with no height cap.
  // Square (1:1) and auto keep a max-height to avoid dominating sidebar slots.
  const isWide = creative.aspectRatio === "16:9" || creative.aspectRatio === "4:3" || creative.aspectRatio === "3:2";

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
        loading="lazy"
      />
      {creative.headline && (
        <p className="text-sm font-medium mt-2 text-foreground">
          {creative.headline}
        </p>
      )}
    </a>
  );
}
