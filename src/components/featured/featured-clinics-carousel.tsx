'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import type { ClinicWithDistance } from '@/types/clinic';
import { FeaturedClinicCard } from './featured-clinic-card';
import { Skeleton } from '@/components/ui/skeleton';

interface FeaturedClinicsCarouselProps {
  clinics: ClinicWithDistance[];
  variant?: 'default' | 'compact';
  className?: string;
  autoPlay?: boolean;
  autoPlayDelay?: number;
}

export function FeaturedClinicsCarousel({
  clinics,
  variant = 'default',
  className,
  autoPlay = true,
  autoPlayDelay = 5000,
}: FeaturedClinicsCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Check for reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Create autoplay plugin instance
  const autoplayPlugin = useRef(
    Autoplay({
      delay: autoPlayDelay,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
      stopOnFocusIn: true,
    })
  );

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!api) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        api.scrollPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        api.scrollNext();
      }
    },
    [api]
  );

  if (clinics.length === 0) {
    return null;
  }

  const isCompact = variant === 'compact';
  const shouldAutoPlay = autoPlay && !prefersReducedMotion && clinics.length > 3;

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Featured clinics carousel"
      className="outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
    >
      <Carousel
        setApi={setApi}
        opts={{
          align: 'start',
          loop: clinics.length > 3,
        }}
        plugins={shouldAutoPlay ? [autoplayPlugin.current] : []}
        className={cn('w-full', className)}
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {clinics.map((clinic) => (
            <CarouselItem
              key={clinic.id}
              className={cn(
                'pl-2 md:pl-4',
                // Responsive widths: 1 card mobile, 2 tablet, 3 desktop
                isCompact
                  ? 'basis-full sm:basis-1/2 lg:basis-1/3'
                  : 'basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4'
              )}
            >
              <FeaturedClinicCard clinic={clinic} className="h-full" />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-4 lg:-left-12" aria-label="Previous featured clinic" />
        <CarouselNext className="-right-4 lg:-right-12" aria-label="Next featured clinic" />
      </Carousel>
    </div>
  );
}

export function FeaturedClinicsCarouselSkeleton({
  count = 3,
  variant = 'default',
  className,
}: {
  count?: number;
  variant?: 'default' | 'compact';
  className?: string;
}) {
  const isCompact = variant === 'compact';

  return (
    <div className={cn('w-full overflow-hidden', className)}>
      <div className="flex -ml-2 md:-ml-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'pl-2 md:pl-4 shrink-0',
              isCompact
                ? 'basis-full sm:basis-1/2 lg:basis-1/3'
                : 'basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4'
            )}
          >
            <div className="min-w-[320px] max-w-[400px] h-full">
              <Skeleton className="h-48 w-full rounded-t-lg" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-16" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
