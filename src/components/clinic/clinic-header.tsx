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

/**
 * Get current time in the clinic's timezone.
 */
function getCurrentTimeInTimezone(timezone?: string | null): { dayIndex: number; hours: number; minutes: number } {
  const now = new Date();

  if (!timezone) {
    return { dayIndex: now.getDay(), hours: now.getHours(), minutes: now.getMinutes() };
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const weekdayPart = parts.find((p) => p.type === "weekday")?.value ?? "";
    const hourPart = parts.find((p) => p.type === "hour")?.value ?? "0";
    const minutePart = parts.find((p) => p.type === "minute")?.value ?? "0";

    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return {
      dayIndex: dayMap[weekdayPart] ?? now.getDay(),
      hours: parseInt(hourPart, 10),
      minutes: parseInt(minutePart, 10),
    };
  } catch {
    return { dayIndex: now.getDay(), hours: now.getHours(), minutes: now.getMinutes() };
  }
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
  const { dayIndex: currentDayIndex, hours: currentHours, minutes } = getCurrentTimeInTimezone(clinic.timezone);
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

  const currentTime = currentHours * 100 + minutes;
  const openTime = parseInt(dayHours.open.replace(':', ''), 10);
  const closeTime = parseInt(dayHours.close.replace(':', ''), 10);

  // Handle overnight hours (e.g., 9:30 AM - 1:00 AM where close < open)
  if (closeTime < openTime) {
    // Overnight: open if current time >= open OR current time < close
    if (currentTime >= openTime || currentTime < closeTime) {
      return { isOpen: true, statusText: `Open until ${formatTime(dayHours.close)}` };
    }
    // Before opening time
    return { isOpen: false, statusText: `Opens at ${formatTime(dayHours.open)}` };
  }

  // Normal hours
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
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/30",
              isOpen
                ? "bg-green-600 dark:bg-green-800/50"
                : "bg-red-600 dark:bg-red-800/50"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full flex-shrink-0",
                isOpen ? "bg-green-300 dark:bg-green-400" : "bg-red-300 dark:bg-red-400"
              )}
            />
            <span className="text-xs font-medium text-white">
              {isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
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
