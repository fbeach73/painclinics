import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware for request handling.
 * Handles:
 * 1. Legacy /clinics/[slug] redirects to /pain-management/[slug]
 * 2. Case normalization (lowercase)
 *
 * Note: Geo-blocking is handled by Vercel Firewall (Pro plan)
 * Note: Trailing slashes handled by Next.js default behavior
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 1. Redirect /clinics/[slug] to /pain-management/[slug]
  if (pathname.startsWith("/clinics/") && pathname !== "/clinics/") {
    const slug = pathname.replace("/clinics/", "").replace(/\/$/, "");
    const url = request.nextUrl.clone();
    url.pathname = `/pain-management/${slug}`;
    return NextResponse.redirect(url, 301);
  }

  // Handle /clinics without trailing slash
  if (pathname === "/clinics") {
    const url = request.nextUrl.clone();
    url.pathname = "/pain-management";
    return NextResponse.redirect(url, 301);
  }

  // 2. Case normalization for /pain-management/ paths (case-insensitive match)
  const painManagementMatch = pathname.match(/^\/pain-management(\/|$)/i);
  if (painManagementMatch) {
    const lowerPath = pathname.toLowerCase();

    // Redirect if case doesn't match (must be lowercase)
    if (pathname !== lowerPath) {
      const url = request.nextUrl.clone();
      url.pathname = lowerPath;
      return NextResponse.redirect(url, 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
  ],
};
