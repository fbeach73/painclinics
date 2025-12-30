import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import {
  updateBlogPost,
  deleteBlogPost,
  setPostCategories,
  setPostTags,
  isSlugAvailable,
} from "@/lib/blog/blog-mutations";
import { getBlogPostById } from "@/lib/blog/blog-queries";

interface RouteParams {
  params: Promise<{ postId: string }>;
}

/**
 * GET /api/admin/blog/posts/[postId]
 * Get a single blog post by ID
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const { postId } = await params;
    const post = await getBlogPostById(postId);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/blog/posts/[postId]
 * Update a blog post
 *
 * Body: { title?, slug?, content?, excerpt?, metaTitle?, metaDescription?,
 *         featuredImageUrl?, featuredImageAlt?, authorName?, status?, publishedAt?,
 *         categoryIds?, tagIds? }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const { postId } = await params;

    // Check post exists
    const existingPost = await getBlogPostById(postId);
    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await request.json();
    const { categoryIds, tagIds, ...updateData } = body;

    // Validate slug format if provided
    if (updateData.slug) {
      if (!/^[a-z0-9-]+$/.test(updateData.slug)) {
        return NextResponse.json(
          {
            error:
              "Slug must contain only lowercase letters, numbers, and hyphens",
          },
          { status: 400 }
        );
      }

      // Check slug availability (excluding current post)
      const slugAvailable = await isSlugAvailable(updateData.slug, postId);
      if (!slugAvailable) {
        return NextResponse.json(
          { error: "A post with this slug already exists" },
          { status: 409 }
        );
      }
    }

    // Validate status if provided
    if (updateData.status) {
      const validStatuses = ["draft", "published", "archived"];
      if (!validStatuses.includes(updateData.status)) {
        return NextResponse.json(
          { error: "Status must be one of: draft, published, archived" },
          { status: 400 }
        );
      }
    }

    // Parse publishedAt if provided
    if (updateData.publishedAt) {
      updateData.publishedAt = new Date(updateData.publishedAt);
    } else if (updateData.publishedAt === null) {
      // Allow explicitly setting to null
      updateData.publishedAt = null;
    }

    // Update the post
    await updateBlogPost(postId, updateData);

    // Update categories if provided
    if (categoryIds !== undefined) {
      await setPostCategories(postId, categoryIds || []);
    }

    // Update tags if provided
    if (tagIds !== undefined) {
      await setPostTags(postId, tagIds || []);
    }

    // Return updated post
    const updatedPost = await getBlogPostById(postId);
    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error("Error updating blog post:", error);
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/blog/posts/[postId]
 * Delete a blog post
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const { postId } = await params;

    // Check post exists
    const existingPost = await getBlogPostById(postId);
    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await deleteBlogPost(postId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
