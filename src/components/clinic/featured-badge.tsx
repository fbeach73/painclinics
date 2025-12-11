import { Star, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type FeaturedTier = 'none' | 'basic' | 'premium';

interface FeaturedBadgeProps {
  tier: FeaturedTier;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export function FeaturedBadge({ tier, size = 'md', animated = false, className }: FeaturedBadgeProps) {
  if (tier === 'none') {
    return null;
  }

  const isPremium = tier === 'premium';

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      variant="secondary"
      className={cn(
        'gap-1 font-semibold',
        isPremium
          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 hover:from-amber-500 hover:to-yellow-600 dark:from-amber-500 dark:to-yellow-600 dark:text-amber-950'
          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800',
        sizeClasses[size],
        animated && 'badge-animate',
        className
      )}
    >
      {isPremium ? (
        <Star className={cn(iconSizes[size], 'fill-current')} />
      ) : (
        <Award className={iconSizes[size]} />
      )}
      {isPremium ? 'Premium' : 'Featured'}
    </Badge>
  );
}
