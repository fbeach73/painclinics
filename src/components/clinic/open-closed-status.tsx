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

  // For Closed status: Use inline styles to override Tailwind v4's
  // prefers-color-scheme media query that conflicts with .light class
  const closedBgStyle = !status.isOpen ? { backgroundColor: 'rgb(220, 38, 38)' } : undefined;
  const closedDotStyle = !status.isOpen ? { backgroundColor: 'white' } : undefined;
  const closedTextStyle = !status.isOpen ? { color: 'white' } : undefined;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full",
        status.isOpen
          ? "bg-green-100 dark:bg-green-950/50"
          : "dark:!bg-red-950/50",
        className
      )}
      style={closedBgStyle}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full flex-shrink-0",
          status.isOpen ? "bg-green-500" : "dark:!bg-red-500"
        )}
        style={closedDotStyle}
      />
      <span
        className={cn(
          "text-xs font-medium",
          status.isOpen
            ? "text-green-600 dark:text-green-400"
            : "dark:!text-red-400"
        )}
        style={closedTextStyle}
      >
        {status.isOpen ? "Open" : "Closed"}
      </span>
    </div>
  );
}
