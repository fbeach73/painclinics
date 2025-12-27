/**
 * SEO Processor for Blog Posts
 *
 * Orchestrates all SEO enhancements for blog posts:
 * - Internal linking (adds contextual links to other posts)
 * - Alt text generation (AI-powered alt text for featured images)
 *
 * FAQ extraction is handled at render time in the blog page component.
 */

import {
  addInternalLinks,
  generateAltTextFromBase64,
  type InterlinkerResult,
  type AltTextResult,
} from "./seo";

export interface SEOProcessingResult {
  content: string;
  featuredImageAlt?: string;
  interlinking: InterlinkerResult;
  altTextGeneration?: AltTextResult;
  errors: string[];
}

export interface SEOProcessingOptions {
  html: string;
  title: string;
  excerpt?: string;
  imageBase64?: string;
  categoryIds?: string[];
  maxLinks?: number;
}

/**
 * Process all SEO enhancements for a blog post.
 *
 * This function orchestrates:
 * 1. Internal linking - adds contextual links to related posts
 * 2. Alt text generation - creates AI-powered alt text for featured images
 *
 * Each step is wrapped in try/catch to ensure partial failures don't
 * prevent the post from being created.
 *
 * @param options - Processing options including content and metadata
 * @returns Processing result with enhanced content and statistics
 */
export async function processBlogSEO(
  options: SEOProcessingOptions
): Promise<SEOProcessingResult> {
  const errors: string[] = [];
  let content = options.html;
  let featuredImageAlt: string | undefined;
  let altTextGeneration: AltTextResult | undefined;
  let interlinkResult: InterlinkerResult = {
    modifiedHtml: content,
    linksAdded: 0,
    linkedSlugs: [],
  };

  // 1. Add internal links
  try {
    interlinkResult = await addInternalLinks(
      content,
      options.title,
      options.categoryIds || [],
      { maxLinks: options.maxLinks ?? 3 }
    );
    content = interlinkResult.modifiedHtml;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    errors.push(`Interlinking failed: ${message}`);
    console.error("SEO: Interlinking failed:", error);
  }

  // 2. Generate alt text for featured image
  if (options.imageBase64) {
    try {
      // Only pass excerpt context if it exists
      const context = options.excerpt ? { excerpt: options.excerpt } : undefined;
      altTextGeneration = await generateAltTextFromBase64(
        options.imageBase64,
        options.title,
        context
      );

      if (altTextGeneration.success && altTextGeneration.altText) {
        featuredImageAlt = altTextGeneration.altText;
      } else if (altTextGeneration.error) {
        errors.push(`Alt text generation failed: ${altTextGeneration.error}`);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      errors.push(`Alt text error: ${message}`);
      console.error("SEO: Alt text generation failed:", error);
    }
  }

  // Build result object, only including optional properties when defined
  const result: SEOProcessingResult = {
    content,
    interlinking: interlinkResult,
    errors,
  };

  if (featuredImageAlt) {
    result.featuredImageAlt = featuredImageAlt;
  }

  if (altTextGeneration) {
    result.altTextGeneration = altTextGeneration;
  }

  return result;
}
