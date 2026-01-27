'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ClinicHeroImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
}

const FALLBACK_IMAGE = '/images/clinic-placeholder.webp';

/**
 * Clinic hero image component with automatic fallback handling.
 *
 * If the primary image fails to load (404, expired URL, etc.),
 * automatically displays the fallback placeholder image.
 *
 * This handles cases where:
 * - Google Street View URLs have expired
 * - External image URLs are broken
 * - Image URLs return 404 errors
 */
export function ClinicHeroImage({ src, alt, className, priority = false }: ClinicHeroImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src || FALLBACK_IMAGE);
  const [hasError, setHasError] = useState(!src);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className={cn('object-cover', hasError && 'opacity-80', className)}
      priority={priority}
      onError={handleError}
    />
  );
}
