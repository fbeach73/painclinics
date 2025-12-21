import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Strip query parameters and hash from a URL.
 * Also removes trailing slashes for cleaner display.
 * @param url - The URL to clean
 * @returns The URL without query parameters or hash
 */
export function stripUrlQueryParams(url: string): string {
  try {
    const urlObj = new URL(url);
    // Return just origin + pathname, removing trailing slash
    return (urlObj.origin + urlObj.pathname).replace(/\/$/, '');
  } catch {
    // If URL parsing fails, try to strip manually
    return url.split('?')[0]?.split('#')[0]?.replace(/\/$/, '') || url;
  }
}

/**
 * Format a URL for display by stripping protocol, query params, and trailing slash.
 * @param url - The URL to format
 * @returns Formatted URL for display
 */
export function formatDisplayUrl(url: string): string {
  const cleanUrl = stripUrlQueryParams(url);
  // Remove protocol (http:// or https://)
  return cleanUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/**
 * Sleep utility for async delays
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
