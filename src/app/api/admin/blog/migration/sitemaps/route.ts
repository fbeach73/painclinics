import { NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { discoverPostUrls, filterBlogPostUrls } from "@/lib/blog/sitemap-parser";

const WP_BASE_URL = "https://painclinics.com";

/**
 * GET /api/admin/blog/migration/sitemaps
 * Discover WordPress sitemaps and extract all blog post URLs
 */
export async function GET() {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const result = await discoverPostUrls(WP_BASE_URL);

    // Filter to only include blog post URLs (exclude pain-management, etc.)
    const blogPostUrls = filterBlogPostUrls(result.postUrls, WP_BASE_URL);

    return NextResponse.json({
      success: true,
      sitemaps: result.sitemaps,
      totalUrlsFound: result.postUrls.length,
      blogPostCount: blogPostUrls.length,
      postUrls: blogPostUrls,
    });
  } catch (error) {
    console.error("Sitemap discovery error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to discover sitemaps",
      },
      { status: 500 }
    );
  }
}
