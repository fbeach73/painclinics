'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DAY_ORDER, DAY_LABELS, getCurrentDay } from '@/lib/day-constants';
import { formatTime } from '@/lib/time-utils';
import { cn } from '@/lib/utils';
import type { OperatingHours, DayHours } from '@/types/clinic';

interface ClinicHoursProps {
  hours: OperatingHours;
  className?: string;
}

function formatHours(dayHours: DayHours): string {
  if (dayHours.closed) {
    return 'Closed';
  }
  return `${formatTime(dayHours.open)} - ${formatTime(dayHours.close)}`;
}

export function ClinicHours({ hours, className }: ClinicHoursProps) {
  const currentDay = getCurrentDay();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Hours of Operation</CardTitle>
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
