'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Star, BadgeCheck, ExternalLink, Pause, Play, ChevronLeft, ChevronRight, Gauge } from 'lucide-react';
import { ClinicImage } from '@/components/clinic/clinic-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFeaturedClinics, featuredToClinicWithDistance } from '@/hooks/use-featured-clinics';
import { cn } from '@/lib/utils';

type Speed = 'slow' | 'normal' | 'fast';

/**
 * Infinite Marquee Variant with interactive controls
 * Features: Continuous horizontal scroll, pause/play, speed control, drag to scroll
 */
export function MarqueeVariant() {
  const { clinics, isLoading } = useFeaturedClinics({ limit: 8, randomize: true });
  const clinicsWithDistance = clinics.map(featuredToClinicWithDistance);

  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<Speed>('normal');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Duplicate cards for seamless infinite scroll
  const duplicatedClinics = [...clinicsWithDistance, ...clinicsWithDistance, ...clinicsWithDistance];

  // Auto-scroll effect
  useEffect(() => {
    if (isPaused || isDragging || !containerRef.current) return;

    const animationId = requestAnimationFrame(function animate() {
      if (containerRef.current && !isPaused && !isDragging) {
        containerRef.current.scrollLeft += 1;
        // Reset position for infinite scroll
        if (contentRef.current &&
            containerRef.current.scrollLeft >= contentRef.current.scrollWidth / 3) {
          containerRef.current.scrollLeft = 0;
        }
      }
      requestAnimationFrame(animate);
    });

    return () => cancelAnimationFrame(animationId);
  }, [isPaused, isDragging, speed]);

  // Drag to scroll handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.pageX - (containerRef.current?.scrollLeft || 0));
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - dragStart;
    if (containerRef.current) {
      containerRef.current.scrollLeft = x;
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setIsPaused(false);
  }, []);

  // Keyboard navigation
  const handleScroll = useCallback((direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 300;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  if (isLoading) {
    return <MarqueeSkeleton />;
  }

  return (
    <div className="relative">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-indigo-500/10 dark:from-cyan-500/20 dark:via-blue-500/20 dark:to-indigo-500/20 rounded-3xl blur-3xl" />

      {/* Controls bar */}
      <div className="relative flex items-center justify-between mb-4 px-2">
        {/* Status indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex gap-0.5 transition-opacity',
              isPaused && 'opacity-50'
            )}>
              <div className="w-1 h-4 rounded-full bg-cyan-500 animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-4 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '100ms' }} />
              <div className="w-1 h-4 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: '200ms' }} />
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {isPaused ? 'Paused' : 'Auto-scrolling'}
            </span>
          </div>

          {/* Drag hint */}
          <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500">
            • Drag to scroll • Hover cards to pause
          </span>
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-2">
          {/* Speed control */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSpeed('slow')}
              className={cn(
                'h-7 px-2 text-xs',
                speed === 'slow' && 'bg-white dark:bg-slate-700 shadow-sm'
              )}
            >
              <Gauge className="h-3 w-3 mr-1" />
              Slow
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSpeed('normal')}
              className={cn(
                'h-7 px-2 text-xs',
                speed === 'normal' && 'bg-white dark:bg-slate-700 shadow-sm'
              )}
            >
              <Gauge className="h-3 w-3 mr-1" />
              Normal
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSpeed('fast')}
              className={cn(
                'h-7 px-2 text-xs',
                speed === 'fast' && 'bg-white dark:bg-slate-700 shadow-sm'
              )}
            >
              <Gauge className="h-3 w-3 mr-1" />
              Fast
            </Button>
          </div>

          {/* Play/Pause */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPaused(!isPaused)}
            className="h-9 px-3 gap-1.5 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">Play</span>
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                <span className="hidden sm:inline">Pause</span>
              </>
            )}
          </Button>

          {/* Navigation arrows */}
          <Button
            size="icon"
            variant="outline"
            onClick={() => handleScroll('left')}
            className="h-9 w-9 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => handleScroll('right')}
            className="h-9 w-9 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Marquee container with drag support */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto overflow-y-hidden rounded-2xl cursor-grab active:cursor-grabbing scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setIsPaused(true)}
      >
        <div
          ref={contentRef}
          className="flex gap-4 py-4"
          style={{ width: 'max-content' }}
        >
          {duplicatedClinics.map((clinic, index) => (
            <div key={`${clinic.id}-${index}`}>
              <MarqueeCard clinic={clinic} />
            </div>
          ))}
        </div>
      </div>

      {/* Fade edges */}
      <div className="absolute inset-y-8 left-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-slate-950 dark:via-slate-950/80 pointer-events-none rounded-l-3xl" />
      <div className="absolute inset-y-8 right-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-slate-950 dark:via-slate-950/80 pointer-events-none rounded-r-3xl" />
    </div>
  );
}

interface MarqueeCardProps {
  clinic: ReturnType<typeof featuredToClinicWithDistance>;
}

function MarqueeCard({ clinic }: MarqueeCardProps) {
  const isPremium = clinic.featuredTier === 'premium';
  return (
    <div className="relative shrink-0 w-72 group">
      {/* Card with gradient border effect */}
      <div className="relative h-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border-2 border-cyan-200/50 dark:border-cyan-800/30 shadow-lg shadow-cyan-500/10 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 hover:-translate-y-2 hover:scale-105">
        {/* Image section */}
        <div className="relative h-36 overflow-hidden">
          <ClinicImage
            src={clinic.photos[0]}
            alt={clinic.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="288px"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
            <div className="flex flex-wrap gap-1.5">
              {isPremium && (
                <Badge className="gap-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 shadow-md text-xs">
                  <Star className="h-3 w-3 fill-current" />
                  Premium
                </Badge>
              )}
              {clinic.isVerified && (
                <Badge className="gap-1 bg-blue-500/90 backdrop-blur-sm text-white border-0 text-xs">
                  <BadgeCheck className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
            {clinic.distanceFormatted && (
              <Badge className="bg-white/90 text-slate-700 dark:bg-slate-800/90 dark:text-slate-200 backdrop-blur-sm text-xs">
                {clinic.distanceFormatted}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-base leading-tight line-clamp-1 text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              {clinic.name}
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'h-3.5 w-3.5',
                      star <= Math.round(clinic.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-slate-300 text-slate-300 dark:fill-slate-600 dark:text-slate-600'
                    )}
                  />
                ))}
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{clinic.rating.toFixed(1)}</span>
              <span className="text-slate-500 dark:text-slate-400 text-xs">({clinic.reviewCount})</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-cyan-500" />
              <span className="line-clamp-1">{clinic.address.city}, {clinic.address.state}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <Phone className="h-3.5 w-3.5 shrink-0 text-cyan-500" />
              <span className="line-clamp-1">{clinic.phone}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              asChild
              size="sm"
              className={cn(
                'flex-1 text-white text-xs',
                'bg-gradient-to-r from-cyan-500 to-blue-500',
                'hover:from-cyan-600 hover:to-blue-600',
                'shadow-md shadow-cyan-500/20'
              )}
            >
              <Link href={`/pain-management/${clinic.slug}/`} className="gap-1">
                <ExternalLink className="h-3 w-3" />
                Details
              </Link>
            </Button>
            <Button
              size="icon"
              asChild
              className="h-8 w-8 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              <a href={`tel:${clinic.phone}`} aria-label={`Call ${clinic.name}`}>
                <Phone className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>

        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent" />
        </div>
      </div>
    </div>
  );
}

function MarqueeSkeleton() {
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="h-6 w-40 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          <div className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        </div>
      </div>
      <div className="relative overflow-hidden rounded-2xl py-4">
        <div className="flex gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shrink-0 w-72">
              <div className="h-full min-h-[340px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                <div className="h-36 bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-3/4" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <div className="h-8 flex-1 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
