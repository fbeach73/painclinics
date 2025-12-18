import { NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getAllPublishedPostSlugs } from "@/lib/blog/blog-queries";
import { generateRedirectConfig, generateRedirectConfigString } from "@/lib/blog/content-processor";

/**
 * GET /api/admin/blog/migration/redirects
 * Generate redirect configuration for all blog posts
 * This creates 301 redirects from old WordPress URLs (/post-slug) to new blog URLs (/blog/post-slug)
 *
 * Query params:
 * - format: "json" (default) or "config" (returns next.config.ts snippet)
 */
export async function GET(request: Request) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json";

  try {
    // Get all published post slugs
    const slugs = await getAllPublishedPostSlugs();

    if (slugs.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: "No blog posts found to generate redirects for",
        redirects: [],
      });
    }

    // Generate redirect config
    const redirects = generateRedirectConfig(slugs);

    if (format === "config") {
      // Return as next.config.ts compatible snippet
      const configSnippet = `
// Add this to your next.config.ts file:
//
// const nextConfig: NextConfig = {
//   async redirects() {
//     return [
//       ...blogRedirects,
//       // ... other redirects
//     ];
//   },
// };

export const blogRedirects = ${generateRedirectConfigString(slugs)};
`.trim();

      return new Response(configSnippet, {
        headers: {
          "Content-Type": "text/plain",
          "Content-Disposition": 'attachment; filename="blog-redirects.ts"',
        },
      });
    }

    // Default JSON response
    return NextResponse.json({
      success: true,
      count: redirects.length,
      redirects,
      nextConfigSnippet: `
async redirects() {
  return ${JSON.stringify(redirects, null, 2)};
}`,
    });
  } catch (error) {
    console.error("Redirects generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate redirects",
      },
      { status: 500 }
    );
  }
}
