import sanitize from "sanitize-html";

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Works on both server and client without jsdom dependency.
 */
export function sanitizeHtml(html: string): string {
  return sanitize(html, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "hr",
      "ul",
      "ol",
      "li",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "a",
      "span",
      "div",
      "blockquote",
      "pre",
      "code",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
  });
}
