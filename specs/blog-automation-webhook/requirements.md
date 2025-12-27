# Requirements: Blog Automation Webhook

## Overview

Create a webhook endpoint that receives blog content from ZimmWriter (desktop/macbook app) and automatically creates draft blog posts in the application.

## Background

The user currently creates content in ZimmWriter and sends it to n8n via webhook. This feature enables direct integration with the application, eliminating the n8n middleman for simpler, more reliable automation.

## User Decisions

- **Integration approach:** Direct API endpoint (not via n8n)
- **Post status:** Create as draft (for manual review before publishing)
- **Image handling:** Upload to Vercel Blob storage
- **Security:** Require secret key validation

## Functional Requirements

### FR1: Webhook Endpoint
- Accept POST requests at `/api/webhooks/blog`
- Parse JSON payload from ZimmWriter containing:
  - `webhook_name` - Identifier for the webhook source
  - `title` - Article title
  - `markdown` - Content in markdown format
  - `html` - Content in HTML format
  - `image_base64` - Base64-encoded featured image

### FR2: Security
- Validate `X-Webhook-Secret` header against environment variable
- Return 401 Unauthorized if secret is missing or invalid
- Use timing-safe comparison to prevent timing attacks

### FR3: Image Processing
- Decode base64 image data
- Detect image type from magic bytes (JPEG, PNG, GIF, WebP)
- Upload to Vercel Blob storage (or local in dev)
- Continue without image if upload fails (log warning)

### FR4: Post Creation
- Generate URL-safe slug from title
- Ensure slug uniqueness (append counter if collision)
- Extract excerpt from markdown (first 160 chars)
- Create blog post with status "draft"
- Store featured image URL if available

## Acceptance Criteria

- [ ] POST to `/api/webhooks/blog` with valid secret creates a draft post
- [ ] Invalid/missing secret returns 401 Unauthorized
- [ ] Missing required fields (title, html) returns 400 Bad Request
- [ ] Base64 images are uploaded to Vercel Blob
- [ ] Duplicate titles result in unique slugs (e.g., `my-post-1`, `my-post-2`)
- [ ] Posts appear in admin blog list with "draft" status
- [ ] Response includes `postId` and `slug` for confirmation

## Dependencies

- Existing blog infrastructure (`src/lib/blog/blog-mutations.ts`)
- Storage utilities (`src/lib/storage.ts`)
- Slug generation (`src/lib/slug.ts`)

## Related Features

- Blog post management (already implemented)
- WordPress migration system (similar pattern)
- Mailgun webhook (reference implementation)
