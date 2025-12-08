import Link from 'next/link';
import { Star, MapPin, Phone, ImageIcon, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ClinicWithDistance } from '@/types/clinic';
import { ServiceIcons } from './service-icons';

interface ClinicCardFeaturedProps {
  clinic: ClinicWithDistance;
  className?: string;
}

function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-4 w-4',
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted'
            )}
          />
        ))}
      </div>
      <span className="font-medium">{rating.toFixed(1)}</span>
      <span className="text-muted-foreground text-sm">({reviewCount} reviews)</span>
    </div>
  );
}

export function ClinicCardFeatured({ clinic, className }: ClinicCardFeaturedProps) {
  return (
    <Card className={cn('flex flex-col h-full overflow-hidden', className)}>
      {/* Image placeholder */}
      <div className="relative h-48 bg-muted flex items-center justify-center">
        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
        <div className="absolute top-3 left-3 flex gap-2">
          {clinic.isFeatured && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              Featured
            </Badge>
          )}
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

      <CardHeader className="pb-2">
        <div className="space-y-2">
          <h3 className="font-semibold text-xl leading-tight line-clamp-2">
            {clinic.name}
          </h3>
          <StarRating rating={clinic.rating} reviewCount={clinic.reviewCount} />
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

        <p className="text-sm text-muted-foreground line-clamp-2">
          {clinic.about}
        </p>

        <div className="pt-2">
          <ServiceIcons services={clinic.services} max={5} size="md" />
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button asChild className="flex-1">
          <Link href={`/clinics/${clinic.slug}`}>View Details</Link>
        </Button>
        <Button variant="outline" asChild>
          <a href={`tel:${clinic.phone}`}>Call</a>
        </Button>
      </CardFooter>
    </Card>
  );
}
