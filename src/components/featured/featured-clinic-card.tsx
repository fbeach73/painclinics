import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, ImageIcon, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ClinicWithDistance } from '@/types/clinic';
import { FeaturedBadge, type FeaturedTier } from '@/components/clinic/featured-badge';
import { StarRating } from '@/components/clinic/star-rating';

interface FeaturedClinicCardProps {
  clinic: ClinicWithDistance;
  className?: string;
}

export function FeaturedClinicCard({ clinic, className }: FeaturedClinicCardProps) {
  const featuredTier = (clinic.featuredTier || 'basic') as FeaturedTier;
  const isPremium = featuredTier === 'premium';
  const hasPhoto = clinic.photos && clinic.photos.length > 0;

  return (
    <Card
      className={cn(
        'flex flex-col h-full overflow-hidden',
        'min-w-[320px] max-w-[400px]',
        'border-2 border-yellow-400 dark:border-yellow-500',
        isPremium
          ? 'bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/20 dark:to-background shadow-lg shadow-amber-500/10'
          : 'bg-yellow-50/30 dark:bg-yellow-950/10',
        className
      )}
    >
      {/* Image section */}
      <div className="relative h-48 bg-muted">
        {hasPhoto && clinic.photos[0] ? (
          <Image
            src={clinic.photos[0]}
            alt={clinic.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}

        {/* Top-left badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <FeaturedBadge tier={featuredTier} size="sm" animated />
          {clinic.distanceFormatted && (
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
              {clinic.distanceFormatted}
            </Badge>
          )}
        </div>

        {/* Top-right verified badge */}
        {clinic.isVerified && (
          <div className="absolute top-3 right-3">
            <Badge variant="default" className="gap-1 bg-background/90 backdrop-blur-sm text-foreground">
              <BadgeCheck className="h-3 w-3" />
              Verified
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="space-y-2">
          <h3 className="font-semibold text-xl leading-tight line-clamp-2">
            {clinic.name}
          </h3>
          <StarRating rating={clinic.rating} reviewCount={clinic.reviewCount} variant="featured" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{clinic.address.formatted}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4 shrink-0" />
          <span>{clinic.phone}</span>
        </div>

        {clinic.about && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {clinic.about}
          </p>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button asChild className="flex-1">
          <Link href={`/pain-management/${clinic.slug}/`}>View Details</Link>
        </Button>
        <Button variant="outline" asChild>
          <a href={`tel:${clinic.phone}`}>Call</a>
        </Button>
      </CardFooter>
    </Card>
  );
}
