import Link from 'next/link';
import { Star, MapPin, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ClinicWithDistance } from '@/types/clinic';
import { ServiceIcons } from './service-icons';

interface ClinicCardProps {
  clinic: ClinicWithDistance;
  className?: string;
}

function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      <span className="font-medium">{rating.toFixed(1)}</span>
      <span className="text-muted-foreground text-sm">({reviewCount})</span>
    </div>
  );
}

export function ClinicCard({ clinic, className }: ClinicCardProps) {
  return (
    <Card className={cn('flex flex-col h-full', className)}>
      <CardHeader className="pb-3">
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

        <div className="pt-2">
          <ServiceIcons services={clinic.services} max={4} size="sm" />
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/clinics/${clinic.slug}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
