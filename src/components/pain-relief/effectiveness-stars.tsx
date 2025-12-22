import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EffectivenessRating } from '@/types/pain-relief';

interface EffectivenessStarsProps {
  rating: EffectivenessRating;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const ratingLabels: Record<EffectivenessRating, string> = {
  1: 'Minimal',
  2: 'Mild',
  3: 'Moderate',
  4: 'Good',
  5: 'Excellent',
};

export function EffectivenessStars({
  rating,
  showLabel = false,
  size = 'sm',
  className,
}: EffectivenessStarsProps) {
  const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              starSize,
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700'
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-sm text-muted-foreground ml-1">
          {ratingLabels[rating]}
        </span>
      )}
    </div>
  );
}
