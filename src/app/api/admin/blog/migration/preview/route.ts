import { NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getBlogPostByWpId, getCategoryByWpId, getTagByWpId } from "@/lib/blog/blog-queries";
import {
  fetchWPPosts,
  fetchAllWPCategories,
  fetchAllWPTags,
  decodeHtmlEntities,
  getFeaturedImageFromPost,
} from "@/lib/blog/wordpress-api";

interface PreviewPost {
  wpId: number;
  title: string;
  slug: string;
  publishedAt: string;
  status: "new" | "existing";
  featuredImage: string | null;
  categories: number[];
  tags: number[];
}

interface PreviewCategory {
  wpId: number;
  name: string;
  slug: string;
  parent: number;
  status: "new" | "existing";
}

interface PreviewTag {
  wpId: number;
  name: string;
  slug: string;
  status: "new" | "existing";
}

/**
 * GET /api/admin/blog/migration/preview
 * Preview what will be imported from WordPress
 * Query params:
 * - page: Page number for posts (default: 1)
 * - perPage: Posts per page (default: 20)
 */
export async function GET(request: Request) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "20");

  try {
    // Fetch data from WordPress in parallel
    const [postsResponse, wpCategories, wpTags] = await Promise.all([
      fetchWPPosts(page, perPage),
      fetchAllWPCategories(),
      fetchAllWPTags(),
    ]);

    // Check which posts already exist
    const previewPosts: PreviewPost[] = await Promise.all(
      postsResponse.posts.map(async (post) => {
        const existing = await getBlogPostByWpId(post.id);
        const featuredImage = getFeaturedImageFromPost(post);

        return {
          wpId: post.id,
          title: decodeHtmlEntities(post.title.rendered),
          slug: post.slug,
          publishedAt: post.date,
          status: existing ? "existing" : "new",
          featuredImage: featuredImage.url,
          categories: post.categories,
          tags: post.tags,
        };
      })
    );

    // Check which categories already exist
    const previewCategories: PreviewCategory[] = await Promise.all(
      wpCategories.map(async (cat) => {
        const existing = await getCategoryByWpId(cat.id);
        return {
          wpId: cat.id,
          name: decodeHtmlEntities(cat.name),
          slug: cat.slug,
          parent: cat.parent,
          status: existing ? "existing" : "new",
        };
      })
    );

    // Check which tags already exist
    const previewTags: PreviewTag[] = await Promise.all(
      wpTags.map(async (tag) => {
        const existing = await getTagByWpId(tag.id);
        return {
          wpId: tag.id,
          name: decodeHtmlEntities(tag.name),
          slug: tag.slug,
          status: existing ? "existing" : "new",
        };
      })
    );

    // Calculate stats
    const stats = {
      posts: {
        total: postsResponse.totalPosts,
        new: previewPosts.filter((p) => p.status === "new").length,
        existing: previewPosts.filter((p) => p.status === "existing").length,
        pages: postsResponse.totalPages,
        currentPage: page,
      },
      categories: {
        total: wpCategories.length,
        new: previewCategories.filter((c) => c.status === "new").length,
        existing: previewCategories.filter((c) => c.status === "existing").length,
      },
      tags: {
        total: wpTags.length,
        new: previewTags.filter((t) => t.status === "new").length,
        existing: previewTags.filter((t) => t.status === "existing").length,
      },
    };

    return NextResponse.json({
      success: true,
      stats,
      posts: previewPosts,
      categories: previewCategories,
      tags: previewTags,
    });
  } catch (error) {
    console.error("Migration preview error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate preview",
      },
      { status: 500 }
    );
  }
}
