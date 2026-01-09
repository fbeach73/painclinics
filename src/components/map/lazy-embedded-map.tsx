'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildGoogleMapsDirectionsUrl } from '@/lib/maps-utils';
import { cn } from '@/lib/utils';
import type { Clinic } from '@/types/clinic';

// Dynamically import EmbeddedMap with no SSR - only loads when visible
const EmbeddedMap = dynamic(
  () => import('./embedded-map').then((mod) => mod.EmbeddedMap),
  {
    ssr: false,
    loading: () => null, // We handle loading state ourselves
  }
);

interface LazyEmbeddedMapProps {
  clinic: Clinic;
  className?: string;
  /** Distance from viewport to start loading (default: 100px) */
  rootMargin?: string;
}

/**
 * Lazy-loaded wrapper for EmbeddedMap that defers Mapbox loading
 * until the map container is near the viewport.
 *
 * This saves ~500KB+ of JavaScript on initial page load for clinic pages,
 * significantly improving PageSpeed scores.
 */
export function LazyEmbeddedMap({
  clinic,
  className = 'h-[250px]',
  rootMargin = '100px',
}: LazyEmbeddedMapProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const googleMapsUrl = buildGoogleMapsDirectionsUrl(clinic.address.formatted);

  // Check for valid coordinates
  const hasValidCoordinates =
    clinic.coordinates.lat !== 0 &&
    clinic.coordinates.lng !== 0 &&
    clinic.coordinates.lat !== null &&
    clinic.coordinates.lng !== null;

  useEffect(() => {
    // Skip observer if no valid coordinates
    if (!hasValidCoordinates) return;

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
  }, [rootMargin, hasValidCoordinates]);

  // If no valid coordinates, show fallback immediately (no need to lazy load)
  if (!hasValidCoordinates) {
    return (
      <div className={cn(className, 'flex flex-col items-center justify-center bg-muted rounded-lg gap-4')}>
        <p className="text-muted-foreground text-center text-sm px-4">
          Map coordinates not available
        </p>
        <Button asChild variant="outline" size="sm">
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Get Directions
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-3">
      {isVisible ? (
        <EmbeddedMap clinic={clinic} className={className} />
      ) : (
        // Placeholder with exact same dimensions to prevent CLS
        <div className={cn(className, 'rounded-lg overflow-hidden bg-muted/50 flex flex-col items-center justify-center')}>
          <div className="text-center space-y-2">
            <div className="h-8 w-8 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-primary/60" />
            </div>
            <p className="text-xs text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
      {/* Show directions button immediately - doesn't need map */}
      {!isVisible && (
        <Button asChild variant="outline" className="w-full">
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Get Directions
          </a>
        </Button>
      )}
    </div>
  );
}

export default LazyEmbeddedMap;
