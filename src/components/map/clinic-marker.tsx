'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FeaturedTier = 'none' | 'basic' | 'premium';

interface ClinicMarkerProps {
  isSelected?: boolean;
  isFeatured?: boolean;
  featuredTier?: FeaturedTier;
  onClick?: () => void;
}

export function ClinicMarker({
  isSelected = false,
  isFeatured = false,
  featuredTier = 'none',
  onClick,
}: ClinicMarkerProps) {
  const isPremium = featuredTier === 'premium';
  const isBasicFeatured = isFeatured && featuredTier === 'basic';

  // Premium markers are larger and gold
  // Basic featured markers are normal size with gold color
  // Regular markers use primary color
  const markerSize = isPremium ? 'h-10 w-10' : 'h-8 w-8';
  const iconSize = isPremium ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center justify-center rounded-full shadow-md transition-transform duration-150 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2',
        markerSize,
        isSelected && 'scale-110 ring-2 ring-offset-2',
        isPremium
          ? 'bg-gradient-to-br from-amber-400 to-yellow-500 ring-yellow-500 shadow-lg shadow-amber-500/30'
          : isBasicFeatured
            ? 'bg-yellow-500 ring-yellow-500'
            : isSelected
              ? 'bg-primary ring-primary'
              : 'bg-primary/80 ring-primary focus:ring-primary'
      )}
      aria-label={isPremium ? 'Premium clinic location' : isFeatured ? 'Featured clinic location' : 'Clinic location'}
    >
      {isPremium ? (
        <Star className={cn(iconSize, 'text-amber-950 fill-current')} />
      ) : (
        <svg
          className={cn(iconSize, isPremium || isBasicFeatured ? 'text-yellow-950' : 'text-primary-foreground')}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
      )}
    </button>
  );
}
