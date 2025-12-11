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

interface HomepageFeaturedSectionProps {
  className?: string;
}

/**
 * Homepage featured clinics section with geo-awareness.
 * Shows featured clinics near the user when location is available,
 * otherwise shows random featured clinics.
 * Hides entirely when no featured clinics exist.
 */
export function HomepageFeaturedSection({ className }: HomepageFeaturedSectionProps) {
  const { clinics, isLoading, hasLocation } = useFeaturedClinics({
    limit: 10,
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

  return (
    <section className={className}>
      <div className="py-8 bg-gradient-to-b from-yellow-50/50 to-transparent dark:from-yellow-950/10 dark:to-transparent">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
            <h2 className="text-2xl font-bold">
              {hasLocation ? 'Featured Clinics Near You' : 'Featured Clinics'}
            </h2>
          </div>

          {isLoading ? (
            <FeaturedClinicsCarouselSkeleton count={3} />
          ) : (
            <FeaturedClinicsCarousel clinics={clinicsWithDistance} />
          )}
        </div>
      </div>
    </section>
  );
}
