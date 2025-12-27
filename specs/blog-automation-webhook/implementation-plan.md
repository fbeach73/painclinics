# Implementation Plan: Blog Automation Webhook

## Overview

Build a webhook endpoint at `/api/webhooks/blog` that receives content from ZimmWriter and creates draft blog posts with uploaded featured images.

## Phase 1: Environment Setup

Set up the required environment variable for webhook authentication.

### Tasks

- [x] Add `BLOG_WEBHOOK_SECRET` to `.env.local`
- [x] Add `BLOG_WEBHOOK_SECRET` documentation to `.env.example`

### Technical Details

**Environment variable:**
```env
# Blog Automation Webhook
# Generate with: openssl rand -hex 32
BLOG_WEBHOOK_SECRET=your-32-character-secret-here
```

**Add to `.env.example`:**
```env
# Blog Automation Webhook (ZimmWriter integration)
BLOG_WEBHOOK_SECRET=
```

## Phase 2: Webhook Endpoint Implementation

Create the main webhook handler with all required functionality.

### Tasks

- [x] Create `/api/webhooks/blog/route.ts` with POST handler [complex]
  - [x] Implement secret validation function
  - [x] Implement image processing (base64 decode, type detection, upload)
  - [x] Implement unique slug generation
  - [x] Implement excerpt extraction from markdown
  - [x] Implement main POST handler that orchestrates all steps
- [x] Add GET handler for health check

### Technical Details

**File to create:** `src/app/api/webhooks/blog/route.ts`

**ZimmWriter Payload Interface:**
```typescript
interface ZimmWriterPayload {
  webhook_name: string;
  title: string;
  markdown: string;
  html: string;
  image_base64: string;
}
```

**Secret Validation (timing-safe):**
```typescript
function validateWebhookSecret(request: NextRequest): boolean {
  const secret = request.headers.get("X-Webhook-Secret");
  const expectedSecret = process.env.BLOG_WEBHOOK_SECRET;

  if (!expectedSecret || !secret) return false;
  if (secret.length !== expectedSecret.length) return false;

  let result = 0;
  for (let i = 0; i < secret.length; i++) {
    result |= secret.charCodeAt(i) ^ expectedSecret.charCodeAt(i);
  }
  return result === 0;
}
```

**Image Type Detection (magic bytes):**
```typescript
function detectImageType(buffer: Buffer): string {
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) return "jpg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return "png";
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return "gif";
  if (buffer[0] === 0x52 && buffer[1] === 0x49) return "webp";
  return "jpg"; // Default
}
```

**Image Processing:**
```typescript
async function processImage(base64Data: string, slug: string): Promise<string | null> {
  if (!base64Data) return null;

  try {
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    const ext = detectImageType(buffer);
    const filename = `${slug}-${Date.now()}.${ext}`;
    const result = await upload(buffer, filename, "blog");
    return result.url;
  } catch (error) {
    console.error("Image processing failed:", error);
    return null;
  }
}
```

**Unique Slug Generation:**
```typescript
async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;

  while (!(await isSlugAvailable(slug))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
    if (counter > 100) {
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }
  return slug;
}
```

**Excerpt Extraction:**
```typescript
function extractExcerpt(markdown: string, maxLength = 160): string {
  let text = markdown
    .replace(/^#+ .+$/gm, "")           // Remove headings
    .replace(/\*\*(.+?)\*\*/g, "$1")    // Remove bold
    .replace(/\*(.+?)\*/g, "$1")        // Remove italic
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // Remove links
    .replace(/!\[.+?\]\(.+?\)/g, "")    // Remove images
    .replace(/`(.+?)`/g, "$1")          // Remove inline code
    .replace(/^\s*[-*+] /gm, "")        // Remove list markers
    .replace(/\n+/g, " ")               // Collapse newlines
    .replace(/\s+/g, " ")               // Collapse whitespace
    .trim();

  if (text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "...";
}
```

**Imports Required:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { createBlogPost, isSlugAvailable } from "@/lib/blog/blog-mutations";
import { upload } from "@/lib/storage";
import { generateSlug } from "@/lib/slug";
```

**Response Codes:**
| Status | Condition |
|--------|-----------|
| 200 | Success with `{ success: true, postId, slug }` |
| 400 | Missing title or html |
| 401 | Invalid/missing secret |
| 500 | Database or server error |

## Phase 3: Testing & Documentation

Verify the endpoint works and document configuration.

### Tasks

- [x] Test webhook endpoint with curl
- [x] Verify posts appear in admin dashboard as drafts
- [x] Document ZimmWriter configuration in README or docs

### Technical Details

**Test with curl:**
```bash
# Test valid request
curl -X POST http://localhost:3000/api/webhooks/blog \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-secret" \
  -d '{
    "webhook_name": "test",
    "title": "Test Blog Post",
    "markdown": "# Test\n\nThis is a test post with **bold** text.",
    "html": "<h1>Test</h1><p>This is a test post with <strong>bold</strong> text.</p>",
    "image_base64": ""
  }'

# Test invalid secret (should return 401)
curl -X POST http://localhost:3000/api/webhooks/blog \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: wrong-secret" \
  -d '{"title": "Test"}'

# Test missing fields (should return 400)
curl -X POST http://localhost:3000/api/webhooks/blog \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-secret" \
  -d '{}'
```

**ZimmWriter Configuration:**
- URL: `https://your-domain.com/api/webhooks/blog`
- Method: POST
- Headers: `X-Webhook-Secret: your-secret-here`
- Content-Type: `application/json`

**Verification Checklist:**
1. Check database for new blog post with status "draft"
2. Verify slug is correctly generated and unique
3. Verify excerpt is properly extracted
4. Check Vercel Blob for uploaded image
5. Verify featured image URL is stored in database
