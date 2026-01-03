import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ClinicWithDistance } from '@/types/clinic';
import type { ClinicService } from '@/types/service';
import { FeaturedBadge, type FeaturedTier } from './featured-badge';
import { ServiceIcons, DynamicServiceIcons } from './service-icons';
import { StarRating } from './star-rating';

interface ClinicCardProps {
  clinic: ClinicWithDistance;
  /** Database-driven clinic services (if available, takes precedence) */
  clinicServices?: ClinicService[];
  /** Card variant: default for compact list view, featured for highlighted display */
  variant?: 'default' | 'featured';
  className?: string;
}

export function ClinicCard({ clinic, clinicServices, variant = 'default', className }: ClinicCardProps) {
  // Use database services if provided, otherwise fall back to legacy services
  const hasDatabaseServices = clinicServices && clinicServices.length > 0;
  const isVariantFeatured = variant === 'featured';

  // Clinic's actual featured status from database
  const isFeaturedClinic = clinic.isFeatured;
  const featuredTier = (clinic.featuredTier || 'none') as FeaturedTier;
  const isPremiumClinic = featuredTier === 'premium';

  return (
    <Card
      className={cn(
        'flex flex-col h-full relative',
        isVariantFeatured && 'overflow-hidden',
        // Featured clinic styling - gold border and subtle background
        isFeaturedClinic && 'border-2 border-yellow-400 dark:border-yellow-500',
        isPremiumClinic && 'bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/20 dark:to-background shadow-lg shadow-amber-500/10',
        isFeaturedClinic && !isPremiumClinic && 'bg-yellow-50/30 dark:bg-yellow-950/10',
        className
      )}
    >
      {/* Image - featured variant only */}
      {isVariantFeatured && (
        <div className="relative h-48 bg-muted overflow-hidden">
          <Image
            src={clinic.photos[0] || '/images/clinic-placeholder.webp'}
            alt={clinic.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <FeaturedBadge tier={featuredTier} size="sm" />
            <Badge variant="secondary">{clinic.distanceFormatted}</Badge>
          </div>
          {clinic.isVerified && (
            <div className="absolute top-3 right-3">
              <Badge variant="default" className="gap-1">
                <BadgeCheck className="h-3 w-3" />
                Verified
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Featured badge for default variant */}
      {!isVariantFeatured && isFeaturedClinic && (
        <div className="absolute top-3 right-3 z-10">
          <FeaturedBadge tier={featuredTier} size="sm" />
        </div>
      )}

      <CardHeader className={isVariantFeatured ? 'pb-2' : 'pb-3'}>
        {isVariantFeatured ? (
          <div className="space-y-2">
            <h3 className="font-semibold text-xl leading-tight line-clamp-2">
              {clinic.name}
            </h3>
            <StarRating rating={clinic.rating} reviewCount={clinic.reviewCount} variant="featured" />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                {clinic.name}
              </h3>
              <StarRating rating={clinic.rating} reviewCount={clinic.reviewCount} />
            </div>
            <Badge variant="secondary" className="shrink-0">
              {clinic.distanceFormatted}
            </Badge>
          </div>
        )}
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

        {/* About section - featured variant only */}
        {isVariantFeatured && clinic.about && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {clinic.about}
          </p>
        )}

        <div className="pt-2">
          {hasDatabaseServices ? (
            <DynamicServiceIcons
              services={clinicServices}
              max={isVariantFeatured ? 5 : 4}
              size={isVariantFeatured ? 'md' : 'sm'}
            />
          ) : (
            <ServiceIcons
              services={clinic.services}
              max={isVariantFeatured ? 5 : 4}
              size={isVariantFeatured ? 'md' : 'sm'}
            />
          )}
        </div>
      </CardContent>

      <CardFooter className={isVariantFeatured ? 'gap-2' : undefined}>
        <Button asChild className={isVariantFeatured ? 'flex-1' : 'w-full'}>
          <Link href={`/pain-management/${clinic.slug}/`}>View Details</Link>
        </Button>
        {isVariantFeatured && (
          <Button variant="outline" asChild>
            <a href={`tel:${clinic.phone}`}>Call</a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
