'use client';

import { useMemo } from 'react';
import { transformClinicHours } from '@/lib/clinic-db-to-type';
import type { ClinicHour } from '@/lib/clinic-transformer';
import { isCurrentlyOpen } from '@/lib/time-utils';
import { cn } from '@/lib/utils';

interface OpenClosedStatusProps {
  clinicHours: unknown;
  className?: string;
}

/**
 * Shared component to display open/closed status with colored indicator dot.
 * Used across state pages, city pages, and clinic cards.
 *
 * Light theme:
 *   - Open: Light green background with green text
 *   - Closed: Solid red background with white text (high contrast for visibility)
 *
 * Dark theme:
 *   - Open: Dark green background with green text
 *   - Closed: Subtle dark red background with red text
 */
export function OpenClosedStatus({ clinicHours, className }: OpenClosedStatusProps) {
  const status = useMemo(() => {
    const hours = transformClinicHours(clinicHours as ClinicHour[] | null);
    return isCurrentlyOpen(hours);
  }, [clinicHours]);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full",
        status.isOpen
          ? "bg-green-100 dark:bg-green-950/50"
          : "bg-red-600 dark:bg-red-950/50",
        className
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full flex-shrink-0",
          status.isOpen ? "bg-green-500" : "bg-white dark:bg-red-500"
        )}
      />
      <span
        className={cn(
          "text-xs font-medium",
          status.isOpen
            ? "text-green-600 dark:text-green-400"
            : "text-white dark:text-red-400"
        )}
      >
        {status.isOpen ? "Open" : "Closed"}
      </span>
    </div>
  );
}
