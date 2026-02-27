'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Star, BadgeCheck, ExternalLink } from 'lucide-react';
import { ClinicImage } from '@/components/clinic/clinic-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFeaturedClinics, featuredToClinicWithDistance } from '@/hooks/use-featured-clinics';
import { cn } from '@/lib/utils';

/**
 * Holographic Glass Variant
 * Features: Animated gradient borders, 3D perspective hover, iridescent effects
 */

export function HolographicVariant() {
  const { clinics, isLoading } = useFeaturedClinics({ limit: 6, randomize: true });
  const clinicsWithDistance = clinics.map(featuredToClinicWithDistance);

  if (isLoading) {
    return <HolographicSkeleton />;
  }

  return (
    <div className="relative">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 dark:from-purple-500/20 dark:via-pink-500/20 dark:to-cyan-500/20 rounded-3xl blur-3xl" />

      <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
        {clinicsWithDistance.map((clinic) => (
          <HolographicCard key={clinic.id} clinic={clinic} />
        ))}
      </div>
    </div>
  );
}

function HolographicCard({ clinic }: { clinic: ReturnType<typeof featuredToClinicWithDistance> }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const isPremium = clinic.featuredTier === 'premium';
  return (
    <div
      className="group relative"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated gradient border using pseudo-element */}
      <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-75 blur-sm transition-opacity duration-500 group-hover:opacity-100 animate-gradient-xy" />

      {/* Main card */}
      <div
        className={cn(
          'relative h-full rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl',
          'transition-transform duration-500 ease-out',
          'transform-gpu',
          isHovered && 'scale-[1.02]'
        )}
        style={{
          transform: isHovered
            ? `perspective(1000px) rotateX(${(mousePosition.y - 50) * 0.1}deg) rotateY(${(mousePosition.x - 50) * -0.1}deg) scale(1.02)`
            : 'perspective(1000px) rotateX(0) rotateY(0) scale(1)',
        }}
      >
        {/* Shimmer effect overlay */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.15) 0%, transparent 50%)`,
          }}
        />

        {/* Image with holographic overlay */}
        <div className="relative h-48 overflow-hidden rounded-t-2xl">
          <ClinicImage
            src={clinic.photos[0]}
            alt={clinic.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          />

          {/* Gradient overlay with iridescent effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

          {/* Floating badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {isPremium && (
              <Badge className="gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg">
                <Star className="h-3 w-3 fill-current" />
                Premium
              </Badge>
            )}
            {clinic.distanceFormatted && (
              <Badge className="bg-white/90 text-slate-700 dark:bg-slate-800/90 dark:text-slate-200 backdrop-blur-md">
                {clinic.distanceFormatted}
              </Badge>
            )}
          </div>

          {/* Verified badge - top right */}
          {clinic.isVerified && (
            <div className="absolute top-3 right-3">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/90 backdrop-blur-md text-white text-xs font-medium shadow-lg">
                <BadgeCheck className="h-3 w-3" />
                Verified
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 text-slate-900 dark:text-slate-100 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all duration-300">
              {clinic.name}
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'h-4 w-4',
                      star <= Math.round(clinic.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-slate-300 text-slate-300 dark:fill-slate-600 dark:text-slate-600'
                    )}
                  />
                ))}
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{clinic.rating.toFixed(1)}</span>
              <span className="text-slate-500 dark:text-slate-400 text-sm">({clinic.reviewCount})</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-purple-500" />
              <span className="line-clamp-2">{clinic.address.formatted}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Phone className="h-4 w-4 shrink-0 text-purple-500" />
              <span>{clinic.phone}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              asChild
              className={cn(
                'flex-1 text-white shadow-lg transition-all duration-300',
                'bg-gradient-to-r from-purple-500 to-pink-500',
                'hover:from-purple-600 hover:to-pink-600',
                'hover:shadow-purple-500/25'
              )}
            >
              <Link href={`/pain-management/${clinic.slug}/`} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Details
              </Link>
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
  );
}

function HolographicSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="relative">
          <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 blur-sm opacity-50 animate-pulse" />
          <div className="relative h-full min-h-[420px] rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-5 space-y-4">
            <div className="h-48 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            </div>
            <div className="flex gap-2 pt-2">
              <div className="h-10 flex-1 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
