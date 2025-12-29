'use client';

import { BadgeCheck, MapPin, Phone, Navigation, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { type DayName, WEEKDAY_INDEX_TO_NAME, DAY_LABELS } from '@/lib/day-constants';
import { buildGoogleMapsDirectionsUrl } from '@/lib/maps-utils';
import { formatTime } from '@/lib/time-utils';
import { getStateName } from '@/lib/us-states';
import { cn } from '@/lib/utils';
import type { Clinic } from '@/types/clinic';
import { ClaimListingButton } from './claim-listing-button';
import { FeaturedBadge, type FeaturedTier } from './featured-badge';
import { StarRating } from './star-rating';

interface ClinicHeaderProps {
  clinic: Clinic;
  className?: string;
}

function getNextOpenDay(clinic: Clinic, startDayIndex: number): { dayName: DayName; daysAway: number } | null {
  // Check up to 7 days ahead
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (startDayIndex + i) % 7;
    const nextDayName = WEEKDAY_INDEX_TO_NAME[nextDayIndex] as DayName;
    const nextDayHours = clinic.hours[nextDayName];

    if (!nextDayHours.closed) {
      return { dayName: nextDayName, daysAway: i };
    }
  }
  return null;
}

function isCurrentlyOpen(clinic: Clinic): { isOpen: boolean; statusText: string } {
  const now = new Date();
  const currentDayIndex = now.getDay();
  const currentDay = WEEKDAY_INDEX_TO_NAME[currentDayIndex] as DayName;
  const dayHours = clinic.hours[currentDay];

  if (dayHours.closed) {
    // Find next open day
    const nextOpen = getNextOpenDay(clinic, currentDayIndex);
    if (nextOpen) {
      const nextDayHours = clinic.hours[nextOpen.dayName];
      if (nextOpen.daysAway === 1) {
        return { isOpen: false, statusText: `Re-opens tomorrow at ${formatTime(nextDayHours.open)}` };
      }
      return { isOpen: false, statusText: `Re-opens ${DAY_LABELS[nextOpen.dayName]} at ${formatTime(nextDayHours.open)}` };
    }
    return { isOpen: false, statusText: 'Closed' };
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

  // Closed after hours - find next open day
  const nextOpen = getNextOpenDay(clinic, currentDayIndex);
  if (nextOpen) {
    const nextDayHours = clinic.hours[nextOpen.dayName];
    if (nextOpen.daysAway === 1) {
      return { isOpen: false, statusText: `Re-opens tomorrow at ${formatTime(nextDayHours.open)}` };
    }
    return { isOpen: false, statusText: `Re-opens ${DAY_LABELS[nextOpen.dayName]} at ${formatTime(nextDayHours.open)}` };
  }

  return { isOpen: false, statusText: '' };
}

export function ClinicHeader({ clinic, className }: ClinicHeaderProps) {
  const { data: session } = useSession();
  const { isOpen, statusText } = isCurrentlyOpen(clinic);
  const googleMapsUrl = buildGoogleMapsDirectionsUrl(clinic.address.formatted);

  const currentUserId = session?.user?.id || null;
  const isOwned = !!clinic.ownerUserId;
  const isOwnedByCurrentUser = !!(currentUserId && clinic.ownerUserId === currentUserId);
  const featuredTier = (clinic.featuredTier || 'none') as FeaturedTier;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Title and badges */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="text-3xl font-bold tracking-tight">
            {clinic.name} - Pain Management in {clinic.address.city}, {getStateName(clinic.address.state)}
          </h1>
          <FeaturedBadge tier={featuredTier} size="md" className="mt-1" />
          {clinic.isVerified && (
            <Badge className="gap-1 mt-1">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified
            </Badge>
          )}
          <ClaimListingButton
            clinicId={clinic.id}
            clinicName={clinic.name}
            isOwned={isOwned}
            isOwnedByCurrentUser={isOwnedByCurrentUser}
            className="mt-1"
          />
        </div>
        <StarRating rating={clinic.rating} reviewCount={clinic.reviewCount} variant="full" />
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
