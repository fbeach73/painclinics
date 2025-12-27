/**
 * Internal Linking System for Blog Posts
 *
 * Automatically adds internal links to blog post content by:
 * 1. Extracting keywords from post titles
 * 2. Scoring link candidates based on shared categories and keyword matches
 * 3. Inserting links into the HTML content without breaking existing links
 */

import { getPostsForInterlinking } from "../blog-queries";

export interface LinkCandidate {
  id: string;
  title: string;
  slug: string;
  categoryIds: string[];
  keywords: string[];
}

export interface InterlinkerResult {
  modifiedHtml: string;
  linksAdded: number;
  linkedSlugs: string[];
}

/**
 * Stop words to exclude from keyword extraction.
 * These common words don't add meaningful context for link matching.
 */
const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "need",
  "how",
  "what",
  "why",
  "when",
  "where",
  "who",
  "which",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "your",
  "you",
  "we",
  "our",
  "their",
  "about",
  "after",
  "before",
  "between",
  "into",
  "through",
  "during",
  "under",
  "again",
  "further",
  "then",
  "once",
  "here",
  "there",
  "all",
  "each",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "only",
  "own",
  "same",
  "than",
  "too",
  "very",
  "just",
  "also",
]);

/**
 * Extract meaningful keywords from a blog post title.
 *
 * @param title - The blog post title
 * @returns Array of lowercase keywords (min 4 characters, no stop words)
 */
export function extractKeywordsFromTitle(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // Remove punctuation
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word));
}

/**
 * Score a link candidate based on relevance to the source content.
 *
 * Scoring:
 * - +2 points per shared category
 * - +1 point per keyword found in source content
 *
 * @param sourceContent - The HTML content being linked from
 * @param sourceCategories - Category IDs of the source post
 * @param candidate - The potential link target
 * @returns Relevance score (higher = more relevant)
 */
export function scoreLinkCandidate(
  sourceContent: string,
  sourceCategories: string[],
  candidate: LinkCandidate
): number {
  let score = 0;
  const contentLower = sourceContent.toLowerCase();

  // +2 per shared category
  for (const catId of candidate.categoryIds) {
    if (sourceCategories.includes(catId)) {
      score += 2;
    }
  }

  // +1 per keyword found in content
  for (const keyword of candidate.keywords) {
    if (contentLower.includes(keyword)) {
      score += 1;
    }
  }

  return score;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find link text to use - either the full title or a matching keyword phrase.
 * Returns both the text to find and the anchor text to use.
 */
function findLinkableText(
  content: string,
  candidate: LinkCandidate
): { searchText: string; anchorText: string } | null {
  const contentLower = content.toLowerCase();

  // First, try to find the full title (most natural)
  const titleLower = candidate.title.toLowerCase();
  if (contentLower.includes(titleLower)) {
    // Find the original casing
    const idx = contentLower.indexOf(titleLower);
    const originalText = content.slice(idx, idx + candidate.title.length);
    return { searchText: originalText, anchorText: originalText };
  }

  // Try to find 2-3 word phrases from keywords
  const keywords = candidate.keywords;
  for (let len = 3; len >= 2; len--) {
    for (let i = 0; i <= keywords.length - len; i++) {
      const phrase = keywords.slice(i, i + len).join(" ");
      if (contentLower.includes(phrase)) {
        const idx = contentLower.indexOf(phrase);
        const originalText = content.slice(idx, idx + phrase.length);
        return { searchText: originalText, anchorText: originalText };
      }
    }
  }

  // Try individual keywords (at least 5 characters for meaningful links)
  for (const keyword of keywords) {
    if (keyword.length >= 5 && contentLower.includes(keyword)) {
      // Find word boundaries to get the full word in original casing
      const wordPattern = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i");
      const match = content.match(wordPattern);
      if (match) {
        return { searchText: match[0], anchorText: match[0] };
      }
    }
  }

  return null;
}

/**
 * Check if text is inside an existing anchor tag.
 */
function isInsideAnchor(html: string, position: number): boolean {
  // Find the most recent <a or </a> before this position
  const beforeText = html.slice(0, position);
  const lastOpenA = beforeText.lastIndexOf("<a ");
  const lastCloseA = beforeText.lastIndexOf("</a>");

  // If there's an open <a> tag more recent than a close </a>, we're inside
  return lastOpenA > lastCloseA;
}

/**
 * Check if text is inside a heading tag.
 */
function isInsideHeading(html: string, position: number): boolean {
  const beforeText = html.slice(0, position);

  // Check for h1-h6
  for (let i = 1; i <= 6; i++) {
    const lastOpen = beforeText.lastIndexOf(`<h${i}`);
    const lastClose = beforeText.lastIndexOf(`</h${i}>`);
    if (lastOpen > lastClose) {
      return true;
    }
  }

  return false;
}

/**
 * Insert a link into HTML content at a safe location.
 *
 * @param html - The HTML content
 * @param searchText - The text to find and link
 * @param slug - The slug for the link URL
 * @param anchorText - The text to display for the link
 * @returns Modified HTML or null if link couldn't be inserted
 */
function insertLink(
  html: string,
  searchText: string,
  slug: string,
  anchorText: string
): string | null {
  // Find all occurrences and pick the first one that's not inside an anchor or heading
  const searchLower = searchText.toLowerCase();
  const htmlLower = html.toLowerCase();

  let searchStart = 0;
  while (searchStart < html.length) {
    const pos = htmlLower.indexOf(searchLower, searchStart);
    if (pos === -1) break;

    // Check if this occurrence is inside a paragraph (not heading) and not already linked
    if (!isInsideAnchor(html, pos) && !isInsideHeading(html, pos)) {
      // Also verify we're inside a <p> tag
      const beforeText = html.slice(0, pos);
      const lastOpenP = beforeText.lastIndexOf("<p");
      const lastCloseP = beforeText.lastIndexOf("</p>");

      if (lastOpenP > lastCloseP) {
        // We're inside a paragraph, safe to insert
        const before = html.slice(0, pos);
        const after = html.slice(pos + searchText.length);
        const link = `<a href="/blog/${slug}">${anchorText}</a>`;
        return before + link + after;
      }
    }

    searchStart = pos + 1;
  }

  return null;
}

/**
 * Add internal links to blog post HTML content.
 *
 * Algorithm:
 * 1. Get all published posts from the database
 * 2. Extract keywords from each candidate's title
 * 3. Score candidates based on shared categories and keyword matches
 * 4. Take the top N candidates
 * 5. For each candidate, find linkable text in the content and insert a link
 *
 * @param html - The HTML content to add links to
 * @param currentPostTitle - Title of the current post (to exclude from candidates)
 * @param categoryIds - Category IDs of the current post
 * @param options - Configuration options
 * @returns Modified HTML and linking statistics
 */
export async function addInternalLinks(
  html: string,
  currentPostTitle: string,
  categoryIds: string[],
  options: { maxLinks?: number } = {}
): Promise<InterlinkerResult> {
  const maxLinks = options.maxLinks ?? 3;

  // Get all published posts
  const allPosts = await getPostsForInterlinking();

  // Build candidates with keywords, excluding current post
  const candidates: LinkCandidate[] = allPosts
    .filter(
      (p) => p.title.toLowerCase() !== currentPostTitle.toLowerCase()
    )
    .map((p) => ({
      ...p,
      keywords: extractKeywordsFromTitle(p.title),
    }));

  // Score and sort candidates
  const scoredCandidates = candidates
    .map((candidate) => ({
      candidate,
      score: scoreLinkCandidate(html, categoryIds, candidate),
    }))
    .filter((c) => c.score > 0) // Only consider candidates with some relevance
    .sort((a, b) => b.score - a.score);

  // Take top candidates (more than maxLinks in case some can't be linked)
  const topCandidates = scoredCandidates.slice(0, maxLinks * 2);

  // Try to insert links
  let modifiedHtml = html;
  const linkedSlugs: string[] = [];

  for (const { candidate } of topCandidates) {
    if (linkedSlugs.length >= maxLinks) break;

    // Skip if we already linked to this post
    if (linkedSlugs.includes(candidate.slug)) continue;

    // Find linkable text
    const linkable = findLinkableText(modifiedHtml, candidate);
    if (!linkable) continue;

    // Try to insert the link
    const result = insertLink(
      modifiedHtml,
      linkable.searchText,
      candidate.slug,
      linkable.anchorText
    );

    if (result) {
      modifiedHtml = result;
      linkedSlugs.push(candidate.slug);
    }
  }

  return {
    modifiedHtml,
    linksAdded: linkedSlugs.length,
    linkedSlugs,
  };
}
