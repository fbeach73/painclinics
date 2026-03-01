import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware for request handling.
 * Handles:
 * 1. Bot rate limiting (429 for aggressive crawlers)
 * 2. Known bad bot blocking
 * 3. Legacy /clinics/[slug] redirects to /pain-management/[slug]
 * 4. Case normalization (lowercase)
 *
 * Note: Geo-blocking is handled by Vercel Firewall (Pro plan)
 * Note: Trailing slashes handled by Next.js default behavior
 */

// ============================
// Rate limiting (per IP, best-effort on Edge)
// ============================
const ipHits = new Map<string, { count: number; windowStart: number }>();
const RATE_WINDOW_MS = 60_000; // 1 minute
const MAX_HITS_PER_WINDOW = 60; // 60 page requests per minute per IP
const CLEANUP_INTERVAL = 120_000; // Clean stale entries every 2 min
let lastCleanup = Date.now();

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  // Periodic cleanup of stale entries (shared with directory pattern tracker)
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    const cutoff = now - RATE_WINDOW_MS * 2;
    for (const [key, val] of ipHits.entries()) {
      if (val.windowStart < cutoff) ipHits.delete(key);
    }
    for (const [key, val] of ipDirectoryPaths.entries()) {
      if (val.windowStart < cutoff) ipDirectoryPaths.delete(key);
    }
    lastCleanup = now;
  }

  const record = ipHits.get(ip);
  if (!record || now - record.windowStart > RATE_WINDOW_MS) {
    ipHits.set(ip, { count: 1, windowStart: now });
    return false;
  }

  record.count++;
  return record.count > MAX_HITS_PER_WINDOW;
}

// ============================
// Directory crawl pattern detection
// ============================
// No real user visits 5+ unique state or city pages in 60 seconds.
// This catches bots that rotate IPs but still systematically crawl directory pages.
const ipDirectoryPaths = new Map<string, { paths: Set<string>; windowStart: number }>();
const MAX_UNIQUE_DIRECTORY_PAGES = 5;
// Matches /pain-management/XX (state) or /pain-management/XX/city-name (city)
const DIRECTORY_PATTERN = /^\/pain-management\/([a-z]{2})(\/[a-z-]+)?$/;

function isDirectoryCrawler(ip: string, pathname: string): boolean {
  if (!DIRECTORY_PATTERN.test(pathname)) return false;

  const now = Date.now();
  const record = ipDirectoryPaths.get(ip);

  if (!record || now - record.windowStart > RATE_WINDOW_MS) {
    ipDirectoryPaths.set(ip, { paths: new Set([pathname]), windowStart: now });
    return false;
  }

  record.paths.add(pathname);
  return record.paths.size > MAX_UNIQUE_DIRECTORY_PAGES;
}

// ============================
// Bot user-agent blocking
// ============================
// Block aggressive SEO crawlers and scrapers (not search engines we want)
const BLOCKED_BOT_PATTERNS = [
  /semrush/i,
  /ahrefs/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /bytespider/i,
  /sogou/i,
  /blexbot/i,
  /dataforseo/i,
  /zoominfobot/i,
  /censys/i,
  /masscan/i,
  /zgrab/i,
  /netcraft/i,
  /serpstatbot/i,
  /megaindex/i,
  /barkrowler/i,
  /seekport/i,
  /aspiegelbot/i,
  /rogerbot/i,
  /linkfluence/i,
  /seznambot/i,
  /yandexbot/i,
  /baidu/i,
  /go-http-client/i,
  /python-requests/i,
  /python-urllib/i,
  /scrapy/i,
  /java\//i,
  /libwww/i,
  /curl\//i,
  /wget\//i,
  /http_request/i,
];

function isBlockedBot(ua: string | null): boolean {
  if (!ua) return false;
  // Very short UAs with no browser info are suspicious
  if (ua.length < 20) return true;
  return BLOCKED_BOT_PATTERNS.some((pattern) => pattern.test(ua));
}

// Legacy /?clinics=slug → canonical /pain-management/slug-state-zip redirects
// Generated from GSC data: 95 legacy URLs with 287K total impressions
const LEGACY_CLINIC_REDIRECTS: Record<string, string> = {
  "center-for-symptom-relief-llc": "/pain-management/center-for-symptom-relief-llc-oh-43220",
  "comprehensive-pain-and-rehab-of-northwest-arkansas": "/pain-management/comprehensive-pain-and-rehab-of-northwest-arkansas-a-partner-of-optimal-pain-and-wellness-ar-72712",
  "csar-pllc-dr-oliver-c-james-md": "/pain-management/csar-pllc-dr-oliver-c-james-md-ky-40509",
  "access-pain-solutions-tulsa-pain-management-doctor": "/pain-management/access-pain-solutions-tulsa-pain-management-doctor-ok-74146",
  "pain-and-spine-specialists-of-pennsylvania-pleasant-hills": "/pain-management/pain-and-spine-specialists-of-pennsylvania-pleasant-hills-pa-15236",
  "laurel-pain-clinic": "/pain-management/laurel-pain-clinic-ms-39440",
  "access-pain-solutions-muskogee-pain-management": "/pain-management/access-pain-solutions-muskogee-pain-management-ok-74401",
  "dominion-spine-and-pain-springfield-va": "/pain-management/dominion-spine-and-pain-springfield-va-va-22150",
  "superior-pain-management": "/pain-management/superior-pain-management-sc-29621",
  "midsouth-spine-and-pain-associates": "/pain-management/midsouth-spine-and-pain-associates-ms-38834",
  "ic-pain-solutions-pc": "/pain-management/ic-pain-solutions-pc-in-46227",
  "premier-pain-spine-center": "/pain-management/premier-pain-spine-center-skyline-medical-center-tn-37207",
  "powells-pain-clinic-of-orlando-llc-dr-brian-powell": "/pain-management/powells-pain-clinic-of-orlando-llc-dr-brian-powell-fl-32835",
  "st-lukes-clinic-pain-management-boise": "/pain-management/st-lukes-clinic-pain-management-boise-id-83706",
  "tennessee-pain-professionals": "/pain-management/tennessee-pain-professionals-tn-37917",
  "csar-pllc": "/pain-management/csar-pllc-dr-oliver-c-james-md-ky-40509",
  "dr-james-hunt": "/pain-management/dr-james-hunt-ar-72117",
  "walker-pain-management-center": "/pain-management/walker-pain-management-center-tn-38305",
  "dr-heather-whaley": "/pain-management/dr-heather-whaley-ar-72160",
  "renew-medical-clinic-llc": "/pain-management/renew-medical-clinic-llc-nd-58104",
  "dr-butchaiah-garlapati-md": "/pain-management/dr-butchaiah-garlapati-md-ar-72117",
  "mark-clark-crna-nspm-c": "/pain-management/mark-clark-crna-nspm-c-ar-72454",
  "columbia-pain-management-mallhi-moin-u-md": "/pain-management/columbia-pain-management-mallhi-moin-u-md-pa-18603",
  "providence-interventional-pain-center-drs-ashraf-farid-and-ahmed-attia": "/pain-management/providence-interventional-pain-center-drs-ashraf-farid-and-ahmed-attia-ri-02895",
  "aurora-pain-clinic": "/pain-management/aurora-pain-clinic-il-60506",
  "north-alabama-rehabilitation-and-pain-specialist-llc": "/pain-management/north-alabama-rehabilitation-and-pain-specialist-llc-al-35601",
  "coastal-pain-care": "/pain-management/coastal-pain-care-physicians-de-19958",
  "mary-lanning-healthcare-interventional-pain-curtis-albers-md": "/pain-management/mary-lanning-healthcare-interventional-pain-curtis-albers-md-ne-68901",
  "pain-management-dr-william-vargas-md": "/pain-management/pain-management-dr-william-vargas-md-fl-33805",
  "pain-physicians-of-wisconsin": "/pain-management/pain-physicians-of-wisconsin-wi-53066",
  "pain-treatment-associates-richard-tompson-md": "/pain-management/pain-treatment-associates-richard-tompson-md-mo-65775",
  "midwest-pain-rehabilitation-cho-myung-j-md": "/pain-management/midwest-pain-rehabilitation-cho-myung-j-md",
  "pain-gps-clinic": "/pain-management/pain-gps-clinic-or-97401",
  "kansas-pain-specialists-kirsch-mark-a-md": "/pain-management/kansas-pain-specialists-kirsch-mark-a-md-ks-67206",
  "the-pain-center-of-west-virginia": "/pain-management/the-pain-center-of-west-virginia-wv-25401",
  "midwest-pain-consultants-pc": "/pain-management/midwest-pain-consultants-pc-ok-73110",
  "westerly-spine-pain-center": "/pain-management/westerly-spine-pain-center-ri-02891",
  "midwest-pain-center-dr-stephen-g-smith-md": "/pain-management/midwest-pain-center-dr-stephen-g-smith-md-mo-63005",
  "mid-valley-pain-clinic": "/pain-management/mid-valley-pain-clinic-or-97302",
  "dr-a-raj-r-swain-md": "/pain-management/dr-a-raj-r-swain-md-oh-43138",
  "low-country-pain-vein-center": "/pain-management/low-country-pain-vein-center-sc-29115",
  "pain-physicians-of-wisconsin-dr-andrzej-staszkiewicz": "/pain-management/pain-physicians-of-wisconsin-dr-andrzej-staszkiewicz-wi-53221",
  "metro-mn-pain": "/pain-management/metro-mn-pain-mn-55429",
  // New DB matches (Feb 2026)
  "washington-regional-j-b-hunt-transport-services-neuroscience-institute": "/pain-management/washington-regional-interventional-pain-management-clinic-ar-72703",
  "regen-doctors-pain-specialists-gene-v-levinstein-m-d-allentown-pa": "/pain-management/pennsylvania-pain-specialists-gene-levinstein-md-pa-18017",
  "pain-management-dermatology": "/pain-management/pain-managementdermatology-mn-56601",
  // No DB match — fallback to /clinics
  "cottonwood-medical-clinic": "/clinics",
  "texas-pain-clinic": "/clinics",
  "advanced-pain-medical-center": "/clinics",
  "whs-pain-management-center": "/clinics",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block non-production hostnames (Vercel preview URLs get crawled by bots)
  const host = request.headers.get("host") ?? "";
  if (host && !host.includes("painclinics.com") && !host.includes("localhost")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Skip static files
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Block legacy WordPress paths and vulnerability scanner probes at the edge
  if (
    pathname.startsWith("/wp-") ||
    pathname.startsWith("/wordpress") ||
    pathname === "/xmlrpc.php" ||
    pathname === "/login" ||
    pathname === "/signin" ||
    pathname === "/sign-in" ||
    pathname === "/user/login" ||
    pathname === "/account/login" ||
    pathname === "/customer/login"
  ) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Skip API routes from bot blocking (but not rate limiting)
  const isApiRoute = pathname.startsWith("/api");

  const ua = request.headers.get("user-agent");

  // Block known bad bots immediately (not on API routes used by our own frontend)
  if (!isApiRoute && isBlockedBot(ua)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Skip RSC prefetches from rate limiting — Next.js prefetches every visible link
  // on page load via ?_rsc= params. Bots don't send these.
  const isRscPrefetch = request.nextUrl.searchParams.has("_rsc");

  // Rate limit by IP on page routes (not API, not admin, not RSC prefetches)
  if (!isApiRoute && !isRscPrefetch && !pathname.startsWith("/admin")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? "unknown";

    if (ip !== "unknown" && isRateLimited(ip)) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    }

    // Block IPs crawling 5+ unique state/city pages in 60s (no human does this)
    if (ip !== "unknown" && isDirectoryCrawler(ip, pathname)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // 0. Redirect legacy /?clinics=slug to canonical clinic URL
  if (pathname === "/" || pathname === "") {
    const clinicsParam = request.nextUrl.searchParams.get("clinics");
    if (clinicsParam) {
      const url = request.nextUrl.clone();
      const destination = LEGACY_CLINIC_REDIRECTS[clinicsParam];
      if (destination) {
        url.pathname = destination;
      } else {
        // Unknown legacy slug — send to search page
        url.pathname = "/clinics";
      }
      url.search = "";
      return NextResponse.redirect(url, 301);
    }
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
