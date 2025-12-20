import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Countries to block (ISO 3166-1 alpha-2 codes)
// This is a US-focused site - blocking common spam/bot source countries
const BLOCKED_COUNTRIES = [
  // Asia - Major bot/spam sources
  "CN", // China
  "HK", // Hong Kong
  "SG", // Singapore
  "VN", // Vietnam
  "TH", // Thailand
  "ID", // Indonesia
  "MY", // Malaysia
  "PH", // Philippines
  "IN", // India
  "PK", // Pakistan
  "BD", // Bangladesh
  "NP", // Nepal
  "LK", // Sri Lanka
  "MM", // Myanmar
  "KH", // Cambodia
  "LA", // Laos
  "KP", // North Korea
  "MN", // Mongolia

  // Russia & Eastern Europe
  "RU", // Russia
  "UA", // Ukraine
  "BY", // Belarus
  "KZ", // Kazakhstan
  "UZ", // Uzbekistan
  "TM", // Turkmenistan
  "TJ", // Tajikistan
  "KG", // Kyrgyzstan
  "AZ", // Azerbaijan
  "AM", // Armenia
  "GE", // Georgia
  "MD", // Moldova

  // Middle East
  "IR", // Iran
  "IQ", // Iraq
  "SY", // Syria
  "YE", // Yemen
  "AF", // Afghanistan
  "SA", // Saudi Arabia
  "AE", // UAE
  "QA", // Qatar
  "KW", // Kuwait
  "BH", // Bahrain
  "OM", // Oman
  "JO", // Jordan
  "LB", // Lebanon
  "PS", // Palestine
  "TR", // Turkey
  "EG", // Egypt

  // Africa - common spam sources
  "NG", // Nigeria
  "GH", // Ghana
  "KE", // Kenya
  "ZA", // South Africa
  "MA", // Morocco
  "DZ", // Algeria
  "TN", // Tunisia
  "LY", // Libya
  "SD", // Sudan
  "ET", // Ethiopia
  "CM", // Cameroon
  "CI", // Ivory Coast
  "SN", // Senegal

  // South America - some bot traffic
  "BR", // Brazil
  "VE", // Venezuela
  "CO", // Colombia
  "AR", // Argentina
];

/**
 * URL normalization proxy for SEO preservation.
 * In Next.js 16+, proxy.ts replaces middleware.ts for Node.js runtime.
 * Handles:
 * 0. Geo-blocking for spam countries
 * 1. Legacy /clinics/[slug] redirects to /pain-management/[slug]/
 * 2. Case normalization (lowercase)
 * 3. Trailing slash normalization (add if missing)
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. Geo-blocking - check country and block if needed
  const country = request.headers.get("x-vercel-ip-country") || "";
  if (BLOCKED_COUNTRIES.includes(country)) {
    return new NextResponse("Access Denied", {
      status: 403,
      headers: { "Content-Type": "text/plain" },
    });
  }

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
