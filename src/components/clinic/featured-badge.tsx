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
          ? 'bg-gradient-to-r from-featured-border to-featured-foreground text-featured hover:from-featured-foreground hover:to-featured-border'
          : 'bg-featured text-featured-foreground border border-featured-border hover:bg-featured-border/20',
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
