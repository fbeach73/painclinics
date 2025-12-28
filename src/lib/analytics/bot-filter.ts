/**
 * Bot detection utility for analytics filtering
 * Filters out known bots, crawlers, and automation tools from analytics
 */

const BOT_UA_PATTERNS = [
  // Search engine bots
  /bot/i,
  /crawler/i,
  /spider/i,
  /slurp/i,
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /baidu/i,
  /duckduckbot/i,

  // Social media bots
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /pinterest/i,
  /whatsapp/i,
  /telegrambot/i,
  /slackbot/i,
  /discordbot/i,

  // SEO tools
  /applebot/i,
  /semrush/i,
  /ahrefs/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /bytespider/i,
  /sogou/i,
  /exabot/i,
  /majestic/i,
  /screaming frog/i,
  /seokicks/i,
  /sistrix/i,
  /rogerbot/i,
  /blexbot/i,
  /dataforseo/i,

  // Automation tools
  /headless/i,
  /phantom/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  /webdriver/i,
  /chrome-lighthouse/i,
  /gtmetrix/i,
  /pagespeed/i,

  // Generic patterns
  /curl/i,
  /wget/i,
  /python-requests/i,
  /python-urllib/i,
  /axios/i,
  /node-fetch/i,
  /go-http-client/i,
  /java\//i,
  /libwww/i,
  /http_request/i,
  /monitor/i,
  /health/i,
  /uptime/i,
  /check/i,
  /nagios/i,
  /datadog/i,
  /newrelic/i,
  /pingdom/i,
  /statuscake/i,
  /site24x7/i,

  // AI/ML crawlers
  /gptbot/i,
  /chatgpt/i,
  /claudebot/i,
  /anthropic/i,
  /ccbot/i,
  /perplexitybot/i,

  // Additional aggressive bot patterns
  /scraper/i,
  /fetch/i,
  /http/i, // Generic HTTP clients
  /archive/i,
  /prerender/i,
  /scan/i,
  /validator/i,
  /link.*check/i,
  /siteimprove/i,
  /netcraft/i,
  /censys/i,
  /masscan/i,
  /zgrab/i,
];

// Known suspicious user agent strings (exact or partial matches)
const SUSPICIOUS_UA_STRINGS = [
  "Mozilla/5.0", // Just "Mozilla/5.0" with nothing else is suspicious
  "Mozilla/4.0",
  "Mozilla/5.0 (compatible;)",
  "Mozilla/5.0 ()",
];

/**
 * Checks if the user agent string indicates a bot or crawler
 * @param userAgent - The User-Agent header string
 * @returns true if the user agent is a bot, false otherwise
 */
export function isBot(userAgent: string | null): boolean {
  // No user agent = suspicious, treat as bot
  if (!userAgent) return true;

  const trimmedUA = userAgent.trim();

  // Empty or very short user agent = suspicious
  if (trimmedUA.length < 20) return true;

  // Check for known suspicious exact strings
  if (SUSPICIOUS_UA_STRINGS.some((s) => trimmedUA === s)) return true;

  // Real browsers have more complex UA strings with version numbers
  // Minimal valid UA should contain OS info like "Windows", "Mac", "Linux", "iPhone", "Android"
  const hasValidOS = /windows|macintosh|mac os|linux|android|iphone|ipad/i.test(trimmedUA);
  if (!hasValidOS) return true;

  // Check pattern-based detection
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/**
 * Simple in-memory rate limiting for analytics
 * Returns true if the session is hitting too frequently (likely a bot)
 */
const sessionHitCounts = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_HITS_PER_WINDOW = 30; // Max 30 pageviews per minute per session

export function isRateLimited(sessionHash: string): boolean {
  const now = Date.now();
  const record = sessionHitCounts.get(sessionHash);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    sessionHitCounts.set(sessionHash, { count: 1, windowStart: now });
    return false;
  }

  record.count++;

  // Clean up old entries periodically (every 1000 checks)
  if (Math.random() < 0.001) {
    const cutoff = now - RATE_LIMIT_WINDOW_MS * 2;
    for (const [key, val] of sessionHitCounts.entries()) {
      if (val.windowStart < cutoff) {
        sessionHitCounts.delete(key);
      }
    }
  }

  return record.count > MAX_HITS_PER_WINDOW;
}
