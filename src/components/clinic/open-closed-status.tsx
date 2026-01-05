'use client';

import { useMemo } from 'react';
import { transformClinicHours } from '@/lib/clinic-db-to-type';
import type { ClinicHour } from '@/lib/clinic-transformer';
import { DAY_ORDER } from '@/lib/day-constants';
import { isCurrentlyOpen } from '@/lib/time-utils';
import { cn } from '@/lib/utils';
import type { OperatingHours } from '@/types/clinic';

interface OpenClosedStatusProps {
  clinicHours: unknown;
  timezone?: string | null;
  className?: string;
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

/**
 * Shared component to display open/closed status with colored indicator dot.
 * Used across state pages, city pages, and clinic cards.
 *
 * Returns null if no hours data is available for the clinic.
 *
 * Light theme:
 *   - Open: Light green background with green text
 *   - Closed: Solid red background with white text (high contrast for visibility)
 *
 * Dark theme:
 *   - Open: Dark green background with green text
 *   - Closed: Subtle dark red background with red text
 */
export function OpenClosedStatus({ clinicHours, timezone, className }: OpenClosedStatusProps) {
  const result = useMemo(() => {
    const hours = transformClinicHours(clinicHours as ClinicHour[] | null);
    // Don't show status if no hours data available
    if (!hasHoursData(hours)) {
      return null;
    }
    return isCurrentlyOpen(hours, timezone);
  }, [clinicHours, timezone]);

  // No hours data - don't render anything
  if (!result) {
    return null;
  }

  const status = result;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/30",
        status.isOpen
          ? "bg-green-600 dark:bg-green-800/50"
          : "bg-red-600 dark:bg-red-800/50",
        className
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full flex-shrink-0",
          status.isOpen ? "bg-green-300 dark:bg-green-400" : "bg-red-300 dark:bg-red-400"
        )}
      />
      <span className="text-xs font-medium text-white">
        {status.isOpen ? "Open" : "Closed"}
      </span>
    </div>
  );
}
