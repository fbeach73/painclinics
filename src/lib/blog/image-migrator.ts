import { upload } from "@/lib/storage";
import type { ImageMigrationResult } from "./types";

const WP_DOMAIN = "painclinics.com";

/**
 * Migrate a single image from WordPress to Vercel Blob storage
 */
export async function migrateImage(wpImageUrl: string): Promise<ImageMigrationResult> {
  try {
    // Fetch the image from WordPress
    const response = await fetch(wpImageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Extract filename from URL
    const urlPath = new URL(wpImageUrl).pathname;
    const filename = urlPath.split("/").pop() || "image.jpg";

    // Upload to storage (Vercel Blob or local)
    const result = await upload(buffer, filename, "blog");

    return {
      originalUrl: wpImageUrl,
      newUrl: result.url,
      success: true,
    };
  } catch (error) {
    return {
      originalUrl: wpImageUrl,
      newUrl: wpImageUrl, // Keep original URL on failure
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Extract all image URLs from HTML content that belong to the WordPress domain
 */
export function extractImageUrls(
  htmlContent: string,
  wpDomain = WP_DOMAIN
): string[] {
  // Match src attributes
  const srcMatches = htmlContent.matchAll(/src=["']([^"']+)["']/gi);
  const srcUrls = Array.from(srcMatches, (m) => m[1]).filter(
    (url): url is string => url !== undefined
  );

  // Match srcset attributes (for responsive images)
  const srcsetMatches = htmlContent.matchAll(/srcset=["']([^"']+)["']/gi);
  const srcsetUrls: string[] = [];
  for (const match of srcsetMatches) {
    // srcset contains multiple URLs with width descriptors
    const srcsetValue = match[1];
    if (!srcsetValue) continue;
    const entries = srcsetValue.split(",").map((s) => s.trim());
    for (const entry of entries) {
      const url = entry.split(/\s+/)[0];
      if (url) srcsetUrls.push(url);
    }
  }

  // Also match data-src for lazy-loaded images
  const dataSrcMatches = htmlContent.matchAll(/data-src=["']([^"']+)["']/gi);
  const dataSrcUrls = Array.from(dataSrcMatches, (m) => m[1]).filter(
    (url): url is string => url !== undefined
  );

  // Combine all URLs
  const allUrls = [...srcUrls, ...srcsetUrls, ...dataSrcUrls];

  // Filter to only WordPress domain images with valid extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
  return Array.from(
    new Set(
      allUrls.filter(
        (url) => url.includes(wpDomain) && imageExtensions.test(url)
      )
    )
  );
}

/**
 * Normalize image URLs for consistent mapping
 * Removes size suffixes like -300x200 from filenames
 */
export function normalizeImageUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove size suffixes like -300x200, -1024x768, etc.
    parsed.pathname = parsed.pathname.replace(/-\d+x\d+\./, ".");
    // Remove query string
    parsed.search = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Get unique normalized image URLs to avoid downloading the same image multiple times
 */
export function getUniqueImages(urls: string[]): Map<string, string[]> {
  // Map from normalized URL to array of original URLs
  const normalized = new Map<string, string[]>();

  for (const url of urls) {
    const normalizedUrl = normalizeImageUrl(url);
    const existing = normalized.get(normalizedUrl) || [];
    existing.push(url);
    normalized.set(normalizedUrl, existing);
  }

  return normalized;
}

/**
 * Migrate all images and return a mapping from original URLs to new URLs
 * @param imageUrls - Array of image URLs to migrate
 * @param onProgress - Optional callback for progress updates
 */
export async function migrateAllImages(
  imageUrls: string[],
  onProgress?: (current: number, total: number, url: string) => void
): Promise<Record<string, string>> {
  // Get unique images to avoid duplicate downloads
  const uniqueImages = getUniqueImages(imageUrls);
  const normalizedUrls = Array.from(uniqueImages.keys());
  const mapping: Record<string, string> = {};

  for (const [index, normalizedUrl] of normalizedUrls.entries()) {
    const originalUrls = uniqueImages.get(normalizedUrl) || [];

    onProgress?.(index + 1, normalizedUrls.length, normalizedUrl);

    // Migrate the normalized (full-size) version
    const result = await migrateImage(normalizedUrl);

    // Map all variants to the same new URL
    for (const originalUrl of originalUrls) {
      mapping[originalUrl] = result.newUrl;
    }

    // Also map the normalized URL itself
    mapping[normalizedUrl] = result.newUrl;

    // Small delay to avoid rate limiting
    if (index < normalizedUrls.length - 1) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  return mapping;
}

/**
 * Migrate a featured image specifically
 */
export async function migrateFeaturedImage(
  wpImageUrl: string
): Promise<{ url: string | null; success: boolean; error?: string }> {
  if (!wpImageUrl) {
    return { url: null, success: true };
  }

  const result = await migrateImage(wpImageUrl);
  const response: { url: string | null; success: boolean; error?: string } = {
    url: result.success ? result.newUrl : null,
    success: result.success,
  };

  if (result.error) {
    response.error = result.error;
  }

  return response;
}

/**
 * Get all images from a post's content and featured image
 */
export function getAllPostImages(
  content: string,
  featuredImageUrl?: string | null
): string[] {
  const contentImages = extractImageUrls(content);
  const images = [...contentImages];

  if (featuredImageUrl) {
    // Add featured image if not already in content
    if (!images.includes(featuredImageUrl)) {
      images.push(featuredImageUrl);
    }
  }

  return images;
}
