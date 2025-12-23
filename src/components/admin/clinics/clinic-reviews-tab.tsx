"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Loader2,
  MessageSquare,
  Plus,
  Save,
  Star,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type {
  DetailedReview,
  FeaturedReview,
  ReviewKeyword,
  ReviewsPerScore,
} from "@/lib/clinic-transformer";

interface ClinicReviewsData {
  reviewKeywords: ReviewKeyword[] | null;
  reviewsPerScore: ReviewsPerScore | null;
  featuredReviews: FeaturedReview[] | null;
  detailedReviews: DetailedReview[] | null;
  allReviewsText: string | null;
  rating: number | null;
  reviewCount: number | null;
}

interface ClinicReviewsTabProps {
  clinicId: string;
  clinicName: string;
  initialData: ClinicReviewsData;
}

export function ClinicReviewsTab({
  clinicId,
  clinicName,
  initialData,
}: ClinicReviewsTabProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form state
  const [keywords, setKeywords] = useState<ReviewKeyword[]>(
    initialData.reviewKeywords || []
  );
  const [featuredReviews, setFeaturedReviews] = useState<FeaturedReview[]>(
    initialData.featuredReviews || []
  );
  const [newKeyword, setNewKeyword] = useState("");

  // Reset form when initial data changes
  useEffect(() => {
    setKeywords(initialData.reviewKeywords || []);
    setFeaturedReviews(initialData.featuredReviews || []);
    setHasUnsavedChanges(false);
  }, [initialData]);

  // Calculate total reviews from reviewsPerScore
  const reviewsPerScore = initialData.reviewsPerScore || {};
  const totalReviews = Object.values(reviewsPerScore).reduce(
    (sum, count) => sum + count,
    0
  );

  // Add a new keyword
  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    const exists = keywords.some(
      (k) => k.keyword.toLowerCase() === newKeyword.trim().toLowerCase()
    );
    if (exists) {
      toast.error("Keyword already exists");
      return;
    }
    setKeywords([...keywords, { keyword: newKeyword.trim(), count: 1 }]);
    setNewKeyword("");
    setHasUnsavedChanges(true);
  };

  // Remove a keyword
  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k.keyword !== keyword));
    setHasUnsavedChanges(true);
  };

  // Toggle a detailed review as featured
  const handleToggleFeaturedReview = (review: DetailedReview) => {
    const isCurrentlyFeatured = featuredReviews.some(
      (fr) =>
        fr.review === review.review_text?.replace(/<[^>]*>/g, "").trim() ||
        fr.username === review.author_title
    );

    if (isCurrentlyFeatured) {
      // Remove from featured
      setFeaturedReviews(
        featuredReviews.filter(
          (fr) =>
            fr.review !== review.review_text?.replace(/<[^>]*>/g, "").trim() &&
            fr.username !== review.author_title
        )
      );
    } else {
      // Add to featured (max 5)
      if (featuredReviews.length >= 5) {
        toast.error("Maximum 5 featured reviews allowed");
        return;
      }
      const newFeatured: FeaturedReview = {
        username: review.author_title || null,
        url: review.author_link || null,
        review: review.review_text?.replace(/<[^>]*>/g, "").trim() || null,
        date: review.review_datetime_utc || null,
        rating: review.review_rating || null,
      };
      setFeaturedReviews([...featuredReviews, newFeatured]);
    }
    setHasUnsavedChanges(true);
  };

  // Remove a featured review
  const handleRemoveFeaturedReview = (index: number) => {
    setFeaturedReviews(featuredReviews.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewKeywords: keywords.length > 0 ? keywords : null,
          featuredReviews: featuredReviews.length > 0 ? featuredReviews : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save changes");
      }

      toast.success("Review data saved successfully");
      setHasUnsavedChanges(false);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save changes";
      setError(message);
      toast.error("Save failed", { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <= rating
                ? "text-yellow-500 fill-yellow-500"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  // Check if a detailed review is featured
  const isReviewFeatured = (review: DetailedReview) => {
    return featuredReviews.some(
      (fr) =>
        fr.review === review.review_text?.replace(/<[^>]*>/g, "").trim() ||
        fr.username === review.author_title
    );
  };

  return (
    <div className="space-y-6">
      {/* Save Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Reviews Manager</span>
              <span className="text-sm text-muted-foreground">
                {clinicName}
              </span>
              {hasUnsavedChanges && (
                <Badge
                  variant="outline"
                  className="text-yellow-600 border-yellow-300 ml-2"
                >
                  Unsaved changes
                </Badge>
              )}
            </div>
            <Button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Rating Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Rating Overview
          </CardTitle>
          <CardDescription>
            Overall rating and review breakdown from Google
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Overall Rating */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold">
                  {initialData.rating?.toFixed(1) || "N/A"}
                </span>
                <div>
                  {initialData.rating && renderStars(Math.round(initialData.rating))}
                  <span className="text-sm text-muted-foreground">
                    {initialData.reviewCount || 0} reviews
                  </span>
                </div>
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((score) => {
                const count = reviewsPerScore[score] || 0;
                const percentage =
                  totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={score} className="flex items-center gap-2">
                    <span className="w-6 text-sm text-muted-foreground">
                      {score}★
                    </span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm text-muted-foreground">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Keywords Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Review Keywords
          </CardTitle>
          <CardDescription>
            Keywords extracted from reviews, used for SEO and content generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new keyword */}
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Add a keyword..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddKeyword();
                }
              }}
            />
            <Button onClick={handleAddKeyword} variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Keywords list */}
          <div className="flex flex-wrap gap-2">
            {keywords.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No keywords yet. Add keywords or import from CSV.
              </p>
            ) : (
              keywords.map((kw, index) => (
                <Badge
                  key={`${kw.keyword}-${index}`}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  {kw.keyword}
                  {kw.count > 1 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({kw.count})
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(kw.keyword)}
                    className="ml-1 hover:bg-muted rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Featured Reviews Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Featured Reviews
            <Badge variant="outline" className="ml-2">
              {featuredReviews.length}/5
            </Badge>
          </CardTitle>
          <CardDescription>
            Select up to 5 reviews to feature on the clinic page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {featuredReviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No featured reviews yet. Select reviews from the list below.
            </p>
          ) : (
            <div className="space-y-3">
              {featuredReviews.map((review, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border bg-muted/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {review.rating && renderStars(review.rating)}
                      <span className="text-sm font-medium">
                        {review.username || "Anonymous"}
                      </span>
                      {review.date && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFeaturedReview(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <p className="text-sm line-clamp-3">{review.review}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Reviews to Feature */}
      {initialData.detailedReviews && initialData.detailedReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Reviews to Feature</CardTitle>
            <CardDescription>
              Click on a review to add it to featured reviews.
              {initialData.detailedReviews.length} total reviews available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {initialData.detailedReviews
                .filter((r) => r.review_text && r.review_text.length > 20)
                .sort((a, b) => (b.review_rating || 0) - (a.review_rating || 0))
                .slice(0, 20)
                .map((review, index) => {
                  const isFeatured = isReviewFeatured(review);
                  return (
                    <div
                      key={review.review_id || index}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isFeatured
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleToggleFeaturedReview(review)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isFeatured} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {review.review_rating &&
                              renderStars(review.review_rating)}
                            <span className="text-sm font-medium">
                              {review.author_title || "Anonymous"}
                            </span>
                            {review.review_likes !== undefined &&
                              review.review_likes > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {review.review_likes} likes
                                </Badge>
                              )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {review.review_text?.replace(/<[^>]*>/g, "").trim()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Reviews Text */}
      {initialData.allReviewsText && (
        <Card>
          <CardHeader>
            <CardTitle>All Reviews Text (AI Context)</CardTitle>
            <CardDescription>
              Concatenated review text used for AI content generation. Read-only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={initialData.allReviewsText}
              readOnly
              className="min-h-[200px] font-mono text-sm bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {initialData.allReviewsText.split(/\s+/).length} words total
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">About Reviews Management</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Rating & Breakdown:</strong> Synced from Google Places via
            the Sync tab. Cannot be edited manually.
          </p>
          <Separator className="my-3" />
          <p>
            <strong>Review Keywords:</strong> Extracted from reviews during
            import. Used for SEO meta tags and AI content generation.
          </p>
          <Separator className="my-3" />
          <p>
            <strong>Featured Reviews:</strong> Select up to 5 reviews to display
            prominently on the clinic page. High-quality reviews improve user trust.
          </p>
          <Separator className="my-3" />
          <p>
            <strong>All Reviews Text:</strong> Concatenated text from all reviews,
            used by AI to generate clinic descriptions and content. Updated during
            import.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
