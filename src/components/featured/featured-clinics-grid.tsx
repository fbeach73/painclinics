'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ClinicWithDistance } from '@/types/clinic';
import { FeaturedClinicCard } from './featured-clinic-card';

interface FeaturedClinicsGridProps {
  clinics: ClinicWithDistance[];
  /** Maximum number of clinics to display (default: 6) */
  maxClinics?: number;
  className?: string;
}

/**
 * Simple responsive grid for featured clinics.
 * No carousel, no JavaScript libraries - just CSS grid.
 * Shows 1 column on mobile, 2 on tablet, 3 on desktop.
 */
export function FeaturedClinicsGrid({
  clinics,
  maxClinics = 6,
  className,
}: FeaturedClinicsGridProps) {
  const displayClinics = clinics.slice(0, maxClinics);

  if (displayClinics.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'grid gap-6',
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {displayClinics.map((clinic) => (
        <FeaturedClinicCard key={clinic.id} clinic={clinic} className="h-full" />
      ))}
    </div>
  );
}

export function FeaturedClinicsGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-6',
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="min-w-[320px] flex flex-col rounded-xl border border-white/20 overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm"
        >
          {/* Image section */}
          <Skeleton className="h-52 w-full rounded-none bg-gradient-to-br from-emerald-100/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/10" />
          {/* CardHeader */}
          <div className="px-6 pt-6 pb-3 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-24" />
          </div>
          {/* CardContent */}
          <div className="flex-1 px-6 space-y-2.5">
            <div className="flex items-start gap-2">
              <Skeleton className="h-4 w-4 shrink-0 rounded" />
              <Skeleton className="h-4 flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 shrink-0 rounded" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-full" />
          </div>
          {/* CardFooter */}
          <div className="flex gap-2 px-6 pb-6 pt-3">
            <Skeleton className="h-10 flex-1 bg-emerald-100 dark:bg-emerald-950/30" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}
