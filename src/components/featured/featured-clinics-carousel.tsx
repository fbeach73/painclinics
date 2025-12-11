'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ClinicWithDistance } from '@/types/clinic';
import { FeaturedClinicCard } from './featured-clinic-card';

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
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
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

  // Track current slide for dot indicators
  useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

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

  // Dot click handler
  const scrollTo = useCallback(
    (index: number) => {
      api?.scrollTo(index);
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
        {/* Carousel content with generous spacing */}
        <CarouselContent className="-ml-4 md:-ml-6">
          {clinics.map((clinic) => (
            <CarouselItem
              key={clinic.id}
              className={cn(
                'pl-4 md:pl-6',
                // Responsive widths: 1 card mobile, 2 tablet, 3 desktop (no 4-card layout)
                isCompact
                  ? 'basis-full sm:basis-1/2 lg:basis-1/3'
                  : 'basis-full sm:basis-1/2 lg:basis-1/3'
              )}
            >
              <FeaturedClinicCard clinic={clinic} className="h-full" />
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Styled navigation arrows with glow effect */}
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2',
            'h-11 w-11 rounded-full',
            'bg-white dark:bg-slate-900 backdrop-blur-sm',
            'border-2 border-emerald-300 dark:border-emerald-700',
            'text-emerald-600 dark:text-emerald-400',
            'hover:bg-emerald-500 hover:border-emerald-500 hover:text-white',
            'dark:hover:bg-emerald-600 dark:hover:border-emerald-600 dark:hover:text-white',
            'shadow-lg shadow-emerald-500/20',
            'nav-arrow-glow',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-emerald-600 disabled:hover:border-emerald-300',
            'hidden sm:flex'
          )}
          disabled={!api?.canScrollPrev()}
          onClick={() => api?.scrollPrev()}
          aria-label="Previous featured clinic"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2',
            'h-11 w-11 rounded-full',
            'bg-white dark:bg-slate-900 backdrop-blur-sm',
            'border-2 border-emerald-300 dark:border-emerald-700',
            'text-emerald-600 dark:text-emerald-400',
            'hover:bg-emerald-500 hover:border-emerald-500 hover:text-white',
            'dark:hover:bg-emerald-600 dark:hover:border-emerald-600 dark:hover:text-white',
            'shadow-lg shadow-emerald-500/20',
            'nav-arrow-glow',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-emerald-600 disabled:hover:border-emerald-300',
            'hidden sm:flex'
          )}
          disabled={!api?.canScrollNext()}
          onClick={() => api?.scrollNext()}
          aria-label="Next featured clinic"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </Carousel>

      {/* Dot indicators */}
      {count > 1 && (
        <div className="flex justify-center gap-2 mt-6" role="tablist" aria-label="Carousel navigation">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              role="tab"
              aria-selected={current === index}
              aria-label={`Go to slide ${index + 1}`}
              className={cn(
                'transition-all duration-300 rounded-full',
                current === index
                  ? 'w-8 h-2 bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'w-2 h-2 bg-slate-300 dark:bg-slate-600 hover:bg-emerald-300 dark:hover:bg-emerald-700'
              )}
            />
          ))}
        </div>
      )}
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
      <div className="flex -ml-4 md:-ml-6">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'pl-4 md:pl-6 shrink-0',
              isCompact
                ? 'basis-full sm:basis-1/2 lg:basis-1/3'
                : 'basis-full sm:basis-1/2 lg:basis-1/3'
            )}
          >
            <div className="min-w-[320px] max-w-[400px] h-full rounded-xl border border-white/20 overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
              <Skeleton className="h-52 w-full bg-gradient-to-br from-emerald-100/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/10" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
                <div className="space-y-2 pt-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex gap-2 pt-3">
                  <Skeleton className="h-10 flex-1 bg-emerald-100 dark:bg-emerald-950/30" />
                  <Skeleton className="h-10 w-12" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Skeleton dot indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              'rounded-full',
              i === 0 ? 'w-8 h-2' : 'w-2 h-2'
            )}
          />
        ))}
      </div>
    </div>
  );
}
