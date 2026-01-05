import Image from 'next/image';
import Link from 'next/link';
import { MapPin, ImageIcon, BadgeCheck } from 'lucide-react';
import { FeaturedBadge, type FeaturedTier } from '@/components/clinic/featured-badge';
import { StarRating } from '@/components/clinic/star-rating';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ClinicWithDistance } from '@/types/clinic';

interface FeaturedSidebarCardProps {
  clinic: ClinicWithDistance;
  className?: string;
}

/**
 * Compact featured clinic card for sidebar display.
 * Smaller variant optimized for vertical stacking in sidebars.
 */
export function FeaturedSidebarCard({ clinic, className }: FeaturedSidebarCardProps) {
  const featuredTier = (clinic.featuredTier || 'basic') as FeaturedTier;
  const isPremium = featuredTier === 'premium';
  const hasPhoto = clinic.photos && clinic.photos.length > 0;

  return (
    <Link href={`/pain-management/${clinic.slug}/`} className="block group">
      <Card
        className={cn(
          'overflow-hidden transition-all duration-200',
          'border border-featured-border',
          'hover:shadow-md hover:border-featured-foreground',
          isPremium
            ? 'bg-featured'
            : 'bg-featured/50',
          className
        )}
      >
        <div className="flex gap-3 p-3">
          {/* Thumbnail */}
          <div className="relative h-20 w-20 shrink-0 rounded-md overflow-hidden bg-muted">
            {hasPhoto && clinic.photos[0] ? (
              <Image
                src={clinic.photos[0]}
                alt={clinic.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="80px"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
              </div>
            )}
            {/* Featured badge overlay */}
            <div className="absolute bottom-1 left-1">
              <FeaturedBadge tier={featuredTier} size="sm" />
            </div>
          </div>

          {/* Content */}
          <CardContent className="flex-1 p-0 min-w-0">
            <div className="space-y-1.5">
              {/* Name and verified badge */}
              <div className="flex items-start gap-1.5">
                <h4 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {clinic.name}
                </h4>
                {clinic.isVerified && (
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                )}
              </div>

              {/* Rating */}
              <StarRating rating={clinic.rating} reviewCount={clinic.reviewCount} variant="compact" />

              {/* Location and distance */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {clinic.address.city}, {clinic.address.state}
                </span>
                {clinic.distanceFormatted && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-auto shrink-0">
                    {clinic.distanceFormatted}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}
