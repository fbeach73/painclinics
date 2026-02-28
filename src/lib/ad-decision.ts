/**
 * Per-placement ad decision: each slot independently checks for an active
 * hosted campaign via /api/ads/serve. If none exists, AdSense fills.
 *
 * The global traffic-split percentage is no longer used. This file is kept
 * for backwards compatibility but the function always returns true so that
 * callers attempt the hosted-ad path (which naturally falls back to AdSense
 * when no campaign is assigned).
 */
export async function shouldUseHostedAds(): Promise<boolean> {
  return true;
}
