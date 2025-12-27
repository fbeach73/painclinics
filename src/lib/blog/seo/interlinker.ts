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
 * Extract meaningful multi-word phrases from a title.
 * Returns phrases in order of preference: 3-word, 2-word phrases.
 * Preserves the original title casing for natural linking.
 *
 * @param title - The blog post title
 * @returns Array of phrases (longest first)
 */
function extractPhrasesFromTitle(title: string): string[] {
  // Clean the title but preserve case
  const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  const words = cleanTitle.split(/\s+/).filter((w) => w.length > 0);

  const phrases: string[] = [];

  // Generate 3-word phrases
  for (let i = 0; i <= words.length - 3; i++) {
    const phrase = words.slice(i, i + 3).join(" ");
    // Only add if at least one word is meaningful (not a stop word)
    const hasKeyword = words
      .slice(i, i + 3)
      .some((w) => w.length > 3 && !STOP_WORDS.has(w.toLowerCase()));
    if (hasKeyword) {
      phrases.push(phrase);
    }
  }

  // Generate 2-word phrases
  for (let i = 0; i <= words.length - 2; i++) {
    const phrase = words.slice(i, i + 2).join(" ");
    // Only add if at least one word is meaningful
    const hasKeyword = words
      .slice(i, i + 2)
      .some((w) => w.length > 3 && !STOP_WORDS.has(w.toLowerCase()));
    if (hasKeyword) {
      phrases.push(phrase);
    }
  }

  return phrases;
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
 * Find link text to use - prioritizing multi-word phrases for better SEO.
 * Returns both the text to find and the anchor text to use.
 * Preserves original capitalization from the content.
 */
function findLinkableText(
  content: string,
  candidate: LinkCandidate
): { searchText: string; anchorText: string } | null {
  const contentLower = content.toLowerCase();

  // First, try to find the full title (most natural)
  const titleClean = candidate.title.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  const titleLower = titleClean.toLowerCase();
  if (contentLower.includes(titleLower)) {
    // Find the original casing from content
    const idx = contentLower.indexOf(titleLower);
    const originalText = content.slice(idx, idx + titleClean.length);
    return { searchText: originalText, anchorText: originalText };
  }

  // Extract multi-word phrases from the title (3-word, then 2-word)
  const phrases = extractPhrasesFromTitle(candidate.title);

  // Try each phrase, looking for case-insensitive match in content
  for (const phrase of phrases) {
    const phraseLower = phrase.toLowerCase();
    const idx = contentLower.indexOf(phraseLower);
    if (idx !== -1) {
      // Extract the original casing from the content
      const originalText = content.slice(idx, idx + phrase.length);
      return { searchText: originalText, anchorText: originalText };
    }
  }

  // Try 2-word combinations of significant keywords (non-consecutive)
  // but require at least 8 total characters for meaningful anchor text
  const keywords = candidate.keywords.filter((k) => k.length >= 4);
  for (let i = 0; i < keywords.length - 1; i++) {
    for (let j = i + 1; j < keywords.length; j++) {
      // Try both orders
      const phrases2 = [
        `${keywords[i]} ${keywords[j]}`,
        `${keywords[j]} ${keywords[i]}`,
      ];
      for (const phrase of phrases2) {
        if (phrase.length >= 8 && contentLower.includes(phrase)) {
          const idx = contentLower.indexOf(phrase);
          const originalText = content.slice(idx, idx + phrase.length);
          return { searchText: originalText, anchorText: originalText };
        }
      }
    }
  }

  // Last resort: single significant keyword (6+ chars) for medical/technical terms
  // These are often meaningful on their own (e.g., "neuropathy", "fibromyalgia")
  for (const keyword of candidate.keywords) {
    if (keyword.length >= 6) {
      // Use word boundary matching to find the word in original case
      const regex = new RegExp(`\\b(${keyword})\\b`, "gi");
      const match = content.match(regex);
      if (match) {
        // Find position to get original casing
        const idx = contentLower.indexOf(keyword);
        if (idx !== -1) {
          const originalText = content.slice(idx, idx + keyword.length);
          return { searchText: originalText, anchorText: originalText };
        }
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
