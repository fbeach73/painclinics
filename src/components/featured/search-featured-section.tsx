'use client';

import { Star } from 'lucide-react';
import {
  FeaturedClinicsCarousel,
  FeaturedClinicsCarouselSkeleton,
} from './featured-clinics-carousel';
import {
  useFeaturedClinics,
  featuredToClinicWithDistance,
} from '@/hooks/use-featured-clinics';
import { cn } from '@/lib/utils';

interface SearchFeaturedSectionProps {
  stateAbbrev?: string;
  city?: string;
  className?: string;
}

/**
 * Featured clinics section for search result pages.
 * Shows context-aware featured clinics (filtered by state/city when provided).
 * Uses geo-location when available for sorting by distance.
 * Hides entirely when no featured clinics exist.
 */
export function SearchFeaturedSection({
  stateAbbrev,
  city,
  className,
}: SearchFeaturedSectionProps) {
  const { clinics, isLoading, hasLocation } = useFeaturedClinics({
    ...(stateAbbrev && { stateAbbrev }),
    ...(city && { city }),
    limit: 6,
    useGeolocation: true,
    radiusMiles: 100,
    randomize: true,
  });

  // Convert to ClinicWithDistance for carousel compatibility
  const clinicsWithDistance = clinics.map(featuredToClinicWithDistance);

  // Don't render anything if no featured clinics and not loading
  if (!isLoading && clinicsWithDistance.length === 0) {
    return null;
  }

  // Build the heading text based on context
  const getHeadingText = () => {
    if (city && stateAbbrev) {
      return `Featured Clinics in ${city}`;
    }
    if (stateAbbrev) {
      return `Featured Clinics in ${stateAbbrev}`;
    }
    if (hasLocation) {
      return 'Featured Clinics Near You';
    }
    return 'Featured Clinics';
  };

  return (
    <section
      className={cn(
        'mb-8 p-4 bg-yellow-50/50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
        <h2 className="text-lg font-semibold">{getHeadingText()}</h2>
      </div>

      {isLoading ? (
        <FeaturedClinicsCarouselSkeleton count={3} variant="compact" />
      ) : (
        <FeaturedClinicsCarousel
          clinics={clinicsWithDistance}
          variant="compact"
        />
      )}
    </section>
  );
}
