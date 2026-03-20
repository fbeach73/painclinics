/**
 * scrape-featured-images.ts
 *
 * For clinics that have a website but no featured image (or have expiring
 * Google-hosted images), fetches the clinic homepage, extracts candidate
 * images, optionally scores them via Google Cloud Vision, converts the
 * winner to WebP via sharp, uploads to Vercel Blob, and updates the DB.
 *
 * Usage:
 *   npx tsx scripts/scrape-featured-images.ts              # clinics with no featured image
 *   npx tsx scripts/scrape-featured-images.ts --all        # also replace Google-hosted images
 *   npx tsx scripts/scrape-featured-images.ts --limit 10   # first N only
 *   npx tsx scripts/scrape-featured-images.ts --dry-run    # no writes
 *   npx tsx scripts/scrape-featured-images.ts --skip-vision
 *
 * IMPORTANT: dotenv must run before any @/lib/* imports because those modules
 * read process.env.POSTGRES_URL at import time. All DB/schema imports are
 * done dynamically inside main() after config() runs.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import sharp from "sharp";

// ─── CLI flags ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const FLAG_ALL = args.includes("--all");
const FLAG_DRY_RUN = args.includes("--dry-run");
const FLAG_SKIP_VISION = args.includes("--skip-vision");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1] ?? "0", 10) : Infinity;

// ─── Constants ────────────────────────────────────────────────────────────────

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const FETCH_TIMEOUT_MS = 10_000;
const CONCURRENT_WEBSITE_FETCHES = 2;
const BATCH_DELAY_MS = 200;
const MAX_IMAGE_CANDIDATES = 3;
const MIN_IMAGE_BYTES = 5 * 1024;        // 5 KB
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const WEBP_MAX_WIDTH = 1200;
const WEBP_QUALITY = 80;

// Vision API cost: LABEL_DETECTION + SAFE_SEARCH_DETECTION = 2 units per image call
// Google prices at $1.50 per 1,000 units
const VISION_COST_PER_CALL = 0.003;

// URL path substrings that indicate non-photo assets (logos, trackers, ads, etc.)
const BAD_URL_PATTERNS = [
  "logo", "icon", "favicon", "pixel", "tracking", "badge", "button",
  "banner", "ad-", "advertisement", "sprite", "spacer", "blank", "transparent",
];

// Domains that serve tracking pixels, social widgets, or map embeds — not photos
const BAD_DOMAINS = [
  "facebook.com", "google-analytics.com", "doubleclick.net",
  "googleapis.com/maps", "twitter.com", "linkedin.com",
];

// Vision labels that indicate a genuine clinic/medical environment (adds score)
const GOOD_LABELS = new Set([
  "medical", "clinic", "hospital", "healthcare", "health care",
  "building", "office", "interior", "waiting room", "doctor", "physician",
  "medical equipment", "reception", "lobby", "treatment", "therapy",
  "physical therapy", "chiropractic", "pain", "spine", "rehabilitation",
  "wellness", "examination room",
]);

// Vision labels that indicate stock art, watermarks, or UI screenshots (subtracts score)
const BAD_LABELS = new Set([
  "stock photography", "watermark", "cartoon", "illustration", "clip art",
  "icon", "logo", "screenshot", "meme", "advertisement", "text", "font",
  "graphic design",
]);

// ─── Types ────────────────────────────────────────────────────────────────────

interface CandidateImage {
  url: string;
  source: "og:image" | "twitter:image" | "img-tag" | "css-bg";
  priority: number; // lower = higher priority
}

interface ScoredImage {
  url: string;
  buffer: Buffer;
  score: number;
  labels: string[];
}

interface ClinicRow {
  id: string;
  title: string | null;
  website: string | null;
}

type ProcessResult = "updated" | "skipped" | "errored";

// ─── Helpers: URL & HTML parsing ──────────────────────────────────────────────

/** Resolve a possibly-relative image URL against the page's base URL. */
function resolveUrl(src: string, base: string): string | null {
  try {
    return new URL(src, base).href;
  } catch {
    return null;
  }
}

/**
 * Return true if the URL or its path contains a blacklisted substring.
 * Checks domain list first, then path-level patterns.
 */
function isBadUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (BAD_DOMAINS.some((d) => lower.includes(d))) return true;
  try {
    const { pathname } = new URL(url);
    return BAD_URL_PATTERNS.some((p) => pathname.toLowerCase().includes(p));
  } catch {
    return true; // unparseable URL — skip it
  }
}

/**
 * Extract candidate image URLs from raw HTML in priority order:
 * 1. og:image meta tag
 * 2. twitter:image meta tag
 * 3. <img> tags with non-tiny dimensions
 * 4. Inline CSS background-image
 *
 * Filters out data: URIs, SVGs, explicitly tiny images, and bad URL patterns.
 * Returns deduplicated list sorted by priority ascending (lower = better).
 */
function extractCandidates(html: string, baseUrl: string): CandidateImage[] {
  const candidates: CandidateImage[] = [];

  // Helper to add a candidate after validation
  function addCandidate(
    raw: string,
    source: CandidateImage["source"],
    priority: number
  ) {
    if (!raw || raw.startsWith("data:") || raw.toLowerCase().endsWith(".svg")) return;
    const url = resolveUrl(raw, baseUrl);
    if (!url || isBadUrl(url)) return;
    candidates.push({ url, source, priority });
  }

  // 1. og:image — check both attribute orderings
  const ogMatch =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch?.[1]) addCandidate(ogMatch[1], "og:image", 1);

  // 2. twitter:image — check both attribute orderings
  const twMatch =
    html.match(/<meta[^>]+(?:name|property)=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ??
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']twitter:image["']/i);
  if (twMatch?.[1]) addCandidate(twMatch[1], "twitter:image", 2);

  // 3. <img> tags — collect, filter, assign priority based on declared width
  const imgRegex = /<img([^>]+)>/gi;
  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(html)) !== null) {
    const attrs = match[1];
    if (!attrs) continue;

    const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
    if (!srcMatch?.[1]) continue;

    // Filter explicitly tiny images by declared attributes
    const widthMatch = attrs.match(/width=["']?(\d+)["']?/i);
    const heightMatch = attrs.match(/height=["']?(\d+)["']?/i);
    const w = widthMatch?.[1] ? parseInt(widthMatch[1], 10) : null;
    const h = heightMatch?.[1] ? parseInt(heightMatch[1], 10) : null;
    if (w !== null && w < 100) continue;
    if (h !== null && h < 100) continue;

    // Prefer images with explicit large width
    const priority = w !== null && w >= 200 ? 3 : 4;
    addCandidate(srcMatch[1], "img-tag", priority);
  }

  // 4. Inline CSS background-image (lowest priority)
  const bgRegex = /background-image\s*:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = bgRegex.exec(html)) !== null) {
    const raw = match[1]?.trim();
    if (raw) addCandidate(raw, "css-bg", 5);
  }

  // Deduplicate by URL, keeping the best (lowest) priority seen
  const seen = new Map<string, CandidateImage>();
  for (const c of candidates) {
    const existing = seen.get(c.url);
    if (!existing || c.priority < existing.priority) {
      seen.set(c.url, c);
    }
  }

  return Array.from(seen.values()).sort((a, b) => a.priority - b.priority);
}

// ─── Helpers: HTTP ────────────────────────────────────────────────────────────

/** Fetch with an AbortController-based timeout. Returns null on any error. */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Download a single image URL into a Buffer.
 * Returns null if the response is not an image, is too small, or too large.
 */
async function downloadImage(url: string): Promise<Buffer | null> {
  const res = await fetchWithTimeout(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
  });
  if (!res?.ok) return null;

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) return null;

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_IMAGE_BYTES) return null;
  if (buf.length > MAX_IMAGE_BYTES) return null;

  return buf;
}

// ─── Google Cloud Vision ──────────────────────────────────────────────────────

interface VisionLabel {
  description: string;
  score: number;
}

interface VisionSafeSearch {
  adult?: string;
  medical?: string;
}

/**
 * Score an image buffer using Google Cloud Vision LABEL_DETECTION +
 * SAFE_SEARCH_DETECTION via the REST API (no SDK required).
 *
 * Returns { score, labels } or null if:
 * - The Vision API call fails
 * - The image fails the safe search check (adult/graphic-medical content)
 */
async function scoreWithVision(
  buffer: Buffer,
  apiKey: string
): Promise<{ score: number; labels: string[] } | null> {
  const body = {
    requests: [
      {
        image: { content: buffer.toString("base64") },
        features: [
          { type: "LABEL_DETECTION", maxResults: 10 },
          { type: "SAFE_SEARCH_DETECTION" },
        ],
      },
    ],
  };

  const res = await fetchWithTimeout(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res?.ok) {
    console.warn(`  Vision API HTTP error: ${res?.status} ${res?.statusText}`);
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as { responses?: Array<any> };
  const response = data?.responses?.[0];
  if (!response) return null;

  // Reject explicit adult or graphic medical imagery
  const safeSearch = (response.safeSearchAnnotation ?? {}) as VisionSafeSearch;
  const riskyLevels = new Set(["LIKELY", "VERY_LIKELY"]);
  if (
    riskyLevels.has(safeSearch.adult ?? "") ||
    riskyLevels.has(safeSearch.medical ?? "")
  ) {
    return null;
  }

  const labelAnnotations = (response.labelAnnotations ?? []) as VisionLabel[];
  let score = 0;
  const matchedLabels: string[] = [];

  for (const { description, score: confidence } of labelAnnotations) {
    const lower = description.toLowerCase();
    if (GOOD_LABELS.has(lower)) {
      score += confidence * 10;
      matchedLabels.push(description);
    } else if (BAD_LABELS.has(lower)) {
      score -= confidence * 10;
    }
  }

  return { score: Math.round(score * 10) / 10, labels: matchedLabels };
}

// ─── Deps bundle (passed to processClinic to avoid repeated dynamic imports) ──

interface ScriptDeps {
  db: import("drizzle-orm/postgres-js").PostgresJsDatabase<
    typeof import("@/lib/schema")
  >;
  clinics: typeof import("@/lib/schema")["clinics"];
  eq: typeof import("drizzle-orm")["eq"];
  upload: typeof import("@/lib/storage")["upload"];
}

// ─── Main per-clinic logic ────────────────────────────────────────────────────

async function processClinic(
  clinic: ClinicRow,
  index: number,
  total: number,
  visionApiKey: string | null,
  deps: ScriptDeps
): Promise<ProcessResult> {
  const label = `[${index}/${total}] ${clinic.title ?? clinic.id}`;
  const websiteUrl = clinic.website!; // guaranteed non-null by query filter

  // ── Step 1: Fetch homepage ──────────────────────────────────────────────────
  const homeRes = await fetchWithTimeout(websiteUrl, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
  });

  if (!homeRes?.ok) {
    console.log(`${label} — fetch failed (${homeRes?.status ?? "timeout"}) — skip`);
    return "skipped";
  }

  const contentType = homeRes.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    console.log(`${label} — not HTML (${contentType}) — skip`);
    return "skipped";
  }

  const html = await homeRes.text();
  const effectiveBase = homeRes.url ?? websiteUrl; // post-redirect URL

  // ── Step 2: Extract candidates ─────────────────────────────────────────────
  const candidates = extractCandidates(html, effectiveBase);

  if (candidates.length === 0) {
    console.log(`${label} — no usable images found — skip`);
    return "skipped";
  }

  // ── Step 3: Download top candidates ────────────────────────────────────────
  const topCandidates = candidates.slice(0, MAX_IMAGE_CANDIDATES);
  const downloaded: Array<{ candidate: CandidateImage; buffer: Buffer }> = [];

  for (const candidate of topCandidates) {
    const buffer = await downloadImage(candidate.url);
    if (buffer) {
      downloaded.push({ candidate, buffer });
    }
  }

  if (downloaded.length === 0) {
    console.log(`${label} — all candidates failed download — skip`);
    return "skipped";
  }

  // ── Step 4: Select winner (Vision scoring or first-candidate fallback) ──────
  let winner: ScoredImage | null = null;

  if (FLAG_SKIP_VISION || !visionApiKey) {
    // No Vision: pick the highest-priority successfully-downloaded candidate
    const first = downloaded[0];
    if (!first) {
      console.log(`${label} — no downloaded images — skip`);
      return "skipped";
    }
    const note = FLAG_SKIP_VISION ? "vision skipped" : "no Vision key";
    const action = FLAG_DRY_RUN ? "would upload" : "uploading";
    console.log(`${label} — ${first.candidate.source} (${note}) — ${action}`);
    winner = { url: first.candidate.url, buffer: first.buffer, score: 0, labels: [] };
  } else {
    // Score all downloaded candidates and pick the highest-scoring one
    const scored: ScoredImage[] = [];

    for (const { candidate, buffer } of downloaded) {
      const result = await scoreWithVision(buffer, visionApiKey);
      if (result === null) {
        // Vision call failed or image failed safe search
        console.log(`  skipping candidate (failed Vision/safe search): ${candidate.url}`);
        continue;
      }
      scored.push({ url: candidate.url, buffer, score: result.score, labels: result.labels });
    }

    if (scored.length === 0) {
      console.log(`${label} — all candidates failed Vision checks — skip`);
      return "skipped";
    }

    // Sort by score descending; scored[0] is guaranteed to exist now
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0]!; // non-null: length >= 1

    if (best.score <= 0) {
      const topLabels = best.labels.slice(0, 3).join(", ") || "no matching labels";
      console.log(`${label} — best Vision score is ${best.score} (${topLabels}) — skip`);
      return "skipped";
    }

    const topLabels = best.labels.slice(0, 3).join(", ") || "no matching labels";
    const action = FLAG_DRY_RUN ? "would upload" : "uploading";
    console.log(`${label} — Vision score: ${best.score} (${topLabels}) — ${action}`);
    winner = best;
  }

  // ── Dry run exit — nothing written beyond this point ───────────────────────
  if (FLAG_DRY_RUN) {
    return "updated"; // count as "would update" in summary
  }

  // winner is guaranteed non-null here (DRY_RUN returns above; skips return above)
  const finalWinner = winner;
  if (!finalWinner) return "skipped"; // type-narrowing safety net

  // ── Step 5: Convert to WebP + watermark ─────────────────────────────────────
  let webpBuffer: Buffer;
  try {
    // Resize first so we know the final dimensions for watermark positioning
    const resized = sharp(finalWinner.buffer).resize({
      width: WEBP_MAX_WIDTH,
      withoutEnlargement: true,
    });
    const { width: imgWidth, height: imgHeight } = await resized.metadata();
    const w = imgWidth ?? WEBP_MAX_WIDTH;
    const h = imgHeight ?? 800;

    // SVG watermark: "painclinics.com" bottom-right, white @ 40% opacity, dark shadow
    const fontSize = Math.max(14, Math.round(w * 0.028)); // ~2.8% of width, min 14px
    const padRight = Math.round(fontSize * 0.8);
    const padBottom = Math.round(fontSize * 0.7);
    const watermarkSvg = Buffer.from(`
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <style>
          .wm {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            font-size: ${fontSize}px;
            font-weight: 600;
            fill: rgba(255, 255, 255, 0.5);
            filter: drop-shadow(0px 0px 3px rgba(0, 0, 0, 0.9)) drop-shadow(0px 0px 1px rgba(0, 0, 0, 0.9));
          }
        </style>
        <text x="${w - padRight}" y="${h - padBottom}" text-anchor="end" class="wm">painclinics.com</text>
      </svg>
    `);

    webpBuffer = await sharp(finalWinner.buffer)
      .resize({ width: WEBP_MAX_WIDTH, withoutEnlargement: true })
      .composite([{ input: watermarkSvg, top: 0, left: 0 }])
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch (err) {
    console.error(`${label} — sharp conversion failed:`, err);
    return "errored";
  }

  // ── Step 6: Upload to Vercel Blob ───────────────────────────────────────────
  const filename = `${clinic.id}-featured.webp`;
  let blobUrl: string;
  try {
    const result = await deps.upload(webpBuffer, filename, "clinic-images");
    blobUrl = result.url;
  } catch (err) {
    console.error(`${label} — upload failed:`, err);
    return "errored";
  }

  // ── Step 7: Update DB ───────────────────────────────────────────────────────
  try {
    await deps.db
      .update(deps.clinics)
      .set({ imageFeatured: blobUrl })
      .where(deps.eq(deps.clinics.id, clinic.id));
  } catch (err) {
    console.error(`${label} — DB update failed:`, err);
    return "errored";
  }

  console.log(`${label} — done → ${blobUrl}`);
  return "updated";
}

// ─── Concurrency helper ───────────────────────────────────────────────────────

/**
 * Process an array of items with a fixed concurrency limit.
 * Inserts BATCH_DELAY_MS between batches to be polite to web servers.
 */
async function runConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((item, j) => fn(item, i + j))
    );
    results.push(...batchResults);
    if (i + concurrency < items.length) {
      await new Promise<void>((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }
  return results;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  // Dynamic imports: dotenv has already run at the top of this file, so
  // POSTGRES_URL is available in process.env when these modules initialize.
  const { db } = await import("@/lib/db");
  const { clinics } = await import("@/lib/schema");
  const { eq, isNull, or, like } = await import("drizzle-orm");
  const { upload } = await import("@/lib/storage");

  const visionApiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY ?? null;
  if (!visionApiKey && !FLAG_SKIP_VISION) {
    console.warn(
      "⚠  GOOGLE_CLOUD_VISION_API_KEY not set in .env.local — " +
        "Vision scoring will be skipped for all images. " +
        "Pass --skip-vision to suppress this warning."
    );
  }

  // ── Build query ─────────────────────────────────────────────────────────────
  const baseQuery = db
    .select({ id: clinics.id, title: clinics.title, website: clinics.website })
    .from(clinics);

  let rows: ClinicRow[];

  if (FLAG_ALL) {
    // Replace clinics with no image OR with Google-hosted (expiring) images
    const allRows = await baseQuery.where(
      or(
        isNull(clinics.imageFeatured),
        like(clinics.imageFeatured, "https://lh3.%"),
        like(clinics.imageFeatured, "https://streetview%")
      )
    );
    rows = allRows.filter((r) => r.website !== null) as ClinicRow[];
  } else {
    // Default: only clinics with no featured image at all
    const noImageRows = await baseQuery.where(isNull(clinics.imageFeatured));
    rows = noImageRows.filter((r) => r.website !== null) as ClinicRow[];
  }

  // Apply --limit flag
  if (LIMIT < Infinity) {
    rows = rows.slice(0, LIMIT);
  }

  const total = rows.length;
  console.log(
    `\nFound ${total} clinics to process` +
      (FLAG_DRY_RUN ? " (DRY RUN — no writes)" : "") +
      (FLAG_ALL ? " (--all: including Google-hosted replacements)" : "") +
      "\n"
  );

  if (total === 0) {
    console.log("Nothing to do.");
    return;
  }

  // ── Process clinics with bounded concurrency ────────────────────────────────
  const deps: ScriptDeps = { db, clinics, eq, upload };
  let visionCallCount = 0;

  const statuses = await runConcurrent(
    rows,
    CONCURRENT_WEBSITE_FETCHES,
    async (clinic, index): Promise<ProcessResult> => {
      try {
        const status = await processClinic(
          clinic,
          index + 1,
          total,
          visionApiKey,
          deps
        );
        // Rough Vision call estimate: ~1 call per clinic attempted when Vision is active
        if (!FLAG_SKIP_VISION && visionApiKey && status === "updated") {
          visionCallCount += 1;
        }
        return status;
      } catch (err) {
        console.error(`Unhandled error for ${clinic.id}:`, err);
        return "errored";
      }
    }
  );

  // ── Summary ─────────────────────────────────────────────────────────────────
  const updated = statuses.filter((s) => s === "updated").length;
  const skipped = statuses.filter((s) => s === "skipped").length;
  const errored = statuses.filter((s) => s === "errored").length;

  console.log("\n─────────────────────────────────────");
  console.log("Summary");
  console.log("─────────────────────────────────────");
  console.log(`  Updated : ${updated}`);
  console.log(`  Skipped : ${skipped}`);
  console.log(`  Errored : ${errored}`);
  console.log(`  Total   : ${total}`);

  if (!FLAG_SKIP_VISION && visionApiKey) {
    const estimatedCost = (visionCallCount * VISION_COST_PER_CALL).toFixed(4);
    console.log(
      `\n  Vision API calls (estimated): ${visionCallCount} ≈ $${estimatedCost}`
    );
    console.log(
      "  (LABEL_DETECTION + SAFE_SEARCH_DETECTION = 2 units/image @ $1.50/1000 units)"
    );
  }

  console.log("─────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
