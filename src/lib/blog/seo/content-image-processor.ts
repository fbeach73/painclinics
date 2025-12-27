/**
 * Content Image Processor for Blog Posts
 *
 * Downloads external images from blog post HTML content,
 * uploads them to blob storage, and updates the HTML with
 * permanent URLs.
 *
 * This prevents broken images when external URLs (e.g., from
 * ZimmWriter's temporary CDN) expire.
 */

import { upload } from "@/lib/storage";

export interface ContentImageResult {
  modifiedHtml: string;
  imagesProcessed: number;
  imagesFailed: number;
  errors: string[];
}

/**
 * Detect image type from buffer magic bytes
 */
function detectImageType(buffer: Buffer): string {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "jpg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "png";
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return "gif";
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return "webp";
  return "jpg"; // Default fallback
}

/**
 * Check if a URL is external (not already on our domain/blob storage)
 */
function isExternalUrl(url: string): boolean {
  // Skip data URIs
  if (url.startsWith("data:")) return false;

  // Skip relative URLs
  if (url.startsWith("/") && !url.startsWith("//")) return false;

  // Skip our own domains
  const ourDomains = [
    "painclinics.com",
    "vercel-storage.com",
    "blob.vercel-storage.com",
    "public.blob.vercel-storage.com",
  ];

  try {
    const urlObj = new URL(url);
    return !ourDomains.some((domain) => urlObj.hostname.endsWith(domain));
  } catch {
    // Invalid URL, skip it
    return false;
  }
}

/**
 * Download an image from a URL
 */
async function downloadImage(
  url: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        // Some CDNs require a user agent
        "User-Agent":
          "Mozilla/5.0 (compatible; PainClinicsBot/1.0; +https://painclinics.com)",
      },
      // Timeout after 30 seconds
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.warn(`Failed to download image ${url}: HTTP ${response.status}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "";

    // Verify it's actually an image
    if (!contentType.startsWith("image/")) {
      console.warn(`URL ${url} is not an image: ${contentType}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Sanity check: image should be at least 100 bytes
    if (buffer.length < 100) {
      console.warn(`Image ${url} too small (${buffer.length} bytes)`);
      return null;
    }

    return { buffer, contentType };
  } catch (error) {
    console.warn(`Error downloading image ${url}:`, error);
    return null;
  }
}

/**
 * Process all external images in HTML content.
 *
 * Finds all <img src="..."> tags with external URLs,
 * downloads the images, uploads to blob storage, and
 * replaces the URLs in the HTML.
 *
 * @param html - The HTML content containing images
 * @param slug - The post slug (used for naming uploaded files)
 * @returns Modified HTML with permanent image URLs
 */
export async function processContentImages(
  html: string,
  slug: string
): Promise<ContentImageResult> {
  const errors: string[] = [];
  let imagesProcessed = 0;
  let imagesFailed = 0;
  let modifiedHtml = html;

  // Find all img tags with src attributes
  // Matches: <img ... src="url" ...> or <img ... src='url' ...>
  const imgPattern = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;

  // Collect all unique external image URLs
  const imageUrls = new Map<string, string[]>(); // url -> [full match strings]
  let match: RegExpExecArray | null;

  while ((match = imgPattern.exec(html)) !== null) {
    const fullMatch = match[0];
    const url = match[1];

    if (url && isExternalUrl(url)) {
      const existing = imageUrls.get(url) || [];
      existing.push(fullMatch);
      imageUrls.set(url, existing);
    }
  }

  if (imageUrls.size === 0) {
    return {
      modifiedHtml: html,
      imagesProcessed: 0,
      imagesFailed: 0,
      errors: [],
    };
  }

  // Process each unique image URL
  let imageIndex = 0;
  for (const [url, matches] of imageUrls) {
    imageIndex++;

    // Download the image
    const downloaded = await downloadImage(url);
    if (!downloaded) {
      imagesFailed++;
      errors.push(`Failed to download: ${url}`);
      continue;
    }

    // Detect image type from buffer (more reliable than content-type)
    const ext = detectImageType(downloaded.buffer);

    // Generate filename
    const filename = `${slug}-inline-${imageIndex}-${Date.now()}.${ext}`;

    try {
      // Upload to blob storage
      const result = await upload(downloaded.buffer, filename, "blog");

      // Replace all occurrences of this URL in the HTML
      for (const fullMatch of matches) {
        const newImgTag = fullMatch.replace(url, result.url);
        modifiedHtml = modifiedHtml.replace(fullMatch, newImgTag);
      }

      imagesProcessed++;
    } catch (error) {
      imagesFailed++;
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Upload failed for ${url}: ${message}`);
      console.error(`Failed to upload image from ${url}:`, error);
    }
  }

  return {
    modifiedHtml,
    imagesProcessed,
    imagesFailed,
    errors,
  };
}
