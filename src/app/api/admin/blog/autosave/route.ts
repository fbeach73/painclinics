import { NextRequest, NextResponse } from "next/server";

import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getBlogPostById } from "@/lib/blog/blog-queries";
import { updateBlogPost } from "@/lib/blog/blog-mutations";

/**
 * POST /api/admin/blog/autosave
 * Auto-save a blog post draft
 *
 * Body: { postId, title?, content?, excerpt? }
 */
export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const body = await request.json();
    const { postId, title, content, excerpt } = body;

    if (!postId || typeof postId !== "string") {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Check post exists
    const existingPost = await getBlogPostById(postId);
    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Build update object with only provided fields
    const updateData: {
      title?: string;
      content?: string;
      excerpt?: string;
    } = {};

    if (title !== undefined) {
      updateData.title = title;
    }
    if (content !== undefined) {
      updateData.content = content;
    }
    if (excerpt !== undefined) {
      updateData.excerpt = excerpt;
    }

    // Only update if there's something to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true, message: "Nothing to save" });
    }

    await updateBlogPost(postId, updateData);

    return NextResponse.json({
      success: true,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error auto-saving blog post:", error);
    return NextResponse.json(
      { error: "Failed to auto-save blog post" },
      { status: 500 }
    );
  }
}
