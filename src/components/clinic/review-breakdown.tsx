import type { ReviewScoreItem } from "@/types/clinic";

interface ReviewBreakdownProps {
  reviewsPerScore: ReviewScoreItem[];
  totalReviews: number;
}

export function ReviewBreakdown({ reviewsPerScore, totalReviews }: ReviewBreakdownProps) {
  if (!reviewsPerScore?.length || !totalReviews) return null;

  // Convert array to lookup map for easy access
  const scoreMap = new Map(reviewsPerScore.map((item) => [item.score, item.count]));

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Rating Breakdown</h3>
      {[5, 4, 3, 2, 1].map((score) => {
        const count = scoreMap.get(score) || 0;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
        return (
          <div key={score} className="flex items-center gap-2">
            <span className="w-8 text-sm">{score}★</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-12 text-sm text-muted-foreground text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
