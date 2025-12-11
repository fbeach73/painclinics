'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DAY_ORDER, DAY_LABELS, getCurrentDay } from '@/lib/day-constants';
import { formatTime, isCurrentlyOpen } from '@/lib/time-utils';
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
  const { isOpen, statusText } = isCurrentlyOpen(hours);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Hours of Operation</CardTitle>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full flex-shrink-0",
                isOpen ? "bg-green-500" : "bg-red-500"
              )}
            />
            <span
              className={cn(
                "text-sm font-medium",
                isOpen ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}
            >
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
