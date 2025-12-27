/**
 * Subheading Image Processor for Blog Posts
 *
 * ZimmWriter places subheading images as local file paths in the markdown
 * after certain H2 headings. This processor:
 * 1. Parses the markdown to find which H2s should have images
 * 2. Uploads the provided images to blob storage
 * 3. Inserts <img> tags into the HTML after the corresponding H2 tags
 */

import { upload } from "@/lib/storage";

export interface SubheadingImageResult {
  modifiedHtml: string;
  imagesInserted: number;
  errors: string[];
}

/**
 * Detect image type from buffer magic bytes
 */
function detectImageType(buffer: Buffer): string {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return "jpg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "png";
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return "gif";
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return "webp";
  return "jpg"; // Default
}

/**
 * Parse markdown to find which H2 headings have images after them.
 * ZimmWriter format: H2 heading followed by a local file path on its own line.
 *
 * @param markdown - The markdown content
 * @returns Array of H2 heading texts that should have images
 */
export function findH2sWithImages(markdown: string): string[] {
  const h2sWithImages: string[] = [];

  // Pattern: ## Heading text\n\nC:\path\to\file.jpg or similar
  // Also handles paths without backslashes
  const lines = markdown.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? "";

    // Check if this is an H2 heading
    if (line.startsWith("## ")) {
      const headingText = line.replace(/^## /, "").trim();

      // Look at next non-empty lines for a file path
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const nextLine = lines[j]?.trim() ?? "";
        if (!nextLine) continue; // Skip empty lines

        // Check if it's a local file path (Windows or Unix style)
        if (
          nextLine.match(/^[A-Za-z]:\\/) || // Windows: C:\path
          nextLine.match(/^\/[\w]/) || // Unix: /path
          nextLine.match(/\.(jpg|jpeg|png|gif|webp)$/i) // Ends with image extension
        ) {
          h2sWithImages.push(headingText);
          break;
        }

        // If we hit actual content (not a path), stop looking
        if (nextLine.length > 0 && !nextLine.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          break;
        }
      }
    }
  }

  return h2sWithImages;
}

/**
 * Insert an image after an H2 heading in HTML content.
 *
 * @param html - The HTML content
 * @param headingText - The H2 heading text to find
 * @param imageUrl - The URL of the image to insert
 * @param altText - Alt text for the image
 * @returns Modified HTML or null if heading not found
 */
function insertImageAfterH2(
  html: string,
  headingText: string,
  imageUrl: string,
  altText: string
): string | null {
  // Find the H2 tag with this text (case-insensitive)
  // Pattern: <h2...>heading text</h2>
  const headingLower = headingText.toLowerCase();

  // Find all H2 tags
  const h2Pattern = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let match;
  let insertPosition = -1;

  while ((match = h2Pattern.exec(html)) !== null) {
    const h2Content = (match[1] ?? "").replace(/<[^>]+>/g, "").trim().toLowerCase();
    if (h2Content === headingLower || h2Content.includes(headingLower)) {
      // Found the heading, insert after the closing </h2>
      insertPosition = match.index + match[0].length;
      break;
    }
  }

  if (insertPosition === -1) {
    return null;
  }

  // Create the image tag with responsive styling
  const imgTag = `\n<figure class="my-6"><img src="${imageUrl}" alt="${altText}" class="w-full rounded-lg" loading="lazy" /></figure>`;

  // Insert the image
  return html.slice(0, insertPosition) + imgTag + html.slice(insertPosition);
}

/**
 * Process subheading images for a blog post.
 *
 * @param html - The HTML content
 * @param markdown - The markdown content (to find which H2s need images)
 * @param subheadingImages - Array of base64-encoded images in order
 * @param slug - The post slug for naming uploaded files
 * @returns Modified HTML with images inserted
 */
export async function processSubheadingImages(
  html: string,
  markdown: string,
  subheadingImages: string[],
  slug: string
): Promise<SubheadingImageResult> {
  const errors: string[] = [];
  let modifiedHtml = html;
  let imagesInserted = 0;

  if (!subheadingImages || subheadingImages.length === 0) {
    return { modifiedHtml: html, imagesInserted: 0, errors: [] };
  }

  // Find which H2s should have images
  const h2sWithImages = findH2sWithImages(markdown);

  if (h2sWithImages.length === 0) {
    return {
      modifiedHtml: html,
      imagesInserted: 0,
      errors: ["No H2 headings with image markers found in markdown"],
    };
  }

  // Process each image
  const imageCount = Math.min(subheadingImages.length, h2sWithImages.length);

  for (let i = 0; i < imageCount; i++) {
    const base64Data = subheadingImages[i];
    const headingText = h2sWithImages[i];

    if (!base64Data || !headingText) {
      errors.push(`Missing data for image ${i + 1}`);
      continue;
    }

    try {
      // Clean and decode base64
      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(cleanBase64, "base64");

      // Validate buffer
      if (buffer.length < 100) {
        errors.push(`Image ${i + 1} is too small (${buffer.length} bytes)`);
        continue;
      }

      // Upload to storage
      const ext = detectImageType(buffer);
      const filename = `${slug}-subheading-${i + 1}-${Date.now()}.${ext}`;
      const result = await upload(buffer, filename, "blog");

      // Generate alt text from heading
      const altText = `Illustration for ${headingText}`;

      // Insert into HTML
      const newHtml = insertImageAfterH2(
        modifiedHtml,
        headingText,
        result.url,
        altText
      );

      if (newHtml) {
        modifiedHtml = newHtml;
        imagesInserted++;
      } else {
        errors.push(`Could not find H2 heading: "${headingText}"`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to process image ${i + 1}: ${message}`);
    }
  }

  return {
    modifiedHtml,
    imagesInserted,
    errors,
  };
}
