import type { SitemapDiscoveryResult, SitemapInfo } from "./types";

/**
 * Fetch and parse a sitemap XML file to extract URLs
 */
export async function fetchAndParseSitemap(sitemapUrl: string): Promise<string[]> {
  const response = await fetch(sitemapUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status}`);
  }

  const xml = await response.text();
  const urlMatches = xml.matchAll(/<loc>([^<]+)<\/loc>/g);
  return Array.from(urlMatches, (m) => m[1]).filter((url): url is string => url !== undefined);
}

/**
 * Discover all blog post URLs from WordPress sitemaps
 * WordPress typically uses post-sitemap1.xml, post-sitemap2.xml, etc.
 */
export async function discoverPostUrls(baseUrl: string): Promise<SitemapDiscoveryResult> {
  // WordPress post sitemaps are typically named post-sitemap1.xml, post-sitemap2.xml, etc.
  // Try up to 10 sitemaps to be thorough
  const maxSitemaps = 10;
  const sitemaps: SitemapInfo[] = [];
  const allPostUrls: string[] = [];

  for (let i = 1; i <= maxSitemaps; i++) {
    const url = `${baseUrl}/post-sitemap${i}.xml`;
    try {
      const urls = await fetchAndParseSitemap(url);
      if (urls.length > 0) {
        sitemaps.push({ url, postCount: urls.length });
        allPostUrls.push(...urls);
      }
    } catch {
      // Sitemap doesn't exist or failed to fetch, stop looking for more
      if (i > 1) break;
      // If even sitemap1 fails, try alternate naming pattern
      try {
        const altUrl = `${baseUrl}/sitemap-posts.xml`;
        const urls = await fetchAndParseSitemap(altUrl);
        if (urls.length > 0) {
          sitemaps.push({ url: altUrl, postCount: urls.length });
          allPostUrls.push(...urls);
        }
      } catch {
        // No sitemaps found with either naming pattern
      }
      break;
    }
  }

  return { sitemaps, postUrls: allPostUrls };
}

/**
 * Extract the post slug from a WordPress URL
 * @example
 * extractSlugFromUrl("https://www.painclinics.com/chronic-pain-management/") => "chronic-pain-management"
 */
export function extractSlugFromUrl(wpUrl: string): string {
  try {
    const url = new URL(wpUrl);
    const pathParts = url.pathname.split("/").filter(Boolean);
    return pathParts[pathParts.length - 1] || "";
  } catch {
    // If URL parsing fails, try to extract slug manually
    const parts = wpUrl.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  }
}

/**
 * Check if a URL is a blog post URL (not a page, category, etc.)
 * This helps filter out non-post URLs that might appear in sitemaps
 */
export function isBlogPostUrl(url: string, baseUrl: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;

    // Exclude common non-blog paths
    const excludedPaths = [
      "/pain-management/",
      "/about/",
      "/contact/",
      "/privacy/",
      "/terms/",
      "/category/",
      "/tag/",
      "/author/",
      "/page/",
      "/wp-content/",
      "/wp-admin/",
      "/feed/",
    ];

    const lowerPath = pathname.toLowerCase();
    for (const excluded of excludedPaths) {
      if (lowerPath.startsWith(excluded)) {
        return false;
      }
    }

    // Make sure it's from the correct domain
    const baseUrlParsed = new URL(baseUrl);
    if (parsedUrl.hostname !== baseUrlParsed.hostname) {
      return false;
    }

    // A blog post URL typically has a single path segment
    const segments = pathname.split("/").filter(Boolean);
    return segments.length === 1;
  } catch {
    return false;
  }
}

/**
 * Filter sitemap URLs to only include blog posts
 */
export function filterBlogPostUrls(urls: string[], baseUrl: string): string[] {
  return urls.filter((url) => isBlogPostUrl(url, baseUrl));
}
