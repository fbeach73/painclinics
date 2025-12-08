'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { OperatingHours, DayHours } from '@/types/clinic';

interface ClinicHoursProps {
  hours: OperatingHours;
  className?: string;
}

type DayName = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const dayOrder: DayName[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const dayLabels: Record<DayName, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

function formatTime(time: string): string {
  const parts = time.split(':');
  const hours = parseInt(parts[0] ?? '0', 10);
  const minutes = parseInt(parts[1] ?? '0', 10);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function formatHours(dayHours: DayHours): string {
  if (dayHours.closed) {
    return 'Closed';
  }
  return `${formatTime(dayHours.open)} - ${formatTime(dayHours.close)}`;
}

function getCurrentDay(): DayName {
  const dayMap: DayName[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return dayMap[new Date().getDay()] as DayName;
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
          {dayOrder.map((day) => {
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
                  {dayLabels[day]}
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
