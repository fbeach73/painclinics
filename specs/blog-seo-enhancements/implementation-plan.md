# Implementation Plan: Blog SEO Enhancements

## Overview

Add three SEO enhancements to the ZimmWriter blog webhook:
1. FAQ Schema detection and JSON-LD output
2. Automatic internal linking (2-3 links per post)
3. AI-generated alt text for featured images

---

## Phase 1: FAQ Schema Extraction

Extract FAQ content from blog posts and generate structured data at render time.

### Tasks

- [x] Create `src/lib/blog/seo/faq-extractor.ts` with FAQ detection logic
- [x] Modify `src/app/blog/[slug]/page.tsx` to output FAQ JSON-LD schema

### Technical Details

**File:** `src/lib/blog/seo/faq-extractor.ts`

```typescript
export interface ExtractedFAQ {
  question: string;
  answer: string;
}

/**
 * Extract FAQs from HTML content
 * Detection: H2 headings ending with "?" followed by content until next heading
 */
export function extractFAQsFromContent(html: string): ExtractedFAQ[];

/**
 * Check if content has extractable FAQs
 */
export function hasFAQContent(html: string): boolean;
```

**Algorithm:**
1. Use regex to find `<h2>` tags ending with `?`
2. Extract text between that H2 and next `<h2>` or `<h3>` or end of content
3. Strip HTML tags from answer, limit to 500 characters
4. Return array of `{question, answer}` pairs

**Modify `src/app/blog/[slug]/page.tsx`:**
- Import `extractFAQsFromContent`
- After building Article jsonLd, extract FAQs
- Use existing `generateFAQStructuredData()` from `src/lib/structured-data.ts`
- Render second `<script type="application/ld+json">` if FAQs exist

**FAQ Schema Format:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is chronic pain?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Chronic pain is..."
      }
    }
  ]
}
```

---

## Phase 2: Internal Linking System

Add automatic internal links to blog posts at webhook time.

### Tasks

- [x] Add `getPostsForInterlinking()` query to `src/lib/blog/blog-queries.ts`
- [x] Create `src/lib/blog/seo/interlinker.ts` with linking logic [complex]
  - [x] Implement keyword extraction from titles
  - [x] Implement candidate scoring (categories + keywords)
  - [x] Implement link insertion into HTML
- [x] Create `src/lib/blog/seo/index.ts` for exports

### Technical Details

**Add to `src/lib/blog/blog-queries.ts`:**

```typescript
/**
 * Get minimal post data for interlinking
 */
export async function getPostsForInterlinking(): Promise<{
  id: string;
  title: string;
  slug: string;
  categoryIds: string[];
}[]> {
  const posts = await db.query.blogPosts.findMany({
    where: and(
      eq(schema.blogPosts.status, "published"),
      lte(schema.blogPosts.publishedAt, new Date())
    ),
    columns: { id: true, title: true, slug: true },
    with: {
      postCategories: {
        columns: { categoryId: true }
      }
    }
  });

  return posts.map(p => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    categoryIds: p.postCategories.map(pc => pc.categoryId)
  }));
}
```

**File:** `src/lib/blog/seo/interlinker.ts`

```typescript
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

// Stop words to exclude from keyword extraction
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "must", "shall", "can", "need",
  "how", "what", "why", "when", "where", "who", "which", "this", "that",
  "these", "those", "it", "its", "your", "you", "we", "our", "their"
]);

export function extractKeywordsFromTitle(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 3 && !STOP_WORDS.has(word));
}

export function scoreLinkCandidate(
  sourceContent: string,
  sourceCategories: string[],
  candidate: LinkCandidate
): number {
  let score = 0;
  const contentLower = sourceContent.toLowerCase();

  // +2 per shared category
  for (const catId of candidate.categoryIds) {
    if (sourceCategories.includes(catId)) score += 2;
  }

  // +1 per keyword found in content
  for (const keyword of candidate.keywords) {
    if (contentLower.includes(keyword)) score += 1;
  }

  return score;
}

export async function addInternalLinks(
  html: string,
  currentPostTitle: string,
  categoryIds: string[],
  options: { maxLinks?: number } = {}
): Promise<InterlinkerResult>;
```

**Link Insertion Algorithm:**
1. Get all published posts via `getPostsForInterlinking()`
2. Extract keywords from each candidate title
3. Score each candidate (exclude current post by title match)
4. Take top N candidates (default 3)
5. For each candidate:
   - Search for candidate title or keywords in `<p>` tags
   - Skip if inside existing `<a>` tag
   - Replace first occurrence with linked version
6. Return modified HTML and stats

**Regex for safe insertion:**
```typescript
// Find text in paragraphs, not already linked
const pattern = new RegExp(
  `(<p[^>]*>(?:(?!<a)[^<])*)(${escapeRegex(linkText)})((?:(?!<\/a>)[^<])*<\/p>)`,
  'i'
);
```

---

## Phase 3: AI Alt Text Generation

Generate descriptive alt text using OpenRouter vision model.

### Tasks

- [x] Create `src/lib/blog/seo/alt-text-generator.ts` with vision API integration
- [x] Handle rate limiting and error cases

### Technical Details

**File:** `src/lib/blog/seo/alt-text-generator.ts`

```typescript
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";

const VISION_MODEL = "anthropic/claude-sonnet-4";

export interface AltTextResult {
  success: boolean;
  altText?: string;
  error?: string;
}

export async function generateAltTextFromBase64(
  base64Data: string,
  postTitle: string,
  context?: { excerpt?: string }
): Promise<AltTextResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { success: false, error: "OpenRouter API key not configured" };
  }

  try {
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

    const result = await generateText({
      model: openrouter(VISION_MODEL),
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            { type: "image", image: base64Data },
          ],
        },
      ],
    });

    const altText = result.text.trim().replace(/^["']|["']$/g, "");
    return { success: true, altText };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

---

## Phase 4: SEO Processor & Webhook Integration

Orchestrate all SEO enhancements and integrate into webhook.

### Tasks

- [x] Create `src/lib/blog/seo-processor.ts` to orchestrate all SEO features
- [x] Modify `src/app/api/webhooks/blog/[secret]/route.ts` to use SEO processor
- [x] Update webhook response to include SEO stats

### Technical Details

**File:** `src/lib/blog/seo-processor.ts`

```typescript
import { addInternalLinks, InterlinkerResult } from "./seo/interlinker";
import { generateAltTextFromBase64, AltTextResult } from "./seo/alt-text-generator";

export interface SEOProcessingResult {
  content: string;
  featuredImageAlt?: string;
  interlinking: InterlinkerResult;
  altTextGeneration?: AltTextResult;
  errors: string[];
}

export async function processBlogSEO(options: {
  html: string;
  title: string;
  excerpt?: string;
  imageBase64?: string;
  categoryIds?: string[];
}): Promise<SEOProcessingResult> {
  const errors: string[] = [];
  let content = options.html;
  let featuredImageAlt: string | undefined;
  let interlinkResult: InterlinkerResult = {
    modifiedHtml: content,
    linksAdded: 0,
    linkedSlugs: [],
  };

  // 1. Add internal links
  try {
    interlinkResult = await addInternalLinks(
      content,
      options.title,
      options.categoryIds || [],
      { maxLinks: 3 }
    );
    content = interlinkResult.modifiedHtml;
  } catch (error) {
    errors.push(`Interlinking failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  // 2. Generate alt text
  if (options.imageBase64) {
    try {
      const altResult = await generateAltTextFromBase64(
        options.imageBase64,
        options.title,
        { excerpt: options.excerpt }
      );
      if (altResult.success && altResult.altText) {
        featuredImageAlt = altResult.altText;
      } else if (altResult.error) {
        errors.push(`Alt text generation failed: ${altResult.error}`);
      }
    } catch (error) {
      errors.push(`Alt text error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    content,
    featuredImageAlt,
    interlinking: interlinkResult,
    errors,
  };
}
```

**Modify `src/app/api/webhooks/blog/[secret]/route.ts`:**

```typescript
// Add import
import { processBlogSEO } from "@/lib/blog/seo-processor";

// In POST handler, after image processing:
const seoResult = await processBlogSEO({
  html: payload.html,
  title: payload.title,
  excerpt,
  imageBase64: payload.image_base64 || undefined,
  categoryIds: [],
});

if (seoResult.errors.length > 0) {
  console.warn("SEO processing warnings:", seoResult.errors);
}

// Use enhanced content
const postId = await createBlogPost({
  title: payload.title,
  slug,
  content: seoResult.content,
  excerpt,
  ...(featuredImageUrl && { featuredImageUrl }),
  ...(seoResult.featuredImageAlt && { featuredImageAlt: seoResult.featuredImageAlt }),
  status: "draft",
});

// Enhanced response
return NextResponse.json({
  success: true,
  postId,
  slug,
  seo: {
    linksAdded: seoResult.interlinking.linksAdded,
    linkedSlugs: seoResult.interlinking.linkedSlugs,
    altTextGenerated: !!seoResult.featuredImageAlt,
    warnings: seoResult.errors,
  },
});
```

---

## : Testing & Deployment

Verify all features work and deploy to production.

### Tasks

- [x] Run `pnpm lint && pnpm typecheck`
- [x] Test FAQ extraction with sample content
- [x] Test interlinking with webhook POST
- [x] Test alt text generation with image
- [x] Commit and push to deploy
- [x] Verify production deployment

### Technical Details

**Test FAQ extraction:**
```bash
# Create a test post with Q&A content via webhook
curl -X POST "http://localhost:3000/api/webhooks/blog/SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "FAQ Test Post",
    "markdown": "## What is chronic pain?\n\nChronic pain lasts more than 3 months...",
    "html": "<h2>What is chronic pain?</h2><p>Chronic pain lasts more than 3 months...</p>",
    "image_base64": ""
  }'
```

**Verify FAQ schema in page source:**
- Visit `/blog/{slug}`
- View source, search for "FAQPage"
- Validate at https://search.google.com/test/rich-results

**Test interlinking:**
- Create post via webhook
- Check response for `seo.linksAdded` count
- View post content in admin to verify links

**Test alt text:**
- Include base64 image in webhook payload
- Check response for `seo.altTextGenerated: true`
- Verify `featuredImageAlt` in database
