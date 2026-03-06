import Link from "next/link";
import { ShieldCheck } from "lucide-react";

interface MedicalReviewBadgeProps {
  /** Optional reviewer name — if provided, shown with attribution */
  reviewerName?: string | undefined;
  /** Optional link to reviewer's clinic page or bio */
  reviewerHref?: string | undefined;
  /** Optional reviewer credentials (e.g., "MD, Board-Certified Pain Management") */
  reviewerCredentials?: string | undefined;
  /** Compact variant for inline use */
  compact?: boolean | undefined;
}

export function MedicalReviewBadge({
  reviewerName,
  reviewerHref,
  reviewerCredentials,
  compact = false,
}: MedicalReviewBadgeProps) {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <span>
          Medically reviewed
          {reviewerName && (
            <>
              {" by "}
              {reviewerHref ? (
                <Link href={reviewerHref} className="text-primary hover:underline">
                  {reviewerName}
                </Link>
              ) : (
                <span className="font-medium">{reviewerName}</span>
              )}
            </>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-4">
      <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
      <div className="text-sm">
        <p className="font-medium text-emerald-900 dark:text-emerald-100">
          Medically Reviewed
        </p>
        {reviewerName ? (
          <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
            Reviewed by{" "}
            {reviewerHref ? (
              <Link href={reviewerHref} className="font-medium underline hover:no-underline">
                {reviewerName}
              </Link>
            ) : (
              <span className="font-medium">{reviewerName}</span>
            )}
            {reviewerCredentials && (
              <span className="text-emerald-600 dark:text-emerald-400">
                {", "}
                {reviewerCredentials}
              </span>
            )}
          </p>
        ) : (
          <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
            Reviewed by our{" "}
            <Link href="/editorial-policy" className="font-medium underline hover:no-underline">
              editorial team
            </Link>
          </p>
        )}
        <p className="text-emerald-600 dark:text-emerald-400 mt-1">
          Content follows our{" "}
          <Link href="/editorial-policy" className="underline hover:no-underline">
            editorial policy
          </Link>{" "}
          and is intended for informational purposes only.
        </p>
      </div>
    </div>
  );
}
