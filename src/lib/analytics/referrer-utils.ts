/**
 * Referrer categorization utility for analytics
 * Categorizes referrer URLs into meaningful source types
 */

interface ReferrerInfo {
  source: string;
  domain: string | null;
}

const REFERRER_PATTERNS: [RegExp, string][] = [
  // Search engines
  [/google\.(com|[a-z]{2,3})$/i, "google"],
  [/bing\.com$/i, "bing"],
  [/yahoo\.(com|[a-z]{2,3})$/i, "yahoo"],
  [/duckduckgo\.com$/i, "duckduckgo"],
  [/baidu\.com$/i, "baidu"],
  [/yandex\.(com|ru)$/i, "yandex"],

  // Social media
  [/(facebook\.com|fb\.com|fb\.me)$/i, "facebook"],
  [/(twitter\.com|t\.co|x\.com)$/i, "twitter"],
  [/instagram\.com$/i, "instagram"],
  [/linkedin\.com$/i, "linkedin"],
  [/pinterest\.(com|[a-z]{2,3})$/i, "pinterest"],
  [/reddit\.com$/i, "reddit"],
  [/tiktok\.com$/i, "tiktok"],
  [/(youtube\.com|youtu\.be)$/i, "youtube"],
  [/threads\.net$/i, "threads"],
  [/snapchat\.com$/i, "snapchat"],

  // Email providers (common webmail)
  [/mail\.google\.com$/i, "email"],
  [/outlook\.(com|live\.com)$/i, "email"],
  [/mail\.yahoo\.com$/i, "email"],
];

/**
 * Extracts the domain from a URL
 * @param url - The full URL string
 * @returns The domain or null if parsing fails
 */
function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Categorizes a referrer URL into a source type
 * @param referrer - The referrer URL
 * @param currentHost - The current site's host (for internal detection)
 * @returns ReferrerInfo with source and domain
 */
export function categorizeReferrer(
  referrer: string | null | undefined,
  currentHost?: string
): ReferrerInfo {
  // No referrer = direct traffic
  if (!referrer || referrer.trim() === "") {
    return { source: "direct", domain: null };
  }

  const domain = extractDomain(referrer);

  if (!domain) {
    return { source: "direct", domain: null };
  }

  // Check for internal traffic
  if (currentHost && domain === currentHost.replace(/^www\./, "")) {
    return { source: "internal", domain };
  }

  // Check known referrer patterns
  for (const [pattern, source] of REFERRER_PATTERNS) {
    if (pattern.test(domain)) {
      return { source, domain };
    }
  }

  // Unknown external referrer = referral
  return { source: "referral", domain };
}

/**
 * Gets a human-readable label for a referrer source
 * @param source - The source identifier
 * @returns Human-readable label
 */
export function getReferrerLabel(source: string): string {
  const labels: Record<string, string> = {
    direct: "Direct",
    internal: "Internal",
    google: "Google",
    bing: "Bing",
    yahoo: "Yahoo",
    duckduckgo: "DuckDuckGo",
    baidu: "Baidu",
    yandex: "Yandex",
    facebook: "Facebook",
    twitter: "Twitter/X",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    pinterest: "Pinterest",
    reddit: "Reddit",
    tiktok: "TikTok",
    youtube: "YouTube",
    threads: "Threads",
    snapchat: "Snapchat",
    email: "Email",
    referral: "Referral",
  };

  return labels[source] || source.charAt(0).toUpperCase() + source.slice(1);
}
