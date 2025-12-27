/**
 * AI Category & Tag Classifier for Blog Posts
 *
 * Uses AI to analyze blog post content and:
 * 1. Select the most appropriate category from existing categories
 * 2. Generate 1-3 relevant tags for the post
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";
import { getAllCategories, getAllTags } from "../blog-queries";
import {
  createTag,
  setPostCategories,
  setPostTags,
  isTagSlugAvailable,
} from "../blog-mutations";
import { generateSlug } from "@/lib/slug";

const AI_MODEL = "anthropic/claude-sonnet-4";

export interface CategoryClassifierResult {
  success: boolean;
  categoryId?: string;
  categoryName?: string;
  tagIds?: string[];
  tagNames?: string[];
  newTagsCreated?: string[];
  error?: string;
}

/**
 * Classify a blog post into a category and generate tags using AI
 *
 * @param title - Post title
 * @param excerpt - Post excerpt/summary
 * @param content - Full post HTML content (will be stripped for analysis)
 * @returns Classification result with category and tag IDs
 */
export async function classifyBlogPost(
  title: string,
  excerpt: string,
  content: string
): Promise<CategoryClassifierResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { success: false, error: "OpenRouter API key not configured" };
  }

  try {
    // Fetch existing categories and tags
    const [categories, existingTags] = await Promise.all([
      getAllCategories(),
      getAllTags(),
    ]);

    if (categories.length === 0) {
      return { success: false, error: "No categories found in database" };
    }

    // Strip HTML from content for analysis (keep first ~2000 chars)
    const plainContent = stripHtml(content).substring(0, 2000);

    // Build category options string
    const categoryOptions = categories
      .filter((c) => c.slug !== "uncategorized")
      .map((c) => `- "${c.name}" (${c.slug})`)
      .join("\n");

    // Build existing tags list
    const existingTagsList = existingTags.map((t) => t.name).join(", ");

    const openrouter = createOpenRouter({ apiKey });

    const systemPrompt = `You are a medical content classifier for a pain management clinic website. Your job is to categorize blog posts and suggest relevant tags.

Available Categories:
${categoryOptions}

Existing Tags (prefer these when applicable): ${existingTagsList || "None yet"}

Rules:
1. Select exactly ONE category that best matches the content
2. Suggest 1-3 tags that describe the specific topics covered
3. Tags should be specific and relevant (e.g., "chronic back pain", "spinal stenosis", "heat therapy")
4. Prefer existing tags when they fit, but suggest new ones if needed
5. Tags should be lowercase with proper spacing`;

    const userPrompt = `Classify this blog post:

Title: "${title}"
Summary: "${excerpt}"
Content preview: "${plainContent}"

Return the best category slug and 1-3 relevant tags.`;

    const result = await generateObject({
      model: openrouter(AI_MODEL),
      schema: z.object({
        categorySlug: z
          .string()
          .describe("The slug of the best matching category"),
        tags: z
          .array(z.string())
          .min(1)
          .max(3)
          .describe("1-3 relevant tags for this post"),
      }),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const { categorySlug, tags } = result.object;

    // Find the category ID
    const selectedCategory = categories.find((c) => c.slug === categorySlug);
    if (!selectedCategory) {
      // Fallback to Uncategorized if AI suggests invalid category
      const uncategorized = categories.find((c) => c.slug === "uncategorized");
      if (!uncategorized) {
        return { success: false, error: `Category not found: ${categorySlug}` };
      }
      return {
        success: true,
        categoryId: uncategorized.id,
        categoryName: uncategorized.name,
        tagIds: [],
        tagNames: [],
        newTagsCreated: [],
      };
    }

    // Process tags - find existing or create new
    const tagIds: string[] = [];
    const tagNames: string[] = [];
    const newTagsCreated: string[] = [];

    for (const tagName of tags) {
      const normalizedName = tagName.toLowerCase().trim();
      if (!normalizedName) continue;

      // Check if tag already exists (case-insensitive match)
      const existingTag = existingTags.find(
        (t) => t.name.toLowerCase() === normalizedName
      );

      if (existingTag) {
        tagIds.push(existingTag.id);
        tagNames.push(existingTag.name);
      } else {
        // Create new tag
        const tagSlug = generateSlug(normalizedName);

        // Check if slug is available (avoid duplicates)
        if (await isTagSlugAvailable(tagSlug)) {
          const newTag = await createTag(normalizedName, tagSlug);
          tagIds.push(newTag.id);
          tagNames.push(newTag.name);
          newTagsCreated.push(normalizedName);
        }
      }
    }

    return {
      success: true,
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      tagIds,
      tagNames,
      newTagsCreated,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Category classification failed:", error);
    return { success: false, error: message };
  }
}

/**
 * Classify and assign category/tags to a post
 *
 * Convenience function that classifies the post AND assigns
 * the category and tags to the post in the database.
 *
 * @param postId - The blog post ID
 * @param title - Post title
 * @param excerpt - Post excerpt
 * @param content - Post content
 */
export async function classifyAndAssignToPost(
  postId: string,
  title: string,
  excerpt: string,
  content: string
): Promise<CategoryClassifierResult> {
  const result = await classifyBlogPost(title, excerpt, content);

  if (!result.success) {
    return result;
  }

  // Assign category and tags to post
  if (result.categoryId) {
    await setPostCategories(postId, [result.categoryId]);
  }

  if (result.tagIds && result.tagIds.length > 0) {
    await setPostTags(postId, result.tagIds);
  }

  return result;
}

/**
 * Strip HTML tags from content for text analysis
 */
function stripHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
