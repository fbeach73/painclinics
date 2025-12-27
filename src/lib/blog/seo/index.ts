/**
 * SEO utilities for blog posts
 *
 * This module provides SEO enhancement features:
 * - FAQ extraction for structured data
 * - Internal linking for better site navigation
 * - Alt text generation for images using AI vision
 */

// FAQ Extraction
export {
  extractFAQsFromContent,
  hasFAQContent,
  type ExtractedFAQ,
} from "./faq-extractor";

// Internal Linking
export {
  addInternalLinks,
  extractKeywordsFromTitle,
  scoreLinkCandidate,
  type LinkCandidate,
  type InterlinkerResult,
} from "./interlinker";

// Alt Text Generation
export {
  generateAltTextFromBase64,
  generateAltTextFromUrl,
  type AltTextResult,
  type AltTextContext,
} from "./alt-text-generator";

// Content Image Processing
export {
  processContentImages,
  type ContentImageResult,
} from "./content-image-processor";

// Category & Tag Classification
export {
  classifyBlogPost,
  classifyAndAssignToPost,
  type CategoryClassifierResult,
} from "./category-classifier";

// Overview Formatting
export {
  formatOverviewParagraph,
  formatOverviewWithLabel,
  type OverviewFormatterResult,
} from "./overview-formatter";

// Subheading Image Processing
export {
  processSubheadingImages,
  findH2sWithImages,
  type SubheadingImageResult,
} from "./subheading-image-processor";
