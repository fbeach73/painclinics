// Blog library exports

// Types
export * from "./types";

// Sitemap parsing
export {
  fetchAndParseSitemap,
  discoverPostUrls,
  extractSlugFromUrl,
  isBlogPostUrl,
  filterBlogPostUrls,
} from "./sitemap-parser";

// WordPress API
export {
  fetchWPPosts,
  fetchAllWPPosts,
  fetchWPPostBySlug,
  fetchWPPostById,
  fetchAllWPCategories,
  fetchAllWPTags,
  decodeHtmlEntities,
  stripHtmlTags,
  getFeaturedImageFromPost,
  getAuthorFromPost,
} from "./wordpress-api";

// Image migration
export {
  migrateImage,
  extractImageUrls,
  normalizeImageUrl,
  getUniqueImages,
  migrateAllImages,
  migrateFeaturedImage,
  getAllPostImages,
} from "./image-migrator";

// Content processing
export {
  processContent,
  generateRedirectConfig,
  generateRedirectConfigString,
  cleanupWordPressHtml,
  extractExcerpt,
  sanitizeHtml,
} from "./content-processor";

// Database queries
export {
  getBlogPostBySlug,
  getBlogPostByWpId,
  getBlogPosts,
  getAllPublishedPostSlugs,
  getAllCategories,
  getCategoryBySlug,
  getAllTags,
  getTagBySlug,
  getRecentPosts,
  getRelatedPosts,
  getCategoryByWpId,
  getTagByWpId,
  getCategoriesWithCounts,
  getTagsWithCounts,
  getBlogImportBatch,
  getLatestBlogImportBatch,
} from "./blog-queries";
