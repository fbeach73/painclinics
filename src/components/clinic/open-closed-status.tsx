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

  // For Closed status: Use inline styles ONLY (no Tailwind dark: classes)
  // because Tailwind v4's dark: uses @media prefers-color-scheme which
  // ignores the .light/.dark class and !important overrides inline styles
  if (!status.isOpen) {
    return (
      <div
        className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full mb-2", className)}
        style={{ backgroundColor: 'rgb(220, 38, 38)' }}
      >
        <span
          className="h-2 w-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: 'white' }}
        />
        <span
          className="text-xs font-medium"
          style={{ color: 'white' }}
        >
          Closed
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full",
        "bg-green-100 dark:bg-green-950/50",
        className
      )}
    >
      <span className="h-2 w-2 rounded-full flex-shrink-0 bg-green-500" />
      <span className="text-xs font-medium text-green-600 dark:text-green-400">
        Open
      </span>
    </div>
  );
}
