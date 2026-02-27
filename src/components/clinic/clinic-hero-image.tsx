'use client';

import { ClinicImage } from './clinic-image';
import { cn } from '@/lib/utils';

interface ClinicHeroImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
}

/**
 * Clinic hero image component with automatic fallback handling.
 * Wraps ClinicImage with hero-specific defaults (fill, object-cover).
 */
export function ClinicHeroImage({ src, alt, className, priority = false }: ClinicHeroImageProps) {
  return (
    <ClinicImage
      src={src}
      alt={alt}
      fill
      className={cn('object-cover', className)}
      priority={priority}
    />
  );
}
