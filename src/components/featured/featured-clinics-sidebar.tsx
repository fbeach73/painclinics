'use client';

import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useFeaturedClinics,
  featuredToClinicWithDistance,
} from '@/hooks/use-featured-clinics';
import { cn } from '@/lib/utils';
import { FeaturedSidebarCard } from './featured-sidebar-card';

interface FeaturedClinicsSidebarProps {
  currentClinicId: string;
  stateAbbrev: string;
  city?: string;
  className?: string;
}

/**
 * Sidebar widget showing other featured clinics.
 * Excludes the current clinic and shows context-aware results.
 * Uses geo-location when available for sorting by distance.
 */
export function FeaturedClinicsSidebar({
  currentClinicId,
  stateAbbrev,
  city,
  className,
}: FeaturedClinicsSidebarProps) {
  const { clinics, isLoading } = useFeaturedClinics({
    stateAbbrev,
    ...(city ? { city } : {}),
    excludeClinicId: currentClinicId,
    limit: 5,
    useGeolocation: true,
    radiusMiles: 100,
    randomize: true,
  });

  // Convert to ClinicWithDistance for component compatibility
  const clinicsWithDistance = clinics.map(featuredToClinicWithDistance);

  // Don't render if no featured clinics and not loading
  if (!isLoading && clinicsWithDistance.length === 0) {
    return null;
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          Other Featured Clinics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <FeaturedClinicsSidebarSkeleton />
        ) : (
          clinicsWithDistance.map((clinic) => (
            <FeaturedSidebarCard key={clinic.id} clinic={clinic} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for sidebar featured clinics.
 */
function FeaturedClinicsSidebarSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3 p-3 border rounded-lg">
          <Skeleton className="h-20 w-20 rounded-md shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </>
  );
}

export { FeaturedClinicsSidebarSkeleton };
