'use client';

import { Sparkles } from 'lucide-react';
import {
  useFeaturedClinics,
  featuredToClinicWithDistance,
} from '@/hooks/use-featured-clinics';
import {
  FeaturedClinicsCarousel,
  FeaturedClinicsCarouselSkeleton,
} from './featured-clinics-carousel';

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
      <div className="py-12 bg-gradient-to-b from-emerald-50/80 via-teal-50/40 to-transparent dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-transparent">
        <div className="container mx-auto px-4">
          {/* Section header with improved contrast */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {hasLocation ? 'Featured Clinics Near You' : 'Featured Clinics'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Top-rated pain management specialists ready to help
              </p>
            </div>
          </div>

          {/* Decorative accent line */}
          <div className="flex items-center gap-2 mb-8 ml-[52px]">
            <div className="h-0.5 w-12 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" />
            <div className="h-0.5 w-6 bg-gradient-to-r from-teal-400 to-emerald-300 rounded-full" />
            <div className="h-0.5 w-2 bg-emerald-300 rounded-full" />
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
