export interface ContentProcessingOptions {
  imageMapping: Record<string, string>;
  wpDomain?: string;
}

// Known non-blog paths that should not be converted to /blog/
const NON_BLOG_PATHS = [
  "pain-management",
  "about",
  "contact",
  "privacy",
  "terms",
  "category",
  "tag",
  "author",
  "page",
  "wp-content",
  "wp-admin",
  "wp-includes",
  "feed",
  "comments",
  "trackback",
];

/**
 * Process WordPress HTML content for Next.js
 * - Replace image URLs with Vercel Blob URLs
 * - Update internal blog links to /blog/ path
 * - Update clinic links to correct path
 * - Convert remaining absolute links to relative
 */
export function processContent(
  html: string,
  options: ContentProcessingOptions
): string {
  const { imageMapping, wpDomain = "painclinics.com" } = options;
  let processed = html;

  // 1. Replace image URLs with new Blob URLs
  for (const [wpUrl, blobUrl] of Object.entries(imageMapping)) {
    // Use case-insensitive replacement
    const escapedUrl = escapeRegExp(wpUrl);
    processed = processed.replace(new RegExp(escapedUrl, "gi"), blobUrl);
  }

  // 2. Update srcset attributes (image URLs with width descriptors)
  processed = processed.replace(
    /srcset=["']([^"']+)["']/gi,
    (_match, srcset) => {
      let newSrcset = srcset;
      for (const [wpUrl, blobUrl] of Object.entries(imageMapping)) {
        const escapedUrl = escapeRegExp(wpUrl);
        newSrcset = newSrcset.replace(new RegExp(escapedUrl, "gi"), blobUrl);
      }
      return `srcset="${newSrcset}"`;
    }
  );

  // 3. Update internal blog links (root-level posts → /blog/)
  // Match: href="https://www.painclinics.com/post-slug/"
  // Result: href="/blog/post-slug"
  const blogLinkRegex = new RegExp(
    `href=["']https?://${escapeRegExp(wpDomain)}/([a-z0-9-]+)/?["']`,
    "gi"
  );
  processed = processed.replace(blogLinkRegex, (match, slug) => {
    // Skip known non-blog paths
    if (NON_BLOG_PATHS.includes(slug.toLowerCase())) {
      return match;
    }
    return `href="/blog/${slug}"`;
  });

  // 4. Update clinic links (keep at /pain-management/)
  // Match: href="https://www.painclinics.com/pain-management/city-name/"
  // Result: href="/pain-management/city-name"
  const clinicLinkRegex = new RegExp(
    `href=["']https?://${escapeRegExp(wpDomain)}/pain-management/([^"']+)/?["']`,
    "gi"
  );
  processed = processed.replace(clinicLinkRegex, (_, path) => {
    // Remove trailing slash from path
    const cleanPath = path.replace(/\/$/, "");
    return `href="/pain-management/${cleanPath}"`;
  });

  // 5. Update category links
  // Match: href="https://www.painclinics.com/category/some-category/"
  // Result: href="/blog/category/some-category"
  const categoryLinkRegex = new RegExp(
    `href=["']https?://${escapeRegExp(wpDomain)}/category/([^"']+)/?["']`,
    "gi"
  );
  processed = processed.replace(categoryLinkRegex, (_, categoryPath) => {
    const cleanPath = categoryPath.replace(/\/$/, "");
    return `href="/blog/category/${cleanPath}"`;
  });

  // 6. Update tag links
  // Match: href="https://www.painclinics.com/tag/some-tag/"
  // Result: href="/blog/tag/some-tag"
  const tagLinkRegex = new RegExp(
    `href=["']https?://${escapeRegExp(wpDomain)}/tag/([^"']+)/?["']`,
    "gi"
  );
  processed = processed.replace(tagLinkRegex, (_, tagPath) => {
    const cleanPath = tagPath.replace(/\/$/, "");
    return `href="/blog/tag/${cleanPath}"`;
  });

  // 7. Convert any remaining absolute links to the WP domain to relative
  const remainingAbsoluteRegex = new RegExp(
    `href=["']https?://${escapeRegExp(wpDomain)}/`,
    "gi"
  );
  processed = processed.replace(remainingAbsoluteRegex, 'href="/');

  // 8. Clean up any double slashes in paths (but not in protocols)
  processed = processed.replace(/(?<!:)\/\//g, "/");

  return processed;
}

/**
 * Generate 301 redirect configuration for all blog post slugs
 * These redirects ensure old WordPress URLs redirect to new /blog/ paths
 */
export function generateRedirectConfig(
  slugs: string[]
): Array<{ source: string; destination: string; permanent: boolean }> {
  return slugs.map((slug) => ({
    source: `/${slug}`,
    destination: `/blog/${slug}`,
    permanent: true,
  }));
}

/**
 * Generate a next.config.ts redirects array string
 */
export function generateRedirectConfigString(slugs: string[]): string {
  const redirects = generateRedirectConfig(slugs);
  return JSON.stringify(redirects, null, 2);
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Clean up WordPress-specific HTML artifacts
 * - Remove empty paragraphs
 * - Clean up extra whitespace
 * - Remove WordPress shortcodes
 */
export function cleanupWordPressHtml(html: string): string {
  let cleaned = html;

  // Remove empty paragraphs
  cleaned = cleaned.replace(/<p>\s*<\/p>/gi, "");
  cleaned = cleaned.replace(/<p>&nbsp;<\/p>/gi, "");

  // Remove WordPress shortcodes like [shortcode attr="value"]...[/shortcode]
  cleaned = cleaned.replace(/\[[^\]]+\]/g, "");

  // Remove inline styles that reference WordPress paths
  cleaned = cleaned.replace(/style="[^"]*wp-content[^"]*"/gi, "");

  // Remove data attributes from WordPress
  cleaned = cleaned.replace(/\s*data-[a-z-]+="[^"]*"/gi, "");

  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, "\n\n");

  return cleaned.trim();
}

/**
 * Extract a plain text excerpt from HTML content
 * @param html - HTML content
 * @param maxLength - Maximum length of excerpt (default 160)
 */
export function extractExcerpt(html: string, maxLength = 160): string {
  // Strip all HTML tags
  let text = html.replace(/<[^>]*>/g, "");

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

  // Clean up whitespace
  text = text.replace(/\s+/g, " ").trim();

  // Truncate if needed
  if (text.length > maxLength) {
    // Try to cut at a word boundary
    const truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > maxLength * 0.7) {
      return truncated.slice(0, lastSpace) + "...";
    }
    return truncated + "...";
  }

  return text;
}

/**
 * Sanitize content for safe HTML rendering
 * This is a basic sanitizer - consider using DOMPurify for production
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+="[^"]*"/gi, "");
  sanitized = sanitized.replace(/\s*on\w+='[^']*'/gi, "");

  // Remove javascript: links
  sanitized = sanitized.replace(/href="javascript:[^"]*"/gi, 'href="#"');
  sanitized = sanitized.replace(/href='javascript:[^']*'/gi, "href='#'");

  return sanitized;
}
