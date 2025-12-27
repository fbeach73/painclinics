/**
 * AI-powered alt text generation for blog featured images
 *
 * Uses OpenRouter vision model to analyze images and generate
 * SEO-optimized alt text based on visual content and post context.
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

const VISION_MODEL = "anthropic/claude-sonnet-4";

// Rate limiting configuration
const RATE_LIMIT = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

export interface AltTextResult {
  success: boolean;
  altText?: string;
  error?: string;
}

export interface AltTextContext {
  excerpt?: string;
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay with jitter
 */
function getBackoffDelay(attempt: number): number {
  const delay = Math.min(
    RATE_LIMIT.baseDelayMs * Math.pow(2, attempt),
    RATE_LIMIT.maxDelayMs
  );
  // Add jitter (0-25% of delay)
  const jitter = delay * 0.25 * Math.random();
  return delay + jitter;
}

/**
 * Check if an error is a rate limit error
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("rate limit") ||
      message.includes("429") ||
      message.includes("too many requests")
    );
  }
  return false;
}

/**
 * Generate alt text from a base64 encoded image using vision AI
 *
 * @param base64Data - Base64 encoded image data (with or without data URI prefix)
 * @param postTitle - Title of the blog post for context
 * @param context - Additional context like excerpt
 * @returns Result with generated alt text or error
 */
export async function generateAltTextFromBase64(
  base64Data: string,
  postTitle: string,
  context?: AltTextContext
): Promise<AltTextResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { success: false, error: "OpenRouter API key not configured" };
  }

  // Validate base64 data
  if (!base64Data || base64Data.trim().length === 0) {
    return { success: false, error: "No image data provided" };
  }

  const openrouter = createOpenRouter({ apiKey });

  const systemPrompt = `You are an SEO expert. Generate concise, descriptive alt text for images.
Rules:
- 10-15 words maximum
- Be descriptive but concise
- Include relevant keywords naturally
- Don't start with "Image of" or "Picture of"
- Focus on what's visually depicted`;

  const userPrompt = `Generate alt text for this featured image.
Blog post title: "${postTitle}"
${context?.excerpt ? `Post excerpt: "${context.excerpt}"` : ""}

Respond with ONLY the alt text, no quotes or explanation.`;

  // Ensure base64 data has proper format
  let imageData = base64Data;
  if (!base64Data.startsWith("data:")) {
    // Assume JPEG if no data URI prefix
    imageData = `data:image/jpeg;base64,${base64Data}`;
  }

  // Attempt with retries for rate limiting
  for (let attempt = 0; attempt < RATE_LIMIT.maxRetries; attempt++) {
    try {
      const result = await generateText({
        model: openrouter(VISION_MODEL),
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image", image: imageData },
            ],
          },
        ],
      });

      // Clean up the response
      const altText = result.text
        .trim()
        .replace(/^["']|["']$/g, "") // Remove quotes
        .replace(/\n/g, " ") // Remove newlines
        .trim();

      if (!altText) {
        return { success: false, error: "Empty response from AI" };
      }

      return { success: true, altText };
    } catch (error) {
      // Handle rate limiting with retry
      if (isRateLimitError(error) && attempt < RATE_LIMIT.maxRetries - 1) {
        const delay = getBackoffDelay(attempt);
        console.warn(
          `Alt text generation rate limited, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${RATE_LIMIT.maxRetries})`
        );
        await sleep(delay);
        continue;
      }

      // Log error for debugging
      console.error("Alt text generation failed:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return {
    success: false,
    error: "Max retries exceeded due to rate limiting",
  };
}

/**
 * Generate alt text from an image URL
 *
 * @param imageUrl - URL of the image to analyze
 * @param postTitle - Title of the blog post for context
 * @param context - Additional context like excerpt
 * @returns Result with generated alt text or error
 */
export async function generateAltTextFromUrl(
  imageUrl: string,
  postTitle: string,
  context?: AltTextContext
): Promise<AltTextResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { success: false, error: "OpenRouter API key not configured" };
  }

  // Validate URL
  if (!imageUrl || !imageUrl.startsWith("http")) {
    return { success: false, error: "Invalid image URL" };
  }

  const openrouter = createOpenRouter({ apiKey });

  const systemPrompt = `You are an SEO expert. Generate concise, descriptive alt text for images.
Rules:
- 10-15 words maximum
- Be descriptive but concise
- Include relevant keywords naturally
- Don't start with "Image of" or "Picture of"
- Focus on what's visually depicted`;

  const userPrompt = `Generate alt text for this featured image.
Blog post title: "${postTitle}"
${context?.excerpt ? `Post excerpt: "${context.excerpt}"` : ""}

Respond with ONLY the alt text, no quotes or explanation.`;

  // Attempt with retries for rate limiting
  for (let attempt = 0; attempt < RATE_LIMIT.maxRetries; attempt++) {
    try {
      const result = await generateText({
        model: openrouter(VISION_MODEL),
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image", image: new URL(imageUrl) },
            ],
          },
        ],
      });

      // Clean up the response
      const altText = result.text
        .trim()
        .replace(/^["']|["']$/g, "")
        .replace(/\n/g, " ")
        .trim();

      if (!altText) {
        return { success: false, error: "Empty response from AI" };
      }

      return { success: true, altText };
    } catch (error) {
      // Handle rate limiting with retry
      if (isRateLimitError(error) && attempt < RATE_LIMIT.maxRetries - 1) {
        const delay = getBackoffDelay(attempt);
        console.warn(
          `Alt text generation rate limited, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${RATE_LIMIT.maxRetries})`
        );
        await sleep(delay);
        continue;
      }

      console.error("Alt text generation failed:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return {
    success: false,
    error: "Max retries exceeded due to rate limiting",
  };
}
