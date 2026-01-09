'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import HomepageFeaturedSection - only loads when visible
const HomepageFeaturedSection = dynamic(
  () => import('./homepage-featured-section').then((mod) => mod.HomepageFeaturedSection),
  {
    ssr: false,
    loading: () => null, // We handle loading state ourselves
  }
);

interface LazyHomepageFeaturedSectionProps {
  className?: string;
  /** Distance from viewport to start loading (default: 200px) */
  rootMargin?: string;
}

/**
 * Lazy-loaded wrapper for HomepageFeaturedSection.
 * Defers loading the featured clinics hook and grid until near viewport.
 * This saves JavaScript on initial page load, improving PageSpeed scores.
 */
export function LazyHomepageFeaturedSection({
  className,
  rootMargin = '200px',
}: LazyHomepageFeaturedSectionProps) {
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
        <HomepageFeaturedSection {...(className && { className })} />
      ) : (
        // Placeholder matching the structure of HomepageFeaturedSection
        <section className={className}>
          <div className="pt-4 pb-12 bg-gradient-to-b from-emerald-50/80 via-teal-50/40 to-transparent dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-transparent min-h-[520px]">
            <div className="container mx-auto px-4">
              {/* Section header skeleton */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>

              {/* Decorative accent line */}
              <div className="flex items-center gap-2 mb-8 ml-[52px]">
                <div className="h-0.5 w-12 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" />
                <div className="h-0.5 w-6 bg-gradient-to-r from-teal-400 to-emerald-300 rounded-full" />
                <div className="h-0.5 w-2 bg-emerald-300 rounded-full" />
              </div>

              {/* Grid skeleton */}
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'min-w-[320px] flex flex-col rounded-xl border border-white/20 overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm',
                      // Hide 4th-6th items on mobile, 5th-6th on tablet
                      i > 3 && 'hidden sm:flex',
                      i > 4 && 'sm:hidden lg:flex'
                    )}
                  >
                    <Skeleton className="h-52 w-full rounded-none bg-gradient-to-br from-emerald-100/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/10" />
                    <div className="px-6 pt-6 pb-3 space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex-1 px-6 space-y-2.5">
                      <div className="flex items-start gap-2">
                        <Skeleton className="h-4 w-4 shrink-0 rounded" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 shrink-0 rounded" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                    <div className="flex gap-2 px-6 pb-6 pt-3">
                      <Skeleton className="h-10 flex-1 bg-emerald-100 dark:bg-emerald-950/30" />
                      <Skeleton className="h-10 w-10" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default LazyHomepageFeaturedSection;
