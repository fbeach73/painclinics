import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FeaturedReview, ReviewKeywordItem, ReviewScoreItem } from "@/types/clinic";
import { ClinicTestimonials } from "./clinic-testimonials";
import { ReviewBreakdown } from "./review-breakdown";
import { ReviewKeywords } from "./review-keywords";

interface ClinicReviewsProps {
  featuredReviews?: FeaturedReview[] | undefined;
  reviewsPerScore?: ReviewScoreItem[] | undefined;
  reviewKeywords?: ReviewKeywordItem[] | undefined;
  totalReviews: number;
}

export function ClinicReviews({
  featuredReviews,
  reviewsPerScore,
  reviewKeywords,
  totalReviews,
}: ClinicReviewsProps) {
  const hasContent =
    (featuredReviews && featuredReviews.length > 0) ||
    (reviewsPerScore && reviewsPerScore.length > 0) ||
    (reviewKeywords && reviewKeywords.length > 0);

  if (!hasContent) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {reviewsPerScore && reviewsPerScore.length > 0 && (
          <ReviewBreakdown
            reviewsPerScore={reviewsPerScore}
            totalReviews={totalReviews}
          />
        )}
        {reviewKeywords && reviewKeywords.length > 0 && (
          <ReviewKeywords keywords={reviewKeywords} />
        )}
        {featuredReviews && featuredReviews.length > 0 && (
          <ClinicTestimonials reviews={featuredReviews} />
        )}
      </CardContent>
    </Card>
  );
}
