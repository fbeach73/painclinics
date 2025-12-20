import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Countries to block (ISO 3166-1 alpha-2 codes)
const BLOCKED_COUNTRIES = [
  "CN", // China
  "HK", // Hong Kong (optional - remove if needed)
  // Add more country codes as needed
];

export function middleware(request: NextRequest) {
  // Get country from Vercel's geo headers
  const country = request.headers.get("x-vercel-ip-country") || "";

  if (BLOCKED_COUNTRIES.includes(country)) {
    // Return 403 Forbidden for blocked countries
    return new NextResponse("Access Denied", {
      status: 403,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }

  return NextResponse.next();
}

// Run middleware on all routes except static files and api routes you want to keep open
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
