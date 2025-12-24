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

  // Automation tools
  /headless/i,
  /phantom/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  /webdriver/i,

  // Generic patterns
  /curl/i,
  /wget/i,
  /python-requests/i,
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
];

/**
 * Checks if the user agent string indicates a bot or crawler
 * @param userAgent - The User-Agent header string
 * @returns true if the user agent is a bot, false otherwise
 */
export function isBot(userAgent: string | null): boolean {
  // No user agent = suspicious, treat as bot
  if (!userAgent) return true;

  // Empty or very short user agent = suspicious
  if (userAgent.trim().length < 10) return true;

  return BOT_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}
