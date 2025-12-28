/**
 * FAQ Extractor for Blog Posts
 *
 * Detects FAQ-style content from HTML by identifying H2 or H3 headings that end with "?"
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
 * 1. Find H2 or H3 headings that end with "?"
 * 2. Extract content between that heading and the next H2/H3/H4 heading (or end of content)
 * 3. Strip HTML tags from the answer and limit to 500 characters
 *
 * @param html - The HTML content of the blog post
 * @returns Array of extracted FAQ items with question/answer pairs
 */
export function extractFAQsFromContent(html: string): ExtractedFAQ[] {
  const faqs: ExtractedFAQ[] = [];

  // Regex to find H2 or H3 tags ending with "?" and capture content until next heading
  const faqHeadingPattern = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
  const nextHeadingPattern = /<h[234][^>]*>/i;

  const faqMatches: Array<{ question: string; startIndex: number; endIndex: number }> = [];
  let match: RegExpExecArray | null;

  // Find all H2 and H3 headings
  while ((match = faqHeadingPattern.exec(html)) !== null) {
    const questionHtml = match[1] ?? "";
    const questionText = stripHtmlTags(questionHtml).trim();

    // Only include headings that end with "?"
    if (questionText.endsWith("?")) {
      faqMatches.push({
        question: questionText,
        startIndex: match.index + match[0].length, // Start after the closing tag
        endIndex: html.length, // Will be updated to next heading
      });
    }
  }

  // Update endIndex for each match to be the start of the next heading
  for (let i = 0; i < faqMatches.length; i++) {
    const currentMatch = faqMatches[i]!;
    const contentAfterHeading = html.slice(currentMatch.startIndex);

    // Find the next H2, H3, or H4 heading
    const nextHeadingMatch = contentAfterHeading.match(nextHeadingPattern);
    if (nextHeadingMatch && nextHeadingMatch.index !== undefined) {
      currentMatch.endIndex = currentMatch.startIndex + nextHeadingMatch.index;
    }
  }

  // Extract answers
  for (const faqMatch of faqMatches) {
    const answerHtml = html.slice(faqMatch.startIndex, faqMatch.endIndex);
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
        question: faqMatch.question,
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
  // Quick check: look for H2 or H3 tags ending with "?"
  const quickPattern = /<h[23][^>]*>[^<]*\?<\/h[23]>/i;
  if (!quickPattern.test(html)) {
    // Also check for H2s/H3s with inline tags (like <strong>)
    const headingPattern = /<h[23][^>]*>.*?\?.*?<\/h[23]>/gi;
    if (!headingPattern.test(html)) {
      return false;
    }
  }

  // Do full extraction to verify we can get meaningful FAQs
  const faqs = extractFAQsFromContent(html);
  return faqs.length > 0;
}
