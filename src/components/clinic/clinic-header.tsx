'use client';

import { Star, BadgeCheck, MapPin, Phone, Navigation, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Clinic } from '@/types/clinic';

interface ClinicHeaderProps {
  clinic: Clinic;
  className?: string;
}

function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-5 w-5',
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted'
            )}
          />
        ))}
      </div>
      <span className="text-lg font-semibold">{rating.toFixed(1)}</span>
      <span className="text-muted-foreground">({reviewCount} reviews)</span>
    </div>
  );
}

type DayName = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

function isCurrentlyOpen(clinic: Clinic): { isOpen: boolean; statusText: string } {
  const now = new Date();
  const dayNames: DayName[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()] as DayName;
  const dayHours = clinic.hours[currentDay];

  if (dayHours.closed) {
    return { isOpen: false, statusText: 'Closed today' };
  }

  const currentTime = now.getHours() * 100 + now.getMinutes();
  const openTime = parseInt(dayHours.open.replace(':', ''), 10);
  const closeTime = parseInt(dayHours.close.replace(':', ''), 10);

  if (currentTime >= openTime && currentTime < closeTime) {
    return { isOpen: true, statusText: `Open until ${formatTime(dayHours.close)}` };
  }

  if (currentTime < openTime) {
    return { isOpen: false, statusText: `Opens at ${formatTime(dayHours.open)}` };
  }

  return { isOpen: false, statusText: 'Closed' };
}

function formatTime(time: string): string {
  const parts = time.split(':');
  const hours = parseInt(parts[0] ?? '0', 10);
  const minutes = parseInt(parts[1] ?? '0', 10);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function ClinicHeader({ clinic, className }: ClinicHeaderProps) {
  const { isOpen, statusText } = isCurrentlyOpen(clinic);
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clinic.address.formatted)}`;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Title and badges */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight">{clinic.name}</h1>
          {clinic.isVerified && (
            <Badge className="gap-1 mt-1">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified
            </Badge>
          )}
        </div>
        <StarRating rating={clinic.rating} reviewCount={clinic.reviewCount} />
      </div>

      {/* Contact info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{clinic.address.formatted}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-4 w-4 shrink-0" />
          <a href={`tel:${clinic.phone}`} className="hover:text-foreground transition-colors">
            {clinic.phone}
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Badge variant={isOpen ? 'default' : 'secondary'}>
            {isOpen ? 'Open' : 'Closed'}
          </Badge>
          <span className="text-sm text-muted-foreground">{statusText}</span>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <a href={`tel:${clinic.phone}`}>
            <Phone className="h-4 w-4" />
            Call Now
          </a>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
            <Navigation className="h-4 w-4" />
            Get Directions
          </a>
        </Button>
      </div>
    </div>
  );
}
