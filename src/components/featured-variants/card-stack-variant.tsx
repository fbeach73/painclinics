'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, Star, BadgeCheck, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useFeaturedClinics, featuredToClinicWithDistance } from '@/hooks/use-featured-clinics';
import { StarRating } from '@/components/clinic/star-rating';

/**
 * Card Stack Deck Variant
 * Features: Overlapping cards, staggered expand/collapse, accordion-style reveal
 */

export function CardStackVariant() {
  const { clinics, isLoading } = useFeaturedClinics({ limit: 6, randomize: true });
  const clinicsWithDistance = clinics.map(featuredToClinicWithDistance);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (isLoading) {
    return <CardStackSkeleton />;
  }

  return (
    <div className="relative">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-rose-500/5 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-rose-500/10 rounded-3xl blur-2xl" />

      <div className="relative space-y-4">
        {clinicsWithDistance.map((clinic, index) => (
          <StackCard
            key={clinic.id}
            clinic={clinic}
            index={index}
            isExpanded={expandedIndex === index}
            onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
            totalCount={clinicsWithDistance.length}
          />
        ))}
      </div>
    </div>
  );
}

interface StackCardProps {
  clinic: ReturnType<typeof featuredToClinicWithDistance>;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  totalCount: number;
}

function StackCard({ clinic, index, isExpanded, onToggle, totalCount }: StackCardProps) {
  const isPremium = clinic.featuredTier === 'premium';
  const hasPhoto = clinic.photos && clinic.photos.length > 0;

  // Calculate stacking offset for collapsed state
  const stackOffset = Math.min(index * 8, 40);
  const zIndex = totalCount - index;

  return (
    <div
      className={cn(
        'relative transition-all duration-500 ease-out',
        isExpanded ? 'mb-8' : ''
      )}
      style={{
        transform: isExpanded ? 'translateY(0)' : `translateY(-${stackOffset}px)`,
        zIndex: isExpanded ? totalCount : zIndex,
      }}
    >
      {/* Card container */}
      <div
        className={cn(
          'relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden',
          'border-2 border-amber-200/50 dark:border-amber-800/30',
          'shadow-lg shadow-amber-500/10',
          'transition-all duration-500 ease-out',
          !isExpanded && 'hover:shadow-xl hover:shadow-amber-500/15 hover:-translate-y-1'
        )}
      >
        {/* Expandable header - always visible */}
        <div className="flex items-stretch">
          {/* Thumbnail */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 shrink-0">
            <Image
              src={hasPhoto && clinic.photos[0] ? clinic.photos[0] : '/images/clinic-placeholder.webp'}
              alt={clinic.name}
              fill
              className="object-cover"
              sizes="160px"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />

            {/* Premium badge */}
            {isPremium && (
              <div className="absolute top-2 left-2">
                <Badge className="gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-md text-xs">
                  <Star className="h-3 w-3 fill-current" />
                  Premium
                </Badge>
              </div>
            )}
          </div>

          {/* Info section */}
          <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-base sm:text-lg text-slate-900 dark:text-slate-100 line-clamp-1">
                  {clinic.name}
                </h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  {clinic.isVerified && (
                    <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />
                  )}
                  <StarRating rating={clinic.rating} reviewCount={clinic.reviewCount} variant="compact" />
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span className="line-clamp-1">{clinic.address.city}, {clinic.address.state}</span>
                {clinic.distanceFormatted && (
                  <>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      {clinic.distanceFormatted}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Phone className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span className="text-xs sm:text-sm">{clinic.phone}</span>
              </div>

              {/* Expand/collapse button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30 h-8 px-2"
              >
                {isExpanded ? (
                  <>
                    <span className="text-xs">Show Less</span>
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span className="text-xs">View Details</span>
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick action buttons - always visible on right */}
          <div className="hidden sm:flex flex-col items-center justify-center gap-2 p-3 border-l border-slate-200 dark:border-slate-700">
            <Button
              size="icon"
              asChild
              className="h-9 w-9 bg-amber-500 hover:bg-amber-600 text-white shadow-md"
            >
              <a href={`tel:${clinic.phone}`} aria-label={`Call ${clinic.name}`}>
                <Phone className="h-4 w-4" />
              </a>
            </Button>
            <Button
              size="icon"
              asChild
              className="h-9 w-9 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white"
            >
              <Link href={`/pain-management/${clinic.slug}/`} aria-label={`View ${clinic.name} details`}>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Expandable content */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-500 ease-out',
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="p-4 pt-0 sm:pt-4 sm:p-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
            {/* Full address */}
            <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <span>{clinic.address.formatted}</span>
            </div>

            {/* About section */}
            {clinic.about && (
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                {clinic.about}
              </p>
            )}

            {/* Mobile action buttons */}
            <div className="flex sm:hidden gap-2 pt-2">
              <Button
                asChild
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Link href={`/pain-management/${clinic.slug}/`}>View Details</Link>
              </Button>
              <Button
                size="icon"
                asChild
                className="bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                <a href={`tel:${clinic.phone}`} aria-label={`Call ${clinic.name}`}>
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardStackSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700"
          style={{ transform: `translateY(-${Math.min(i * 8, 40)}px)` }}
        >
          <div className="flex items-stretch h-32 sm:h-40">
            <div className="w-32 h-32 sm:w-40 sm:h-40 shrink-0 bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-1/2" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-32" />
                <div className="h-8 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-center justify-center gap-2 p-3 border-l border-slate-200 dark:border-slate-700">
              <div className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
