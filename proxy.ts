import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * URL normalization proxy for SEO preservation.
 * In Next.js 16+, proxy.ts replaces middleware.ts for Node.js runtime.
 * Handles:
 * 1. Legacy /clinics/[slug] redirects to /pain-management/[slug]/
 * 2. Case normalization (lowercase)
 * 3. Trailing slash normalization (add if missing)
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 1. Redirect /clinics/[slug] to /pain-management/[slug]/
  if (pathname.startsWith("/clinics/") && pathname !== "/clinics/") {
    const slug = pathname.replace("/clinics/", "").replace(/\/$/, "");
    const url = request.nextUrl.clone();
    url.pathname = `/pain-management/${slug}/`;
    return NextResponse.redirect(url, 301);
  }

  // Handle /clinics without trailing slash
  if (pathname === "/clinics") {
    const url = request.nextUrl.clone();
    url.pathname = "/pain-management/";
    return NextResponse.redirect(url, 301);
  }

  // 2. Case normalization for /pain-management/ paths (case-insensitive match)
  const painManagementMatch = pathname.match(/^\/pain-management\//i);
  if (painManagementMatch) {
    const lowerPath = pathname.toLowerCase();

    // Redirect if case doesn't match (must be lowercase)
    if (pathname !== lowerPath) {
      const url = request.nextUrl.clone();
      url.pathname = lowerPath.endsWith("/") ? lowerPath : lowerPath + "/";
      return NextResponse.redirect(url, 301);
    }

    // 3. Trailing slash normalization (add if missing)
    // Only for paths with a slug (not just /pain-management/)
    if (pathname.length > "/pain-management/".length && !pathname.endsWith("/")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname + "/";
      return NextResponse.redirect(url, 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match pain-management paths (case-insensitive via regex-like patterns)
    "/pain-management/:path*",
    "/Pain-Management/:path*",
    "/PAIN-MANAGEMENT/:path*",
    // Match legacy clinics paths
    "/clinics/:path*",
    "/clinics",
  ],
};
