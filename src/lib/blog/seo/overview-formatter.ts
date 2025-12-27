/**
 * Overview Formatter for Blog Posts
 *
 * Formats the opening "Overview" paragraph from ZimmWriter posts
 * by wrapping it in a blockquote element.
 *
 * ZimmWriter typically opens posts with an overview paragraph that
 * summarizes the content. This formatter makes it visually distinct.
 */

export interface OverviewFormatterResult {
  html: string;
  formatted: boolean;
}

/**
 * Format the overview paragraph by wrapping it in a blockquote
 *
 * This function finds the first <p> tag in the content and wraps
 * it in a <blockquote> element to visually distinguish the overview.
 *
 * @param html - The HTML content
 * @returns Modified HTML with the first paragraph as a blockquote
 */
export function formatOverviewParagraph(html: string): OverviewFormatterResult {
  if (!html || typeof html !== "string") {
    return { html: html || "", formatted: false };
  }

  // Match the first <p> tag and its content
  // This regex matches everything before the first <p> tag (including h1, etc.)
  // then captures the paragraph
  const firstParagraphMatch = html.match(
    /([\s\S]*?)(<p[^>]*>)([\s\S]*?)(<\/p>)/i
  );

  if (!firstParagraphMatch) {
    // No paragraph found, return unchanged
    return { html, formatted: false };
  }

  const [fullMatch, before = "", openTag, content = "", closeTag] = firstParagraphMatch;

  // Skip if already in a blockquote
  if (before.includes("<blockquote")) {
    return { html, formatted: false };
  }

  // Skip if the paragraph is empty or just whitespace
  const trimmedContent = content.replace(/<[^>]+>/g, "").trim();
  if (!trimmedContent) {
    return { html, formatted: false };
  }

  // Create the blockquote-wrapped version
  // Using Tailwind classes for styling (italic, border-left, padding)
  const blockquoteHtml = `<blockquote class="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-6">${openTag}${content}${closeTag}</blockquote>`;

  // Replace the first paragraph with the blockquote version
  const modifiedHtml = html.replace(fullMatch, before + blockquoteHtml);

  return {
    html: modifiedHtml,
    formatted: true,
  };
}

/**
 * Alternative: Format overview with a title label
 *
 * This version adds a "Overview" label before the blockquote.
 * Use this if you want to explicitly label the overview section.
 *
 * @param html - The HTML content
 * @returns Modified HTML with labeled overview blockquote
 */
export function formatOverviewWithLabel(html: string): OverviewFormatterResult {
  if (!html || typeof html !== "string") {
    return { html: html || "", formatted: false };
  }

  const firstParagraphMatch = html.match(
    /([\s\S]*?)(<p[^>]*>)([\s\S]*?)(<\/p>)/i
  );

  if (!firstParagraphMatch) {
    return { html, formatted: false };
  }

  const [fullMatch, before = "", , content = ""] = firstParagraphMatch;

  if (before.includes("<blockquote")) {
    return { html, formatted: false };
  }

  const trimmedContent = content.replace(/<[^>]+>/g, "").trim();
  if (!trimmedContent) {
    return { html, formatted: false };
  }

  // Create blockquote with bold "Overview" label
  const blockquoteHtml = `<blockquote class="border-l-4 border-primary/30 pl-4 my-6">
<p class="font-bold text-foreground mb-2">Overview</p>
<p class="italic text-muted-foreground">${trimmedContent}</p>
</blockquote>`;

  const modifiedHtml = html.replace(fullMatch, before + blockquoteHtml);

  return {
    html: modifiedHtml,
    formatted: true,
  };
}
