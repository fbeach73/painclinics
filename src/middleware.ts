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
