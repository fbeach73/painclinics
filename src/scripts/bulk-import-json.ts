/**
 * Bulk Import Clinics from JSON (Scraper/Outscraper Format)
 *
 * This script imports clinic data from a JSON file exported from Google Places scraper.
 * It handles deduplication by place_id and supports both INSERT (new) and UPDATE (fill gaps) modes.
 *
 * Usage:
 *   pnpm tsx src/scripts/bulk-import-json.ts [options]
 *
 * Options:
 *   --dry-run          Preview changes without modifying database
 *   --limit=N          Only process first N records
 *   --file=PATH        Path to JSON file (default: docs/technical/all-task-12935.json)
 *   --batch-size=N     Records per batch (default: 10)
 *   --delay=N          Delay between batches in ms (default: 2000)
 *
 * Examples:
 *   pnpm tsx src/scripts/bulk-import-json.ts --dry-run
 *   pnpm tsx src/scripts/bulk-import-json.ts --limit=100 --dry-run
 *   pnpm tsx src/scripts/bulk-import-json.ts
 */

// Load environment variables FIRST before any other imports
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

// Now import everything else
import * as fs from "fs";
import * as path from "path";
import { eq, sql, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics, importBatches } from "@/lib/schema";
import { createId } from "@paralleldrive/cuid2";
import {
  generatePermalinkSlug,
  selectFeaturedReviews,
  type DetailedReview,
  type FeaturedReview,
  type ReviewKeyword,
  type ClinicHour,
} from "@/lib/clinic-transformer";
import { getStateAbbreviation, getStateName } from "@/lib/us-states";

// =============================================================================
// Types
// =============================================================================

interface ScraperRecord {
  place_id: string;
  name: string;
  description?: string;
  link?: string;
  reviews?: number;
  rating?: number;
  website?: string;
  phone?: string;
  emails?: string[];
  featured_image?: string;
  main_category?: string;
  categories?: string[];
  workday_timing?: string;
  closed_on?: string[];
  address?: string;
  price_range?: string;
  reviews_per_rating?: Record<string, number>;
  coordinates?: { latitude: number; longitude: number };
  detailed_address?: {
    ward?: string;
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  time_zone?: string;
  cid?: string;
  kgmid?: string;
  about?: Array<{ id?: string; name?: string; description?: string; options?: Array<{ name?: string; enabled?: boolean }> }>;
  hours?: Array<{ day: string; time?: string; hours?: string; times?: string[] }>;
  images?: string[];
  featured_images?: Array<{ link?: string }>;
  review_keywords?: Array<{ keyword: string; count?: number }>;
  featured_reviews?: Array<{
    review_id?: string;
    review_text?: string;
    review_rating?: number;
    rating?: number; // New format
    author_title?: string;
    name?: string; // New format
    author_link?: string;
    reviewer_profile?: string; // New format
    review_datetime_utc?: string;
    published_at_date?: string; // New format
    owner_answer?: string;
  }>;
  detailed_reviews?: DetailedReview[];
  phones?: string[];
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
  tiktok?: string;
  pinterest?: string;
}

interface ImportStats {
  total: number;
  newInserted: number;
  existingUpdated: number;
  skippedNoPlaceId: number;
  skippedDuplicate: number;
  skippedNoLocation: number;
  errors: Array<{ placeId: string; name: string; error: string }>;
}

interface ClinicUpdateFields {
  [key: string]: unknown;
}

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_FILE = "docs/technical/all-task-12935.json";
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_DELAY = 2000; // 2 seconds between batches

// =============================================================================
// Helper Functions
// =============================================================================

function parseArgs(): {
  dryRun: boolean;
  limit: number;
  file: string;
  batchSize: number;
  delay: number;
} {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    limit: parseInt(args.find((a) => a.startsWith("--limit="))?.split("=")[1] || "0", 10),
    file: args.find((a) => a.startsWith("--file="))?.split("=")[1] || DEFAULT_FILE,
    batchSize: parseInt(args.find((a) => a.startsWith("--batch-size="))?.split("=")[1] || String(DEFAULT_BATCH_SIZE), 10),
    delay: parseInt(args.find((a) => a.startsWith("--delay="))?.split("=")[1] || String(DEFAULT_DELAY), 10),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanSocialUrl(url: string | undefined): string | null {
  if (!url) return null;
  // Filter out error messages
  if (url.includes("Could not get social detail") || url.includes("Unknown Error")) {
    return null;
  }
  return url.trim() || null;
}

/**
 * Build comprehensive raw data context for AI description generation
 * Aggregates ALL available clinic data into a single text field
 */
function buildRawDescriptionContext(record: ScraperRecord): string | null {
  const parts: string[] = [];

  // Original description (highest priority)
  if (record.description?.trim()) {
    parts.push(`Description: ${record.description.trim()}`);
  }

  // Basic info
  if (record.name) parts.push(`Name: ${record.name}`);
  if (record.main_category) parts.push(`Category: ${record.main_category}`);
  if (record.categories?.length) {
    parts.push(`Services: ${record.categories.join(", ")}`);
  }

  // Location
  if (record.address) parts.push(`Address: ${record.address}`);
  const city = record.detailed_address?.city;
  const state = record.detailed_address?.state;
  if (city && state) parts.push(`Location: ${city}, ${state}`);

  // Ratings & Reviews
  if (record.rating) parts.push(`Rating: ${record.rating} stars`);
  if (record.reviews) parts.push(`Review Count: ${record.reviews}`);

  // Review keywords (what patients mention)
  if (record.review_keywords?.length) {
    const keywords = record.review_keywords.map((k) => k.keyword).join(", ");
    parts.push(`Review Keywords: ${keywords}`);
  }

  // Sample reviews (first 3)
  if (record.featured_reviews?.length) {
    const reviews = record.featured_reviews
      .slice(0, 3)
      .map((r) => r.review_text?.replace(/<[^>]*>/g, "").trim())
      .filter((t): t is string => Boolean(t));
    if (reviews.length) {
      parts.push(`Sample Reviews: ${reviews.join(" | ")}`);
    }
  }

  // Amenities & Features from 'about' field
  if (record.about?.length) {
    const amenities: string[] = [];
    for (const section of record.about) {
      for (const opt of section.options || []) {
        if (opt.enabled && opt.name) {
          amenities.push(opt.name);
        }
      }
    }
    if (amenities.length) {
      parts.push(`Amenities: ${amenities.join(", ")}`);
    }
  }

  // Hours
  if (record.workday_timing) parts.push(`Hours: ${record.workday_timing}`);
  if (record.closed_on) {
    const closedDays = Array.isArray(record.closed_on) ? record.closed_on.join(", ") : String(record.closed_on);
    parts.push(`Closed: ${closedDays}`);
  }

  // Contact
  if (record.phone) parts.push(`Phone: ${record.phone}`);
  if (record.website) parts.push(`Website: ${record.website}`);

  return parts.length > 0 ? parts.join("\n") : null;
}

/**
 * Generate SEO-optimized description for the content field
 * Creates factual, entity-rich content from available clinic data
 */
function generateSEODescription(record: ScraperRecord): string | null {
  const name = record.name;
  const city = record.detailed_address?.city;
  const state = record.detailed_address?.state;
  const category = record.main_category?.toLowerCase() || "pain management specialist";

  if (!name || !city || !state) return null;

  const paragraphs: string[] = [];

  // Paragraph 1: Introduction & Location
  let intro = `${name} is a ${category} providing comprehensive pain management services in ${city}, ${state}.`;
  if (record.description?.trim()) {
    intro += ` ${record.description.trim()}`;
  }
  paragraphs.push(intro);

  // Paragraph 2: Reputation (if good rating)
  if (record.rating && record.rating >= 4.0 && record.reviews && record.reviews >= 10) {
    let reputation = `With ${record.rating} stars from ${record.reviews} patient reviews, ${name} has established a strong reputation in the ${city} area.`;

    // Add review keywords if available
    if (record.review_keywords?.length) {
      const topKeywords = record.review_keywords.slice(0, 3).map((k) => k.keyword).join(", ");
      reputation += ` Patients frequently mention ${topKeywords}.`;
    }
    paragraphs.push(reputation);
  }

  // Paragraph 3: Services
  let services = `${name} specializes in diagnosing and treating acute and chronic pain conditions.`;
  if (record.categories && record.categories.length > 1) {
    const serviceList = record.categories.slice(0, 4).join(", ");
    services += ` Services include ${serviceList}.`;
  }
  services += ` Treatment approaches may include interventional procedures, medication management, physical therapy referrals, and individualized pain relief strategies.`;
  paragraphs.push(services);

  // Paragraph 4: Accessibility & Hours
  const accessibilityParts: string[] = [];

  if (record.about?.length) {
    const amenities: string[] = [];
    for (const section of record.about) {
      for (const opt of section.options || []) {
        if (opt.enabled && opt.name) {
          if (opt.name.includes("Wheelchair")) amenities.push("wheelchair accessible");
          if (opt.name.includes("Credit cards")) amenities.push("accepts credit cards");
          if (opt.name.includes("Language assistance")) amenities.push("language assistance available");
        }
      }
    }
    if (amenities.length) {
      accessibilityParts.push(`The facility is ${[...new Set(amenities)].slice(0, 3).join(", ")}`);
    }
  }

  if (record.workday_timing) {
    accessibilityParts.push(`Office hours are ${record.workday_timing}`);
  }

  if (record.closed_on) {
    const closed = Array.isArray(record.closed_on) ? record.closed_on.join(" and ") : String(record.closed_on);
    if (closed !== "Open All Days") {
      accessibilityParts.push(`closed ${closed}`);
    }
  }

  if (accessibilityParts.length) {
    paragraphs.push(accessibilityParts.join(". ") + ".");
  }

  // Paragraph 5: Contact CTA
  let contact = `To schedule a consultation at ${name}`;
  if (record.phone) {
    contact += `, call ${record.phone}`;
  }
  if (record.website) {
    contact += record.phone ? " or " : ", ";
    contact += `visit their website for more information`;
  }
  contact += ".";
  paragraphs.push(contact);

  return paragraphs.join("\n\n");
}

function parseHours(hours: Array<{ day: string; time?: string; hours?: string; times?: string[] }> | undefined): ClinicHour[] | null {
  if (!hours || !Array.isArray(hours) || hours.length === 0) return null;

  const parsed: ClinicHour[] = [];
  for (const item of hours) {
    if (item.day) {
      // JSON format uses 'times' array (e.g., ['8 a.m.-5 p.m.'])
      // CSV format uses 'time' or 'hours' string
      let hoursValue = "Hours not specified";

      if (item.times && Array.isArray(item.times) && item.times.length > 0) {
        // Join multiple time ranges if present (e.g., lunch breaks)
        hoursValue = item.times.join(", ");
      } else if (item.time) {
        hoursValue = item.time;
      } else if (item.hours) {
        hoursValue = item.hours;
      }

      parsed.push({
        day: item.day,
        hours: hoursValue,
      });
    }
  }
  return parsed.length > 0 ? parsed : null;
}

function parseImages(
  images: string[] | undefined,
  featuredImages: Array<{ link?: string }> | undefined
): string[] | null {
  const urls: string[] = [];

  // Add from images array
  if (images && Array.isArray(images)) {
    for (const img of images) {
      if (typeof img === "string" && img.startsWith("http")) {
        urls.push(img);
      }
    }
  }

  // Add from featured_images array (deduplicated)
  if (featuredImages && Array.isArray(featuredImages)) {
    for (const item of featuredImages) {
      const url = item.link;
      if (url && url.startsWith("http") && !urls.includes(url)) {
        urls.push(url);
      }
    }
  }

  return urls.length > 0 ? urls : null;
}

function parseReviewKeywords(keywords: Array<{ keyword: string; count?: number }> | undefined): ReviewKeyword[] | null {
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) return null;

  const parsed: ReviewKeyword[] = [];
  for (const item of keywords) {
    if (item.keyword) {
      parsed.push({
        keyword: item.keyword,
        count: item.count || 1,
      });
    }
  }
  return parsed.length > 0 ? parsed : null;
}

function parseFeaturedReviews(
  reviews: ScraperRecord["featured_reviews"] | undefined
): FeaturedReview[] | null {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) return null;

  const parsed: FeaturedReview[] = [];
  for (const item of reviews) {
    if (item.review_text) {
      parsed.push({
        // Support both old and new field names
        username: item.author_title || item.name || null,
        url: item.author_link || item.reviewer_profile || null,
        review: item.review_text.replace(/<[^>]*>/g, "").trim(),
        date: item.review_datetime_utc || item.published_at_date || null,
        rating: item.review_rating ?? item.rating ?? null,
      });
    }
  }
  return parsed.length > 0 ? parsed : null;
}

function createStrippedReviewsText(reviews: DetailedReview[] | undefined): string | null {
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) return null;

  const texts = reviews
    .map((r) => r.review_text?.replace(/<[^>]*>/g, "").trim())
    .filter((t): t is string => Boolean(t));

  return texts.length > 0 ? texts.join("\n\n---\n\n") : null;
}

/**
 * Transform a scraper record into database-ready clinic data
 */
function transformRecord(record: ScraperRecord): Partial<typeof clinics.$inferInsert> | null {
  // Skip records without place_id
  if (!record.place_id || !record.name) {
    return null;
  }

  // Parse coordinates
  const lat = record.coordinates?.latitude;
  const lng = record.coordinates?.longitude;

  if (lat === undefined || lng === undefined || lat === 0 || lng === 0) {
    // Try to continue without coordinates - will be skipped later if truly invalid
  }

  // Parse address components
  const detailedAddr = record.detailed_address;
  let city = detailedAddr?.city || null;
  let state = detailedAddr?.state || null;
  let postalCode = detailedAddr?.postal_code || null;
  let streetAddress = detailedAddr?.street || null;

  // Fallback: parse from address string "Street, City, ST ZIP, Country"
  if ((!city || !state || !postalCode) && record.address) {
    const parts = record.address.split(",").map((p) => p.trim());
    if (parts.length >= 3) {
      streetAddress = streetAddress || parts[0] || null;
      city = city || parts[1] || null;

      // Parse "ST ZIP" from third part
      const stateZipMatch = parts[2]?.match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
      if (stateZipMatch) {
        const stateAbbr = stateZipMatch[1];
        state = state || getStateName(stateAbbr || "") || stateAbbr || null;
        postalCode = postalCode || stateZipMatch[2] || null;
      }
    }
  }

  // Skip if missing critical location data
  if (!city || !postalCode) {
    return null;
  }

  // Determine state abbreviation
  const stateAbbreviation = state
    ? getStateAbbreviation(state) || (state.length === 2 ? state.toUpperCase() : null)
    : null;

  // Generate permalink
  const permalink = `pain-management/${generatePermalinkSlug(
    record.name,
    stateAbbreviation || "XX",
    postalCode
  )}`;

  // Parse closed_on array to string
  const closedOn = record.closed_on && Array.isArray(record.closed_on)
    ? record.closed_on.join(", ")
    : null;

  // Parse reviews_per_rating
  const reviewsPerScore = record.reviews_per_rating && typeof record.reviews_per_rating === "object"
    ? record.reviews_per_rating
    : null;

  // Get featured reviews: prefer provided, otherwise auto-select from detailed_reviews
  const featuredReviews = parseFeaturedReviews(record.featured_reviews)
    || selectFeaturedReviews(record.detailed_reviews || null);

  return {
    placeId: record.place_id,
    title: record.name.trim(),
    permalink,
    postType: "pain-management",
    clinicType: record.main_category || null,
    streetAddress,
    city,
    state: state || "Unknown",
    stateAbbreviation,
    postalCode,
    mapLatitude: lat ?? 0,
    mapLongitude: lng ?? 0,
    detailedAddress: record.address || null,
    phone: record.phone || null,
    phones: record.phones && record.phones.length > 0 ? record.phones : null,
    website: record.website || null,
    emails: record.emails && record.emails.length > 0 ? record.emails : null,
    reviewCount: record.reviews || 0,
    rating: record.rating || null,
    reviewsPerScore,
    reviewKeywords: parseReviewKeywords(record.review_keywords),
    featuredReviews,
    detailedReviews: record.detailed_reviews || null,
    allReviewsText: createStrippedReviewsText(record.detailed_reviews),
    priceRange: record.price_range || null,
    businessDescription: buildRawDescriptionContext(record),
    content: generateSEODescription(record),
    clinicHours: parseHours(record.hours),
    closedOn,
    timezone: record.time_zone || null,
    imageFeatured: record.featured_image || null,
    clinicImageUrls: parseImages(record.images, record.featured_images),
    googleListingLink: record.link || null,
    checkboxFeatures: record.categories || null,
    facebook: cleanSocialUrl(record.facebook),
    instagram: cleanSocialUrl(record.instagram),
    twitter: cleanSocialUrl(record.twitter),
    youtube: cleanSocialUrl(record.youtube),
    linkedin: cleanSocialUrl(record.linkedin),
    tiktok: cleanSocialUrl(record.tiktok),
    pinterest: cleanSocialUrl(record.pinterest),
    status: "draft" as const,
  };
}

/**
 * Determine which fields to update (fill gaps only)
 * Returns only fields that are NULL/empty in existing clinic but have values in new data
 */
function getFieldsToUpdate(
  existingClinic: typeof clinics.$inferSelect,
  newData: Partial<typeof clinics.$inferInsert>
): ClinicUpdateFields {
  const updates: ClinicUpdateFields = {};

  // Define fields that can be updated (fill gaps)
  const fillableFields: Array<keyof typeof clinics.$inferSelect> = [
    "phone",
    "phones",
    "website",
    "emails",
    "reviewCount",
    "rating",
    "reviewsPerScore",
    "reviewKeywords",
    "featuredReviews",
    "detailedReviews",
    "allReviewsText",
    "priceRange",
    "businessDescription",
    "content",
    "clinicHours",
    "closedOn",
    "timezone",
    "imageFeatured",
    "clinicImageUrls",
    "googleListingLink",
    "checkboxFeatures",
    "facebook",
    "instagram",
    "twitter",
    "youtube",
    "linkedin",
    "tiktok",
    "pinterest",
    // Location fields (only if currently 0 or null)
    "streetAddress",
    "detailedAddress",
  ];

  for (const field of fillableFields) {
    const existingValue = existingClinic[field];
    const newValue = newData[field as keyof typeof newData];

    // Check if existing is empty and new has value
    const existingIsEmpty = existingValue === null || existingValue === undefined ||
      existingValue === "" ||
      (Array.isArray(existingValue) && existingValue.length === 0) ||
      (typeof existingValue === "object" && existingValue !== null && Object.keys(existingValue).length === 0);

    const newHasValue = newValue !== null && newValue !== undefined &&
      newValue !== "" &&
      !(Array.isArray(newValue) && newValue.length === 0) &&
      !(typeof newValue === "object" && newValue !== null && Object.keys(newValue).length === 0);

    if (existingIsEmpty && newHasValue) {
      updates[field] = newValue;
    }
  }

  // Special handling for coordinates (only update if currently 0)
  if (existingClinic.mapLatitude === 0 && newData.mapLatitude && newData.mapLatitude !== 0) {
    updates.mapLatitude = newData.mapLatitude;
  }
  if (existingClinic.mapLongitude === 0 && newData.mapLongitude && newData.mapLongitude !== 0) {
    updates.mapLongitude = newData.mapLongitude;
  }

  // Special: update review count if new is higher
  if (newData.reviewCount && existingClinic.reviewCount !== null &&
      newData.reviewCount > existingClinic.reviewCount) {
    updates.reviewCount = newData.reviewCount;
  }

  // Force update clinicHours if new data has valid hours
  // This overrides existing hours even if not empty (to fix bad imports)
  if (newData.clinicHours && Array.isArray(newData.clinicHours) && newData.clinicHours.length > 0) {
    // Check if new hours have actual time values (not just "Hours not specified")
    const hasValidHours = newData.clinicHours.some(
      (h) => h.hours && h.hours !== "Hours not specified"
    );
    if (hasValidHours) {
      updates.clinicHours = newData.clinicHours;
    }
  }

  // Force update featuredReviews if new data has reviews with ratings
  // This fixes reviews imported without ratings
  if (newData.featuredReviews && Array.isArray(newData.featuredReviews) && newData.featuredReviews.length > 0) {
    const hasRatings = newData.featuredReviews.some((r) => r.rating !== null && r.rating !== undefined);
    if (hasRatings) {
      updates.featuredReviews = newData.featuredReviews;
    }
  }

  return updates;
}

// =============================================================================
// Main Import Logic
// =============================================================================

async function main() {
  const config = parseArgs();

  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║          BULK CLINIC IMPORT FROM JSON                          ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log();
  console.log(`Configuration:`);
  console.log(`  File:       ${config.file}`);
  console.log(`  Dry Run:    ${config.dryRun ? "YES (no changes will be made)" : "NO"}`);
  console.log(`  Limit:      ${config.limit || "None (all records)"}`);
  console.log(`  Batch Size: ${config.batchSize}`);
  console.log(`  Delay:      ${config.delay}ms between batches`);
  console.log();

  // Initialize stats
  const stats: ImportStats = {
    total: 0,
    newInserted: 0,
    existingUpdated: 0,
    skippedNoPlaceId: 0,
    skippedDuplicate: 0,
    skippedNoLocation: 0,
    errors: [],
  };

  // Step 1: Load JSON file
  console.log("Step 1: Loading JSON file...");
  const filePath = path.resolve(process.cwd(), config.file);

  if (!fs.existsSync(filePath)) {
    console.error(`  ERROR: File not found: ${filePath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const records: ScraperRecord[] = JSON.parse(fileContent);

  stats.total = records.length;
  console.log(`  Loaded ${stats.total} records from JSON file`);
  console.log();

  // Apply limit if specified
  const recordsToProcess = config.limit > 0 ? records.slice(0, config.limit) : records;
  console.log(`  Processing ${recordsToProcess.length} records`);
  console.log();

  // Step 2: Fetch existing clinics by placeId
  console.log("Step 2: Fetching existing clinics from database...");

  // Get all place IDs from import data
  const importPlaceIds = recordsToProcess
    .map((r) => r.place_id)
    .filter((id): id is string => Boolean(id));

  console.log(`  Found ${importPlaceIds.length} place IDs in import data`);

  // Fetch existing clinics with matching place IDs
  const existingClinics = await db
    .select()
    .from(clinics)
    .where(
      importPlaceIds.length > 0
        ? inArray(clinics.placeId, importPlaceIds)
        : sql`FALSE`
    );

  // Create lookup map
  const existingByPlaceId = new Map<string, typeof clinics.$inferSelect>();
  for (const clinic of existingClinics) {
    if (clinic.placeId) {
      existingByPlaceId.set(clinic.placeId, clinic);
    }
  }

  console.log(`  Found ${existingByPlaceId.size} existing clinics with matching place IDs`);
  console.log();

  // Get total clinic count
  const totalCountResult = await db.select({ count: sql<number>`count(*)::int` }).from(clinics);
  const currentTotalClinics = totalCountResult[0]?.count || 0;
  console.log(`  Current total clinics in database: ${currentTotalClinics}`);
  console.log();

  // Step 3: Create import batch record
  let batchId: string | null = null;
  if (!config.dryRun) {
    console.log("Step 3: Creating import batch record...");
    batchId = createId();
    await db.insert(importBatches).values({
      id: batchId,
      fileName: path.basename(config.file),
      status: "processing",
      totalRecords: recordsToProcess.length,
      importedBy: null, // CLI import
    });
    console.log(`  Batch ID: ${batchId}`);
  } else {
    console.log("Step 3: Skipping batch record (dry run)");
  }
  console.log();

  // Step 4: Process records in batches
  console.log("Step 4: Processing records...");
  console.log();

  const newToInsert: Array<typeof clinics.$inferInsert> = [];
  const existingToUpdate: Array<{ id: string; placeId: string; updates: ClinicUpdateFields; fieldCount: number }> = [];
  const seenPlaceIds = new Set<string>();

  // First pass: categorize records
  for (const record of recordsToProcess) {
    // Skip if no place_id
    if (!record.place_id) {
      stats.skippedNoPlaceId++;
      continue;
    }

    // Skip duplicates within this import
    if (seenPlaceIds.has(record.place_id)) {
      stats.skippedDuplicate++;
      continue;
    }
    seenPlaceIds.add(record.place_id);

    // Transform the record
    const transformed = transformRecord(record);
    if (!transformed) {
      stats.skippedNoLocation++;
      continue;
    }

    // Check if existing
    const existing = existingByPlaceId.get(record.place_id);

    if (existing) {
      // Determine fields to update
      const updates = getFieldsToUpdate(existing, transformed);
      const fieldCount = Object.keys(updates).length;

      if (fieldCount > 0) {
        // Add import timestamp to track when clinic was updated (for UPDATED badge)
        updates.importUpdatedAt = new Date();

        existingToUpdate.push({
          id: existing.id,
          placeId: record.place_id,
          updates,
          fieldCount,
        });
      }
    } else {
      // New clinic
      newToInsert.push({
        ...transformed,
        importBatchId: batchId,
        importedAt: new Date(), // Track when clinic was first imported (for NEW badge)
      } as typeof clinics.$inferInsert);
    }
  }

  console.log(`  Categorization complete:`);
  console.log(`    - NEW clinics to insert:    ${newToInsert.length}`);
  console.log(`    - EXISTING to update:       ${existingToUpdate.length}`);
  console.log(`    - Skipped (no place_id):    ${stats.skippedNoPlaceId}`);
  console.log(`    - Skipped (duplicate):      ${stats.skippedDuplicate}`);
  console.log(`    - Skipped (no location):    ${stats.skippedNoLocation}`);
  console.log();

  if (config.dryRun) {
    console.log("═══════════════════════════════════════════════════════════════════");
    console.log("DRY RUN - No changes made. Summary of what would happen:");
    console.log("═══════════════════════════════════════════════════════════════════");
    console.log();

    if (newToInsert.length > 0) {
      console.log(`NEW CLINICS (first 10):`);
      for (const clinic of newToInsert.slice(0, 10)) {
        console.log(`  + ${clinic.title} (${clinic.city}, ${clinic.stateAbbreviation})`);
      }
      if (newToInsert.length > 10) {
        console.log(`  ... and ${newToInsert.length - 10} more`);
      }
      console.log();
    }

    if (existingToUpdate.length > 0) {
      console.log(`EXISTING CLINICS TO UPDATE (first 10):`);
      for (const item of existingToUpdate.slice(0, 10)) {
        const fields = Object.keys(item.updates).join(", ");
        console.log(`  ~ ${item.placeId}: ${item.fieldCount} fields (${fields})`);
      }
      if (existingToUpdate.length > 10) {
        console.log(`  ... and ${existingToUpdate.length - 10} more`);
      }
      console.log();
    }

    // Summary stats for update fields
    if (existingToUpdate.length > 0) {
      const fieldCounts: Record<string, number> = {};
      for (const item of existingToUpdate) {
        for (const field of Object.keys(item.updates)) {
          fieldCounts[field] = (fieldCounts[field] || 0) + 1;
        }
      }
      console.log("FIELDS TO BE UPDATED (gap-fill counts):");
      const sortedFields = Object.entries(fieldCounts).sort((a, b) => b[1] - a[1]);
      for (const [field, count] of sortedFields) {
        console.log(`  ${field}: ${count} clinics`);
      }
      console.log();
    }

    console.log("═══════════════════════════════════════════════════════════════════");
    console.log("Run without --dry-run to apply changes");
    console.log("═══════════════════════════════════════════════════════════════════");
    process.exit(0);
  }

  // Execute inserts in batches
  console.log("Step 5: Inserting new clinics...");
  let insertBatch = 0;
  for (let i = 0; i < newToInsert.length; i += config.batchSize) {
    insertBatch++;
    const batch = newToInsert.slice(i, i + config.batchSize);
    const progress = Math.round((i / newToInsert.length) * 100);

    process.stdout.write(`\r  Batch ${insertBatch}: Inserting ${batch.length} clinics (${progress}%)...`);

    try {
      await db.insert(clinics).values(batch).onConflictDoNothing();
      stats.newInserted += batch.length;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      for (const clinic of batch) {
        stats.errors.push({
          placeId: clinic.placeId || "unknown",
          name: clinic.title || "unknown",
          error: errorMsg,
        });
      }
    }

    // Delay between batches
    if (i + config.batchSize < newToInsert.length) {
      await sleep(config.delay);
    }
  }
  console.log(`\r  Inserted ${stats.newInserted} new clinics                              `);
  console.log();

  // Execute updates in batches
  console.log("Step 6: Updating existing clinics (fill gaps)...");
  let updateBatch = 0;
  for (let i = 0; i < existingToUpdate.length; i += config.batchSize) {
    updateBatch++;
    const batch = existingToUpdate.slice(i, i + config.batchSize);
    const progress = Math.round((i / existingToUpdate.length) * 100);

    process.stdout.write(`\r  Batch ${updateBatch}: Updating ${batch.length} clinics (${progress}%)...`);

    for (const item of batch) {
      try {
        await db
          .update(clinics)
          .set(item.updates as Partial<typeof clinics.$inferInsert>)
          .where(eq(clinics.id, item.id));
        stats.existingUpdated++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        stats.errors.push({
          placeId: item.placeId,
          name: item.placeId,
          error: errorMsg,
        });
      }
    }

    // Delay between batches
    if (i + config.batchSize < existingToUpdate.length) {
      await sleep(config.delay);
    }
  }
  console.log(`\r  Updated ${stats.existingUpdated} existing clinics                         `);
  console.log();

  // Update batch record
  if (batchId) {
    await db
      .update(importBatches)
      .set({
        status: stats.errors.length > 0 ? "completed" : "completed",
        successCount: stats.newInserted + stats.existingUpdated,
        errorCount: stats.errors.length,
        skipCount: stats.skippedNoPlaceId + stats.skippedDuplicate + stats.skippedNoLocation,
        errors: stats.errors.length > 0 ? stats.errors : null,
        completedAt: new Date(),
      })
      .where(eq(importBatches.id, batchId));
  }

  // Final count
  const finalCountResult = await db.select({ count: sql<number>`count(*)::int` }).from(clinics);
  const finalTotalClinics = finalCountResult[0]?.count || 0;

  // Print final report
  console.log();
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║                    IMPORT COMPLETE                             ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log();
  console.log("SUMMARY:");
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log(`  Total records in file:        ${stats.total}`);
  console.log(`  Records processed:            ${recordsToProcess.length}`);
  console.log();
  console.log(`  NEW clinics inserted:         ${stats.newInserted}`);
  console.log(`  EXISTING clinics updated:     ${stats.existingUpdated}`);
  console.log();
  console.log(`  Skipped (no place_id):        ${stats.skippedNoPlaceId}`);
  console.log(`  Skipped (duplicates):         ${stats.skippedDuplicate}`);
  console.log(`  Skipped (no location):        ${stats.skippedNoLocation}`);
  console.log(`  Errors:                       ${stats.errors.length}`);
  console.log();
  console.log("DATABASE COUNTS:");
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log(`  Clinics BEFORE import:        ${currentTotalClinics}`);
  console.log(`  Clinics AFTER import:         ${finalTotalClinics}`);
  console.log(`  Net change:                   +${finalTotalClinics - currentTotalClinics}`);
  console.log();

  if (stats.errors.length > 0) {
    console.log("ERRORS (first 20):");
    console.log("═══════════════════════════════════════════════════════════════════");
    for (const err of stats.errors.slice(0, 20)) {
      console.log(`  ${err.name}: ${err.error}`);
    }
    if (stats.errors.length > 20) {
      console.log(`  ... and ${stats.errors.length - 20} more errors`);
    }
    console.log();
  }

  if (batchId) {
    console.log(`Import batch ID: ${batchId}`);
    console.log("View in admin: /admin/import");
  }

  console.log();
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║                    IMPORT FINISHED                             ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");

  process.exit(stats.errors.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
