/**
 * Shared constants for analytics UI components
 */

/**
 * Color mappings for referrer source indicators (dot/icon only)
 * Used in admin traffic analytics table
 */
export const REFERRER_COLORS: Record<string, string> = {
  google: "bg-blue-500",
  direct: "bg-gray-500",
  bing: "bg-teal-500",
  facebook: "bg-indigo-500",
  twitter: "bg-sky-500",
  linkedin: "bg-blue-700",
  instagram: "bg-pink-500",
  pinterest: "bg-red-500",
  reddit: "bg-orange-500",
  tiktok: "bg-black",
  youtube: "bg-red-600",
  internal: "bg-green-500",
  referral: "bg-purple-500",
  yahoo: "bg-purple-600",
  duckduckgo: "bg-orange-600",
  email: "bg-amber-500",
};

/**
 * Color mappings for referrer source badges with text color
 * Used in owner clinic analytics widget badges
 */
export const REFERRER_BADGE_COLORS: Record<string, string> = {
  google: "bg-blue-500 text-white",
  direct: "bg-gray-500 text-white",
  bing: "bg-teal-500 text-white",
  facebook: "bg-indigo-500 text-white",
  twitter: "bg-sky-500 text-white",
  linkedin: "bg-blue-700 text-white",
  instagram: "bg-pink-500 text-white",
  pinterest: "bg-red-500 text-white",
  reddit: "bg-orange-500 text-white",
  tiktok: "bg-black text-white",
  youtube: "bg-red-600 text-white",
  internal: "bg-green-500 text-white",
  referral: "bg-purple-500 text-white",
  yahoo: "bg-purple-600 text-white",
  duckduckgo: "bg-orange-600 text-white",
  email: "bg-amber-500 text-white",
};
