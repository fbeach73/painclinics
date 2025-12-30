import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import {
  createBlogPost,
  setPostCategories,
  setPostTags,
  isSlugAvailable,
} from "@/lib/blog/blog-mutations";
import {
  getBlogPostsAdmin,
  getBlogPostCountsByStatus,
} from "@/lib/blog/blog-queries";

/**
 * GET /api/admin/blog/posts
 * List all blog posts for admin with filters
 */
export async function GET(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const status =
      (searchParams.get("status") as
        | "draft"
        | "published"
        | "archived"
        | "all") || "all";
    const search = searchParams.get("search") ?? undefined;
    const includeCounts = searchParams.get("includeCounts") === "true";

    const result = await getBlogPostsAdmin({ page, limit, status, search });

    // Optionally include status counts for tabs
    if (includeCounts) {
      const counts = await getBlogPostCountsByStatus();
      return NextResponse.json({ ...result, counts });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/blog/posts
 * Create a new blog post
 *
 * Body: { title, slug, content, excerpt?, metaTitle?, metaDescription?,
 *         featuredImageUrl?, featuredImageAlt?, authorName?, status, publishedAt?,
 *         categoryIds?, tagIds? }
 */
export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const body = await request.json();
    const { categoryIds, tagIds, ...postData } = body;

    // Validate required fields
    if (!postData.title || typeof postData.title !== "string") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!postData.slug || typeof postData.slug !== "string") {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(postData.slug)) {
      return NextResponse.json(
        {
          error:
            "Slug must contain only lowercase letters, numbers, and hyphens",
        },
        { status: 400 }
      );
    }

    // Check slug availability
    const slugAvailable = await isSlugAvailable(postData.slug);
    if (!slugAvailable) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 409 }
      );
    }

    if (!postData.content || typeof postData.content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["draft", "published", "archived"];
    if (!postData.status || !validStatuses.includes(postData.status)) {
      return NextResponse.json(
        { error: "Status must be one of: draft, published, archived" },
        { status: 400 }
      );
    }

    // Parse publishedAt if provided
    if (postData.publishedAt) {
      postData.publishedAt = new Date(postData.publishedAt);
    }

    // Create the post
    const postId = await createBlogPost(postData);

    // Set categories and tags if provided
    if (categoryIds?.length) {
      await setPostCategories(postId, categoryIds);
    }
    if (tagIds?.length) {
      await setPostTags(postId, tagIds);
    }

    return NextResponse.json({ id: postId }, { status: 201 });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return NextResponse.json(
      { error: "Failed to create blog post" },
      { status: 500 }
    );
  }
}
