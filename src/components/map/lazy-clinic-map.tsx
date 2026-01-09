'use client';

import { useState, useEffect, useRef, type ComponentProps } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

// Dynamically import the actual map component with no SSR
const ClinicMap = dynamic(
  () => import('./clinic-map').then((mod) => mod.ClinicMap),
  {
    ssr: false,
    loading: () => null, // We handle loading state ourselves
  }
);

type ClinicMapProps = ComponentProps<typeof ClinicMap>;

interface LazyClinicMapProps extends ClinicMapProps {
  /** Distance from viewport to start loading (default: 200px) */
  rootMargin?: string;
}

/**
 * Lazy-loaded wrapper for ClinicMap that only loads Mapbox
 * when the map container enters the viewport.
 *
 * This significantly improves PageSpeed scores by deferring
 * ~340ms of Mapbox loading until the user actually scrolls to the map.
 */
export function LazyClinicMap({
  className = 'h-[60vh] min-h-[400px] w-full',
  rootMargin = '200px',
  ...props
}: LazyClinicMapProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
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
        rootMargin, // Start loading before it enters viewport
        threshold: 0.01,
      }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin]);

  // Track when map has actually loaded
  useEffect(() => {
    if (!isVisible) return;

    // Small delay to let dynamic import complete
    const timer = setTimeout(() => setHasLoaded(true), 100);
    return () => clearTimeout(timer);
  }, [isVisible]);

  return (
    <div ref={containerRef} className={cn(className, 'relative')}>
      {isVisible ? (
        <ClinicMap className={className} {...props} />
      ) : (
        <div
          className={cn(
            className,
            'bg-muted/50 rounded-lg flex items-center justify-center'
          )}
        >
          <div className="text-center space-y-2">
            <div className="h-10 w-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <svg
                className="h-5 w-5 text-primary/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">
              Scroll to load map
            </p>
          </div>
        </div>
      )}

      {/* Loading overlay while map initializes */}
      {isVisible && !hasLoaded && (
        <div className="absolute inset-0 bg-muted/50 rounded-lg flex items-center justify-center z-10">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading map...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default LazyClinicMap;
