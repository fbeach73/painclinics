'use client';

import { cn } from '@/lib/utils';

interface ClinicMarkerProps {
  isSelected?: boolean;
  isFeatured?: boolean;
  onClick?: () => void;
}

export function ClinicMarker({
  isSelected = false,
  isFeatured = false,
  onClick,
}: ClinicMarkerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-transform duration-150 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        isSelected
          ? 'scale-110 bg-primary ring-2 ring-primary ring-offset-2'
          : isFeatured
            ? 'bg-primary'
            : 'bg-primary/80',
      )}
      aria-label="Clinic location"
    >
      <svg
        className="h-4 w-4 text-primary-foreground"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
    </button>
  );
}
