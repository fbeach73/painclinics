'use client';

import { Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DAY_ORDER, DAY_LABELS, getCurrentDay } from '@/lib/day-constants';
import { formatTime, isCurrentlyOpen } from '@/lib/time-utils';
import { cn } from '@/lib/utils';
import type { OperatingHours, DayHours } from '@/types/clinic';

interface ClinicHoursProps {
  hours: OperatingHours;
  timezone?: string | null | undefined;
  className?: string;
}

function formatHours(dayHours: DayHours): string {
  if (dayHours.closed) {
    return 'Closed';
  }
  // Check if this is a 24-hour day (open: "00:00", close: "23:59")
  if (dayHours.open === '00:00' && dayHours.close === '23:59') {
    return 'Open 24 Hours';
  }
  return `${formatTime(dayHours.open)} - ${formatTime(dayHours.close)}`;
}

/**
 * Check if hours data is actually available (not all days closed with empty times).
 * When no hours data exists in the database, all days default to closed with empty open/close times.
 */
function hasHoursData(hours: OperatingHours): boolean {
  return DAY_ORDER.some((day) => {
    const dayHours = hours[day];
    // If any day has actual times or is explicitly open, we have data
    return !dayHours.closed || (dayHours.open && dayHours.open !== '') || (dayHours.close && dayHours.close !== '');
  });
}

export function ClinicHours({ hours, timezone, className }: ClinicHoursProps) {
  const currentDay = getCurrentDay();
  const hasData = hasHoursData(hours);
  const { isOpen, statusText } = isCurrentlyOpen(hours, timezone);

  // If no hours data available, show a simpler card
  if (!hasData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Hours of Operation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium">Hours not available</p>
            <p className="text-sm text-muted-foreground/80 mt-1">
              Please call the clinic for current hours
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Hours of Operation</CardTitle>
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/30",
              isOpen
                ? "bg-green-600 dark:bg-green-800/50"
                : "bg-red-600 dark:bg-red-800/50"
            )}
          >
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full flex-shrink-0",
                isOpen ? "bg-green-300 dark:bg-green-400" : "bg-red-300 dark:bg-red-400"
              )}
            />
            <span className="text-sm font-medium text-white">
              {isOpen ? "Open" : "Closed"}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{statusText}</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {DAY_ORDER.map((day) => {
            const dayHours = hours[day];
            const isToday = day === currentDay;
            const isClosed = dayHours.closed;

            return (
              <li
                key={day}
                className={cn(
                  'flex justify-between items-center py-2 px-3 rounded-md',
                  isToday && 'bg-muted font-medium'
                )}
              >
                <span className={cn(isToday && 'text-primary')}>
                  {DAY_LABELS[day]}
                  {isToday && (
                    <span className="ml-2 text-xs text-primary font-normal">(Today)</span>
                  )}
                </span>
                <span className={cn(isClosed && 'text-muted-foreground')}>
                  {formatHours(dayHours)}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
