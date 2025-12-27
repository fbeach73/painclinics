# ZimmWriter Blog Automation Webhook

This document describes how to configure ZimmWriter to automatically publish blog posts to the Pain Clinics website.

## Overview

The webhook endpoint receives content from ZimmWriter and creates draft blog posts with optional featured images. Authentication is handled via a secret token embedded in the URL path.

## Endpoint Details

| Property | Value |
|----------|-------|
| URL | `https://painclinics.com/api/webhooks/blog/{SECRET}` |
| Method | `POST` |
| Content-Type | `application/json` |
| Authentication | Secret token in URL path |

## ZimmWriter Configuration

1. In ZimmWriter, navigate to webhook settings
2. Configure the following:
   - **URL**: `https://painclinics.com/api/webhooks/blog/YOUR_SECRET_HERE`
   - **Method**: POST
   - **Content-Type**: `application/json`

> **Note**: The secret is embedded in the URL itself. Keep this URL private - anyone with the full URL can create draft posts.

## Request Payload

ZimmWriter sends the following JSON payload:

```json
{
  "webhook_name": "string",
  "title": "Blog Post Title",
  "markdown": "# Markdown Content\n\nFull post in markdown format.",
  "html": "<h1>HTML Content</h1><p>Full post in HTML format.</p>",
  "image_base64": "base64-encoded-image-data (optional)"
}
```

### Field Descriptions

| Field | Required | Description |
|-------|----------|-------------|
| `webhook_name` | No | Identifier for the webhook configuration |
| `title` | **Yes** | The blog post title |
| `markdown` | No | Post content in markdown format (used for excerpt extraction) |
| `html` | **Yes** | Post content in HTML format (stored as main content) |
| `image_base64` | No | Base64-encoded featured image (supports JPEG, PNG, GIF, WebP) |

## Response Codes

| Status | Meaning |
|--------|---------|
| `200` | Success - post created as draft |
| `400` | Missing required fields (title or html) |
| `401` | Invalid or missing webhook secret |
| `500` | Server error |

### Success Response

```json
{
  "success": true,
  "postId": "generated-post-id",
  "slug": "generated-url-slug"
}
```

### Error Response

```json
{
  "error": "Error message describing the issue"
}
```

## Health Check

A GET request to the endpoint returns the service status:

```bash
curl https://painclinics.com/api/webhooks/blog
```

Response:
```json
{
  "status": "ok",
  "endpoint": "blog-webhook",
  "timestamp": "2025-12-27T05:00:00.000Z"
}
```

## Testing

### Test with curl

```bash
# Test valid request (replace YOUR_SECRET with actual secret)
curl -X POST https://painclinics.com/api/webhooks/blog/YOUR_SECRET \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_name": "test",
    "title": "Test Blog Post",
    "markdown": "# Test\n\nThis is a test post.",
    "html": "<h1>Test</h1><p>This is a test post.</p>",
    "image_base64": ""
  }'

# Test invalid secret (should return 401)
curl -X POST https://painclinics.com/api/webhooks/blog/wrong-secret \
  -H "Content-Type: application/json" \
  -d '{"title": "Test"}'

# Health check (no auth required)
curl https://painclinics.com/api/webhooks/blog
```

## Post Processing

When a webhook is received:

1. **Secret Validation**: The `X-Webhook-Secret` header is validated using timing-safe comparison
2. **Slug Generation**: A URL-friendly slug is generated from the title (with uniqueness check)
3. **Image Processing**: If provided, the base64 image is decoded, type-detected, and uploaded to Vercel Blob storage
4. **Excerpt Extraction**: A 160-character excerpt is extracted from the markdown content
5. **Post Creation**: The post is saved as a **draft** in the database

## Environment Setup

Add the webhook secret to your environment variables:

```env
# .env.local
# Generate with: openssl rand -hex 32
BLOG_WEBHOOK_SECRET=your-32-character-hex-secret
```

## Security Notes

- The webhook secret should be a strong, random value (use `openssl rand -hex 32`)
- Timing-safe comparison prevents timing attacks on the secret
- All posts are created as drafts and require manual review before publishing
- Image uploads are validated by magic bytes to prevent malformed data
