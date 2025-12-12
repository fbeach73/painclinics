import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { FeaturedReview } from "@/types/clinic";

interface ClinicTestimonialsProps {
  reviews: FeaturedReview[];
}

export function ClinicTestimonials({ reviews }: ClinicTestimonialsProps) {
  if (!reviews?.length) return null;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Patient Testimonials</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {reviews.slice(0, 4).map((review, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={
                      j < review.rating
                        ? "h-4 w-4 fill-yellow-400 text-yellow-400"
                        : "h-4 w-4 fill-muted text-muted"
                    }
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-4">
                &ldquo;{review.review}&rdquo;
              </p>
              {review.username && (
                <p className="text-sm font-medium mt-2">&mdash; {review.username}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
