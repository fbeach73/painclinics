'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// Dynamically import SearchFeaturedSection - only loads when visible
const SearchFeaturedSection = dynamic(
  () => import('./search-featured-section').then((mod) => mod.SearchFeaturedSection),
  {
    ssr: false,
    loading: () => null, // We handle loading state ourselves
  }
);

interface LazySearchFeaturedSectionProps {
  stateAbbrev?: string;
  city?: string;
  className?: string;
  /** Distance from viewport to start loading (default: 200px) */
  rootMargin?: string;
}

/**
 * Lazy-loaded wrapper for SearchFeaturedSection that defers carousel
 * loading until the section is near the viewport.
 *
 * This saves ~50KB+ of carousel JavaScript on initial page load,
 * improving PageSpeed scores.
 */
export function LazySearchFeaturedSection({
  stateAbbrev,
  city,
  className,
  rootMargin = '200px',
}: LazySearchFeaturedSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = containerRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold: 0.01,
      }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin]);

  return (
    <div ref={containerRef}>
      {isVisible ? (
        <SearchFeaturedSection
          {...(stateAbbrev && { stateAbbrev })}
          {...(city && { city })}
          {...(className && { className })}
        />
      ) : (
        // Placeholder matches actual FeaturedClinicsCarouselSkeleton dimensions
        // Card height: image (208px) + header (72px) + content (80px) + footer (58px) = ~418px
        // Plus section padding (32px) + header (28px) + dots (28px) = ~506px total
        <section
          className={cn(
            'mb-8 p-4 bg-yellow-50/50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800 min-h-[480px] sm:min-h-[520px]',
            className
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <div className="h-6 w-40 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[320px] min-h-[420px] bg-muted/50 animate-pulse rounded-xl hidden first:block sm:first:block sm:[&:nth-child(2)]:block lg:block"
              />
            ))}
          </div>
          {/* Skeleton dots */}
          <div className="flex justify-center gap-2 mt-6">
            <div className="w-8 h-2 bg-muted animate-pulse rounded-full" />
            <div className="w-2 h-2 bg-muted animate-pulse rounded-full" />
            <div className="w-2 h-2 bg-muted animate-pulse rounded-full" />
          </div>
        </section>
      )}
    </div>
  );
}

export default LazySearchFeaturedSection;
