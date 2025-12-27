import { NextRequest, NextResponse } from "next/server";
import { createBlogPost, isSlugAvailable } from "@/lib/blog/blog-mutations";
import { generateSlug } from "@/lib/slug";
import { upload } from "@/lib/storage";

/**
 * ZimmWriter webhook payload interface
 */
interface ZimmWriterPayload {
  webhook_name: string;
  title: string;
  markdown: string;
  html: string;
  image_base64: string;
}

/**
 * Validate webhook secret from URL path using timing-safe comparison
 */
function validateSecret(secret: string): boolean {
  const expectedSecret = process.env.BLOG_WEBHOOK_SECRET;

  if (!expectedSecret || !secret) return false;
  if (secret.length !== expectedSecret.length) return false;

  let result = 0;
  for (let i = 0; i < secret.length; i++) {
    result |= secret.charCodeAt(i) ^ expectedSecret.charCodeAt(i);
  }
  return result === 0;
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
 * Process base64 image and upload to storage
 */
async function processImage(
  base64Data: string,
  slug: string
): Promise<string | null> {
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

/**
 * Generate a unique slug, appending counter if needed
 */
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

/**
 * Extract a plain text excerpt from markdown content
 */
function extractExcerpt(markdown: string, maxLength = 160): string {
  const text = markdown
    .replace(/^#+ .+$/gm, "") // Remove headings
    .replace(/\*\*(.+?)\*\*/g, "$1") // Remove bold
    .replace(/\*(.+?)\*/g, "$1") // Remove italic
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // Remove links
    .replace(/!\[.+?\]\(.+?\)/g, "") // Remove images
    .replace(/`(.+?)`/g, "$1") // Remove inline code
    .replace(/^\s*[-*+] /gm, "") // Remove list markers
    .replace(/\n+/g, " ") // Collapse newlines
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();

  if (text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "...";
}

/**
 * Handle incoming blog post from ZimmWriter
 * Secret is validated from URL path parameter
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;

  // Validate webhook secret from URL
  if (!validateSecret(secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as ZimmWriterPayload;

    // Validate required fields
    if (!payload.title || !payload.html) {
      return NextResponse.json(
        { error: "Missing required fields: title and html are required" },
        { status: 400 }
      );
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(payload.title);

    // Process featured image if provided
    const featuredImageUrl = await processImage(payload.image_base64, slug);

    // Extract excerpt from markdown
    const excerpt = extractExcerpt(payload.markdown || payload.html);

    // Create draft blog post
    const postId = await createBlogPost({
      title: payload.title,
      slug,
      content: payload.html,
      excerpt,
      ...(featuredImageUrl && { featuredImageUrl }),
      status: "draft",
    });

    return NextResponse.json({
      success: true,
      postId,
      slug,
    });
  } catch (error) {
    console.error("Webhook processing failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
