import { MessageCircle } from "lucide-react";
import type { AdCreativeResult } from "@/lib/ad-queries";

interface CtaCardAdProps {
  creative: AdCreativeResult;
  clickUrl: string;
}

export function CtaCardAd({ creative, clickUrl }: CtaCardAdProps) {
  return (
    <a
      href={clickUrl}
      target="_blank"
      rel="noreferrer sponsored"
      className="group block rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-md shadow-emerald-100/50 transition-all hover:shadow-lg hover:shadow-emerald-200/50 dark:border-emerald-800 dark:bg-gradient-to-br dark:from-emerald-950 dark:to-slate-900 dark:shadow-emerald-900/30 dark:hover:shadow-emerald-800/40"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60">
          <MessageCircle className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
        </div>
        <div className="min-w-0 flex-1">
          {creative.headline && (
            <p className="text-base font-bold text-gray-900 dark:text-white">
              {creative.headline}
            </p>
          )}
          {creative.bodyText && (
            <p className="mt-1 text-sm text-gray-600 dark:text-neutral-300">
              {creative.bodyText}
            </p>
          )}
        </div>
      </div>

      {creative.ctaText && (
        <div className="mt-4">
          <span className="relative inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-emerald-700 dark:bg-emerald-600 dark:group-hover:bg-emerald-500">
            <span className="absolute inset-0 rounded-lg animate-pulse-ring" />
            {creative.ctaText}
          </span>
        </div>
      )}

      <p className="mt-3 text-center text-[10px] text-gray-400 dark:text-neutral-500">
        Sponsored
      </p>
    </a>
  );
}
