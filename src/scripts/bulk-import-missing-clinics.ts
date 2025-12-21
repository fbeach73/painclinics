/**
 * Bulk import missing clinics from WordPress
 * Run: POSTGRES_URL="..." pnpm tsx src/scripts/bulk-import-missing-clinics.ts
 *
 * This script:
 * 1. Fetches all slugs from WordPress
 * 2. Compares with database to find missing clinics
 * 3. Fetches full data for each missing clinic from WordPress
 * 4. Imports them into the database with new-format permalinks
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";
import { sql } from "drizzle-orm";

const WP_API_BASE = "https://wordpress-1356334-4988742.cloudwaysapps.com/wp-json/wp/v2/pain-management";
const PER_PAGE = 100;
const BATCH_SIZE = 10; // Process 10 at a time to avoid rate limiting

interface WPTerm {
  id: number;
  name: string;
  slug: string;
  taxonomy: string;
}

interface WPClinic {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  // Embedded taxonomy terms (categories, tags, etc.)
  _embedded?: {
    "wp:term"?: WPTerm[][];
  };
  // Direct taxonomy IDs
  categories?: number[];
  tags?: number[];
  // Custom taxonomies - cities often in "city" or similar
  city?: number[];
  state?: number[];
  acf?: {
    place_id?: string;
    street_address?: string;
    city?: string;
    state?: string;
    state_abbreviation?: string;
    postal_code?: string;
    map_latitude?: string;
    map_longitude?: string;
    phone?: string;
    website?: string;
    review_count?: number;
    rating?: number;
    reviews_per_score?: Array<{ score: number; count: number }>;
    review_keywords?: Array<{ keyword: string; count: number }>;
    featured_reviews?: Array<{
      username: string;
      profile_url?: string;
      review: string;
      date_review_left?: string;
      rating: number;
    }>;
    clinic_hours?: Array<{ day: string; hours: string }>;
    closed_on?: string;
    popular_times?: Array<{ hour_of_day: string; average_popularity: number }>;
    image_featured?: string;
    clinic_image_urls?: string[];
    amenities?: string[];
    checkbox_features?: string[];
    questions?: Array<{ question: string; answer: string }>;
    clinic_type?: string;
  };
}

async function fetchAllWPSlugs(): Promise<string[]> {
  console.log("Fetching all WordPress slugs...");
  const slugs: string[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(`${WP_API_BASE}?per_page=${PER_PAGE}&page=${page}&_fields=slug`);
    if (!res.ok) {
      if (res.status === 400) {
        hasMore = false;
        break;
      }
      throw new Error(`WordPress API error: ${res.status}`);
    }
    const posts = (await res.json()) as { slug: string }[];
    if (posts.length === 0) {
      hasMore = false;
    } else {
      slugs.push(...posts.map((p) => p.slug));
      console.log(`  Fetched page ${page}: ${posts.length} slugs (total: ${slugs.length})`);
      page++;
    }
  }

  return slugs;
}

async function fetchClinicBySlug(slug: string): Promise<WPClinic | null> {
  // Use _embed to get taxonomy terms (categories with city/state info)
  const res = await fetch(`${WP_API_BASE}?slug=${encodeURIComponent(slug)}&_embed`);
  if (!res.ok) {
    console.error(`  Failed to fetch ${slug}: ${res.status}`);
    return null;
  }
  const posts = (await res.json()) as WPClinic[];
  return posts[0] || null;
}

/**
 * Extract city from embedded taxonomy terms
 * WordPress uses custom taxonomy "city-name" with the city as the term name
 */
function extractLocationFromTerms(wpClinic: WPClinic): { city: string | null; state: string | null } {
  const terms = wpClinic._embedded?.["wp:term"]?.flat() || [];

  let city: string | null = null;

  for (const term of terms) {
    // Look for city-name taxonomy
    if (term.taxonomy === "city-name" && term.name) {
      city = term.name;
      break;
    }
  }

  return { city, state: null };
}

// State abbreviation to full name lookup
const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia", PR: "Puerto Rico", VI: "Virgin Islands", GU: "Guam",
};

/**
 * Parse location info from WordPress slug
 * Examples:
 * - brenner-gary-j-md-phd-ma-2114 → { state: "MA", zip: "02114" }
 * - saint-francis-pain-management-center-63703 → { state: null, zip: "63703" }
 * - kc-pain-centers-ks → { state: "KS", zip: null }
 */
function parseSlugLocation(slug: string): { state: string | null; zip: string | null } {
  // Try pattern: name-STATE-ZIP (e.g., clinic-ma-2114)
  const stateZipMatch = slug.match(/-([a-z]{2})-(\d{4,9})$/i);
  if (stateZipMatch && stateZipMatch[1] && stateZipMatch[2]) {
    const zip = stateZipMatch[2].length === 4
      ? "0" + stateZipMatch[2] // Pad 4-digit zips
      : stateZipMatch[2].substring(0, 5); // Truncate ZIP+4
    return { state: stateZipMatch[1].toUpperCase(), zip };
  }

  // Try pattern: name-ZIP only (e.g., clinic-63703)
  const zipOnlyMatch = slug.match(/-(\d{5})$/);
  if (zipOnlyMatch && zipOnlyMatch[1]) {
    return { state: null, zip: zipOnlyMatch[1] };
  }

  // Try pattern: name-STATE only (e.g., clinic-ks)
  const stateOnlyMatch = slug.match(/-([a-z]{2})$/i);
  if (stateOnlyMatch && stateOnlyMatch[1]) {
    return { state: stateOnlyMatch[1].toUpperCase(), zip: null };
  }

  return { state: null, zip: null };
}

function cleanHtml(html: string): string {
  // Basic HTML cleaning - keep structure but remove problematic characters
  return html
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, "  ")
    .trim();
}

async function getMissingSlugs(): Promise<string[]> {
  const wpSlugs = await fetchAllWPSlugs();
  console.log(`\nTotal WordPress slugs: ${wpSlugs.length}`);

  // Get all permalinks from DB
  const dbClinics = await db
    .select({ permalink: clinics.permalink })
    .from(clinics);

  // Create a set of DB slugs
  const dbSlugs = new Set(
    dbClinics.map((c) => {
      if (!c.permalink) return "";
      const slug = c.permalink.replace(/^pain-management\//, "");
      return slug.toLowerCase();
    })
  );

  console.log(`Total DB clinics: ${dbClinics.length}`);

  // Find WordPress slugs not in DB
  const missing: string[] = [];
  for (const wpSlug of wpSlugs) {
    const found =
      dbSlugs.has(wpSlug.toLowerCase()) ||
      [...dbSlugs].some((dbSlug) => dbSlug.includes(wpSlug.toLowerCase()));

    if (!found) {
      missing.push(wpSlug);
    }
  }

  console.log(`Missing from DB: ${missing.length}`);
  return missing;
}

async function importClinic(wpClinic: WPClinic, wpSlug: string): Promise<boolean> {
  const acf = wpClinic.acf || {};
  const title = wpClinic.title.rendered
    .replace(/&#8211;/g, "-")
    .replace(/&#8217;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#038;/g, "&");

  // Parse location from WordPress slug as fallback
  const slugLocation = parseSlugLocation(wpSlug);

  // Try to extract city/state from taxonomy terms (categories)
  const termLocation = extractLocationFromTerms(wpClinic);

  // Priority: ACF fields > Taxonomy terms > Slug parsing > Fallback
  const stateAbbrev = acf.state_abbreviation || termLocation.state || slugLocation.state || "XX";
  const stateName = acf.state || STATE_NAMES[stateAbbrev] || "Unknown";
  const postalCode = acf.postal_code || slugLocation.zip || "00000";
  const city = acf.city || termLocation.city || "Unknown";

  // USE THE ORIGINAL WORDPRESS SLUG - preserves exact URL structure!
  const permalink = `pain-management/${wpSlug}`;

  // Check if permalink already exists
  const existing = await db
    .select({ id: clinics.id })
    .from(clinics)
    .where(sql`LOWER(permalink) = LOWER(${permalink})`)
    .limit(1);

  if (existing.length > 0) {
    console.log(`  Skipping (permalink exists): ${permalink}`);
    return false;
  }

  const clinicData = {
    wpId: wpClinic.id,
    placeId: acf.place_id || null,
    title,
    permalink,
    postType: "pain-management",
    clinicType: acf.clinic_type || "Pain Management Physician",

    // Location - use parsed/fallback values
    streetAddress: acf.street_address || null,
    city, // Required field - "Unknown" if not in ACF
    state: stateName, // Required field - derived from state abbreviation if not in ACF
    stateAbbreviation: stateAbbrev,
    postalCode,
    // Lat/lng required - use 0.0 as placeholder (will need geocoding later)
    mapLatitude: acf.map_latitude ? parseFloat(acf.map_latitude) : 0.0,
    mapLongitude: acf.map_longitude ? parseFloat(acf.map_longitude) : 0.0,

    // Contact
    phone: acf.phone || null,
    website: acf.website || null,

    // Reviews & Ratings
    reviewCount: acf.review_count || 0,
    rating: acf.rating || null,
    reviewsPerScore: acf.reviews_per_score || [],
    reviewKeywords: acf.review_keywords || [],
    featuredReviews: acf.featured_reviews?.map((r) => ({
      username: r.username,
      profileUrl: r.profile_url,
      review: r.review,
      dateReviewLeft: r.date_review_left,
      rating: r.rating,
    })) || [],

    // Business Hours
    clinicHours: acf.clinic_hours || [],
    closedOn: acf.closed_on || null,
    popularTimes: acf.popular_times?.map((t) => ({
      hourOfDay: t.hour_of_day,
      averagePopularity: t.average_popularity,
    })) || [],

    // Content
    content: cleanHtml(wpClinic.content.rendered),

    // Images
    imageFeatured: acf.image_featured || null,
    clinicImageUrls: acf.clinic_image_urls || [],

    // Amenities & Features
    amenities: acf.amenities || [],
    checkboxFeatures: acf.checkbox_features || [],

    // Q&A
    questions: acf.questions || [],
  };

  try {
    await db.insert(clinics).values(clinicData).onConflictDoNothing();
    return true;
  } catch (error) {
    console.error(`  Failed to insert ${title}:`, error);
    return false;
  }
}

async function main() {
  console.log("=== Bulk Import Missing Clinics ===\n");

  // Check for command line args
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limit = args.find((a) => a.startsWith("--limit="));
  const maxImport = limit ? parseInt(limit.split("=")[1] || "0", 10) : 0;

  if (dryRun) {
    console.log("DRY RUN MODE - No changes will be made\n");
  }

  // Get missing slugs
  const missingSlugs = await getMissingSlugs();

  if (missingSlugs.length === 0) {
    console.log("\nNo missing clinics found!");
    process.exit(0);
  }

  console.log(`\nFound ${missingSlugs.length} missing clinics to import`);

  if (dryRun) {
    console.log("\nFirst 20 missing slugs:");
    missingSlugs.slice(0, 20).forEach((slug) => console.log(`  - ${slug}`));
    process.exit(0);
  }

  // Import in batches
  const toImport = maxImport > 0 ? missingSlugs.slice(0, maxImport) : missingSlugs;
  console.log(`\nImporting ${toImport.length} clinics...`);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < toImport.length; i += BATCH_SIZE) {
    const batch = toImport.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toImport.length / BATCH_SIZE)}:`);

    for (const slug of batch) {
      console.log(`  Fetching: ${slug}`);
      const wpClinic = await fetchClinicBySlug(slug);

      if (!wpClinic) {
        console.log(`  ❌ Not found in WordPress`);
        failed++;
        continue;
      }

      const success = await importClinic(wpClinic, slug);
      if (success) {
        console.log(`  ✅ Imported: ${wpClinic.title.rendered}`);
        imported++;
      } else {
        skipped++;
      }
    }

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < toImport.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log("\n=== Import Complete ===");
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${imported + skipped + failed}`);

  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
