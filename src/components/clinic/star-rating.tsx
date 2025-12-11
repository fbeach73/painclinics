import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  reviewCount: number;
  variant?: 'compact' | 'full' | 'featured';
  className?: string;
}

/**
 * Star rating display component with multiple display variants.
 * - compact: Single star icon with rating number (default)
 * - featured: Five stars with rating and review count (card style)
 * - full: Five stars with larger text (header style)
 */
export function StarRating({
  rating,
  reviewCount,
  variant = 'compact',
  className
}: StarRatingProps) {
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">{rating.toFixed(1)}</span>
        <span className="text-muted-foreground text-sm">({reviewCount})</span>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'h-4 w-4',
                star <= Math.round(rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700'
              )}
            />
          ))}
        </div>
        <span className="font-semibold text-slate-800 dark:text-slate-300">{rating.toFixed(1)}</span>
        <span className="text-slate-500 dark:text-slate-400 text-sm">({reviewCount} reviews)</span>
      </div>
    );
  }

  // full variant
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-5 w-5',
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted'
            )}
          />
        ))}
      </div>
      <span className="text-lg font-semibold">{rating.toFixed(1)}</span>
      <span className="text-muted-foreground">({reviewCount} reviews)</span>
    </div>
  );
}
