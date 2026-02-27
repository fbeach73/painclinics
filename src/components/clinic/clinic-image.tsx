'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const FALLBACK_IMAGE = '/images/clinic-placeholder.webp';

interface ClinicImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}

/**
 * Clinic image with automatic fallback to placeholder on load error.
 * Handles expired Google Street View URLs, 404s, and broken external images.
 */
export function ClinicImage({ src, alt, fill, sizes, className, priority = false, width, height }: ClinicImageProps) {
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
      className={cn(className, hasError && 'opacity-80')}
      priority={priority}
      onError={handleError}
      {...(fill ? { fill } : {})}
      {...(sizes ? { sizes } : {})}
      {...(width !== undefined ? { width } : {})}
      {...(height !== undefined ? { height } : {})}
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );
}
