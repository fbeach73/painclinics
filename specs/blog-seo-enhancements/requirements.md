# Requirements: Blog SEO Enhancements

## Overview

Enhance the ZimmWriter blog webhook with three SEO features that improve search visibility and user engagement:
1. FAQ Schema markup for Q&A content
2. Automatic internal linking between related posts
3. AI-generated alt text for featured images

## Background

The blog webhook (`/api/webhooks/blog/[secret]`) receives content from ZimmWriter and creates draft blog posts. Currently it handles title, HTML content, markdown, and base64 images. These enhancements will add SEO value automatically during post creation.

## Feature 1: FAQ Schema Markup

### Description
Detect FAQ-style content (questions and answers) in blog posts and output structured data (JSON-LD) for Google's FAQ rich results.

### Requirements
- Detect H2 headings ending with `?` as questions
- Extract following content (until next heading) as answers
- Generate FAQPage JSON-LD schema at render time
- Output alongside existing Article schema

### Acceptance Criteria
- [ ] Blog posts with `## Question?` format show FAQ schema in page source
- [ ] FAQ schema validates in Google Rich Results Test
- [ ] Posts without questions render normally (no FAQ schema)
- [ ] Malformed HTML doesn't crash the extractor

## Feature 2: Automatic Internal Linking

### Description
Automatically insert 2-3 relevant internal links into blog post content at webhook time, improving SEO link equity and user engagement.

### Requirements
- Process at webhook time (links baked into content)
- Conservative linking: 2-3 links maximum per post
- Match by category overlap and keyword relevance
- Insert links naturally in paragraph text
- Avoid double-linking already-linked text
- Never self-link to the current post

### Acceptance Criteria
- [ ] New posts receive 2-3 internal links when relevant posts exist
- [ ] Links point to correct `/blog/{slug}` URLs
- [ ] No links added if no relevant posts found
- [ ] Existing anchor tags are not modified
- [ ] Webhook response includes link count

## Feature 3: AI-Powered Image Alt Text

### Description
Generate descriptive, SEO-friendly alt text for featured images using AI vision capabilities.

### Requirements
- Generate at webhook time using OpenRouter vision model
- Use Claude Sonnet 4 (vision-capable) via existing OpenRouter integration
- Alt text should be 10-15 words, descriptive, no "Image of" prefix
- Store in existing `featuredImageAlt` database field
- Fail gracefully if AI unavailable

### Acceptance Criteria
- [ ] Featured images receive AI-generated alt text
- [ ] Alt text is descriptive and contextually relevant to post
- [ ] Missing API key doesn't block post creation
- [ ] Rate limiting prevents API abuse
- [ ] Webhook response indicates if alt text was generated

## Non-Functional Requirements

### Error Handling
- All SEO enhancements fail gracefully
- Failures logged but never block post creation
- Webhook response includes any warnings

### Performance
- Interlinking query should complete in <100ms
- Alt text generation may take 1-3 seconds (acceptable for webhook)
- FAQ extraction at render time adds minimal overhead

### Cost
- Alt text generation: ~$0.002 per image
- Interlinking: No cost (database query)
- FAQ schema: No cost (render-time extraction)

## Dependencies

- Existing blog webhook at `/api/webhooks/blog/[secret]`
- Existing OpenRouter integration with `OPENROUTER_API_KEY`
- Existing `featuredImageAlt` field in blog schema
- Existing `generateFAQStructuredData()` in `src/lib/structured-data.ts`

## Out of Scope

- Batch processing existing posts (future enhancement)
- Admin UI for reviewing/editing auto-generated content
- A/B testing different linking strategies
- Image compression or optimization
