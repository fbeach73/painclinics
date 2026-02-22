// ============================================
// Click Fraud Filter
// ============================================
// Checks incoming ad clicks for bot/fraud signals.
// Returns a verdict — callers decide what to do with it.

export type ClickVerdict = {
  allowed: boolean;
  reason?: string;
};

// Datacenter IP ranges known to generate fraudulent clicks.
// Stored as [networkInt, maskBits] pairs for fast CIDR matching.
const DATACENTER_CIDRS: Array<{ network: number; bits: number }> = [
  // Tencent Cloud
  { network: cidrToInt("43.128.0.0"), bits: 10 },
  { network: cidrToInt("43.130.0.0"), bits: 15 },
  { network: cidrToInt("43.132.0.0"), bits: 14 },
  { network: cidrToInt("43.136.0.0"), bits: 13 },
  { network: cidrToInt("43.144.0.0"), bits: 12 },
  { network: cidrToInt("43.160.0.0"), bits: 11 },
  // DigitalOcean
  { network: cidrToInt("104.131.0.0"), bits: 16 },
  { network: cidrToInt("138.197.0.0"), bits: 16 },
  { network: cidrToInt("159.89.0.0"), bits: 16 },
  { network: cidrToInt("165.232.0.0"), bits: 16 },
  // Linode/Akamai Cloud
  { network: cidrToInt("45.33.0.0"), bits: 16 },
  { network: cidrToInt("50.116.0.0"), bits: 16 },
  { network: cidrToInt("72.14.182.0"), bits: 24 },
  // Vultr
  { network: cidrToInt("45.32.0.0"), bits: 14 },
  { network: cidrToInt("66.42.0.0"), bits: 16 },
  // Hetzner
  { network: cidrToInt("5.9.0.0"), bits: 16 },
  { network: cidrToInt("88.198.0.0"), bits: 16 },
  { network: cidrToInt("78.46.0.0"), bits: 15 },
  // OVH
  { network: cidrToInt("51.77.0.0"), bits: 16 },
  { network: cidrToInt("51.89.0.0"), bits: 16 },
  { network: cidrToInt("135.125.0.0"), bits: 16 },
  // Amazon AWS (commonly abused ranges)
  { network: cidrToInt("54.144.0.0"), bits: 12 },
  { network: cidrToInt("54.160.0.0"), bits: 11 },
  { network: cidrToInt("3.80.0.0"), bits: 12 },
];

// Known bot UA substrings. Checked case-insensitively.
const BOT_UA_SUBSTRINGS = [
  "bot",
  "crawler",
  "spider",
  "headless",
  "python-requests",
  "go-http-client",
  "curl/",
  "wget/",
  "java/",
  "scrapy",
  "phantomjs",
  "slurp",
  "yahoo! slurp",
  "duckduckbot",
  "baiduspider",
  "yandexbot",
  "sogou",
  "exabot",
  "facebot",
  "ia_archiver",
];

// Google's legitimate crawler — always allow.
const ALLOWED_UA_SUBSTRINGS = ["mediapartners-google", "adsbot-google"];

// Minimum browser versions we consider non-bot.
// Browsers older than these thresholds are flagged as suspicious.
const MIN_CHROME_VERSION = 130;
const MIN_FIREFOX_VERSION = 125;

// ============================================
// Helpers
// ============================================

function cidrToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  return (
    ((parts[0] ?? 0) << 24) |
    ((parts[1] ?? 0) << 16) |
    ((parts[2] ?? 0) << 8) |
    (parts[3] ?? 0)
  );
}

function ipToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => isNaN(n) || n < 0 || n > 255)) return null;
  return (
    ((nums[0]!) << 24) | ((nums[1]!) << 16) | ((nums[2]!) << 8) | nums[3]!
  );
}

function isDatacenterIp(ip: string): boolean {
  const ipInt = ipToInt(ip);
  if (ipInt === null) return false;

  for (const { network, bits } of DATACENTER_CIDRS) {
    const mask = bits === 0 ? 0 : ~0 << (32 - bits);
    if ((ipInt & mask) === (network & mask)) return true;
  }
  return false;
}

function parseChromeMajor(ua: string): number | null {
  // Matches both "Chrome/144.0.0.0" and "Chromium/144.0.0.0"
  const m = ua.match(/(?:Chrome|Chromium)\/(\d+)/i);
  return m ? parseInt(m[1]!, 10) : null;
}

function parseFirefoxMajor(ua: string): number | null {
  const m = ua.match(/Firefox\/(\d+)/i);
  return m ? parseInt(m[1]!, 10) : null;
}

// ============================================
// Main export
// ============================================

export function checkClickFraud(
  userAgent: string | null,
  ipAddress: string | null,
  xForwardedFor: string | null,
  viaHeader: string | null
): ClickVerdict {
  const ua = userAgent ?? "";
  const uaLower = ua.toLowerCase();

  // 1. Empty user agent — hard block.
  if (!ua.trim()) {
    return { allowed: false, reason: "empty_ua" };
  }

  // 2. Explicitly allowed bots (Google AdSense crawler, etc.).
  for (const allowed of ALLOWED_UA_SUBSTRINGS) {
    if (uaLower.includes(allowed)) {
      return { allowed: true };
    }
  }

  // 3. Known bot UA patterns.
  for (const botStr of BOT_UA_SUBSTRINGS) {
    if (uaLower.includes(botStr)) {
      return { allowed: false, reason: "bot_ua" };
    }
  }

  // 4. Outdated Chrome.
  const chromeVersion = parseChromeMajor(ua);
  if (chromeVersion !== null && chromeVersion < MIN_CHROME_VERSION) {
    return { allowed: false, reason: "outdated_chrome" };
  }

  // 5. Outdated Firefox.
  const firefoxVersion = parseFirefoxMajor(ua);
  if (firefoxVersion !== null && firefoxVersion < MIN_FIREFOX_VERSION) {
    return { allowed: false, reason: "outdated_firefox" };
  }

  // 6. Proxy chain: multiple IPs in X-Forwarded-For.
  if (xForwardedFor) {
    const forwardedIps = xForwardedFor.split(",").map((s) => s.trim());
    if (forwardedIps.length > 2) {
      // More than 2 hops (client + one known proxy) suggests proxy chain.
      return { allowed: false, reason: "proxy_chain" };
    }
  }

  // 7. Via header present (explicit proxy disclosure).
  if (viaHeader && viaHeader.trim().length > 0) {
    return { allowed: false, reason: "via_header_proxy" };
  }

  // 8. Datacenter IP.
  const effectiveIp = ipAddress ?? null;
  if (effectiveIp && isDatacenterIp(effectiveIp)) {
    return { allowed: false, reason: "datacenter_ip" };
  }

  return { allowed: true };
}
