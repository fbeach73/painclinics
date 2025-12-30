/**
 * Photo upload limits based on subscription tier
 */
export const PHOTO_LIMITS: Record<string, number> = {
  none: 0,
  basic: 5,
  premium: 50, // "unlimited" but with reasonable cap
};

/**
 * Get the photo limit for a clinic based on its subscription tier
 */
export function getPhotoLimit(featuredTier: string | null): number {
  return PHOTO_LIMITS[featuredTier || "none"] || 0;
}
