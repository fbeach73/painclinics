/**
 * FAQ Extractor for Blog Posts
 *
 * Detects FAQ-style content from HTML by identifying H2 headings that end with "?"
 * and extracting the content that follows until the next heading.
 */

export interface ExtractedFAQ {
  question: string;
  answer: string;
}

/**
 * Strip HTML tags from a string while preserving meaningful spacing.
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ") // Replace <br> with space
    .replace(/<\/p>/gi, " ") // Add space after paragraphs
    .replace(/<\/li>/gi, " ") // Add space after list items
    .replace(/<[^>]*>/g, "") // Remove all HTML tags
    .replace(/&nbsp;/gi, " ") // Replace non-breaking spaces
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}

/**
 * Extract FAQs from HTML content.
 *
 * Detection logic:
 * 1. Find H2 headings that end with "?"
 * 2. Extract content between that H2 and the next H2 or H3 heading (or end of content)
 * 3. Strip HTML tags from the answer and limit to 500 characters
 *
 * @param html - The HTML content of the blog post
 * @returns Array of extracted FAQ items with question/answer pairs
 */
export function extractFAQsFromContent(html: string): ExtractedFAQ[] {
  const faqs: ExtractedFAQ[] = [];

  // Regex to find H2 tags ending with "?" and capture content until next H2/H3 or end
  // Using a more flexible approach: find all H2s, then extract content between them
  const h2Pattern = /<h2[^>]*>(.*?)<\/h2>/gi;
  const headingPattern = /<h[23][^>]*>/i;

  const h2Matches: Array<{ question: string; startIndex: number; endIndex: number }> = [];
  let match: RegExpExecArray | null;

  // Find all H2 headings
  while ((match = h2Pattern.exec(html)) !== null) {
    const questionHtml = match[1] ?? "";
    const questionText = stripHtmlTags(questionHtml).trim();

    // Only include H2s that end with "?"
    if (questionText.endsWith("?")) {
      h2Matches.push({
        question: questionText,
        startIndex: match.index + match[0].length, // Start after the closing </h2>
        endIndex: html.length, // Will be updated to next heading
      });
    }
  }

  // Update endIndex for each match to be the start of the next heading
  for (let i = 0; i < h2Matches.length; i++) {
    const currentMatch = h2Matches[i]!;
    const contentAfterH2 = html.slice(currentMatch.startIndex);

    // Find the next H2 or H3 heading
    const nextHeadingMatch = contentAfterH2.match(headingPattern);
    if (nextHeadingMatch && nextHeadingMatch.index !== undefined) {
      currentMatch.endIndex = currentMatch.startIndex + nextHeadingMatch.index;
    }
  }

  // Extract answers
  for (const h2Match of h2Matches) {
    const answerHtml = html.slice(h2Match.startIndex, h2Match.endIndex);
    let answerText = stripHtmlTags(answerHtml).trim();

    // Limit answer to 500 characters
    if (answerText.length > 500) {
      // Try to cut at a sentence boundary
      const cutPoint = answerText.lastIndexOf(".", 497);
      if (cutPoint > 300) {
        answerText = answerText.slice(0, cutPoint + 1);
      } else {
        answerText = answerText.slice(0, 497) + "...";
      }
    }

    // Only add if we have a meaningful answer (at least 20 characters)
    if (answerText.length >= 20) {
      faqs.push({
        question: h2Match.question,
        answer: answerText,
      });
    }
  }

  return faqs;
}

/**
 * Check if content has extractable FAQ content.
 *
 * @param html - The HTML content to check
 * @returns True if at least one FAQ can be extracted
 */
export function hasFAQContent(html: string): boolean {
  // Quick check: look for H2 tags ending with "?"
  const quickPattern = /<h2[^>]*>[^<]*\?<\/h2>/i;
  if (!quickPattern.test(html)) {
    // Also check for H2s with inline tags (like <strong>)
    const h2Pattern = /<h2[^>]*>.*?\?.*?<\/h2>/gi;
    if (!h2Pattern.test(html)) {
      return false;
    }
  }

  // Do full extraction to verify we can get meaningful FAQs
  const faqs = extractFAQsFromContent(html);
  return faqs.length > 0;
}
