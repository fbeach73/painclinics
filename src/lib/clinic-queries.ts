import { sql, asc, desc, eq, or, ilike, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";
import { US_STATES, US_STATES_REVERSE } from "@/lib/us-states";

/**
 * SQL fragment to filter only published clinics.
 * Used by all public-facing queries to ensure only published clinics are shown.
 */
const isPublishedSql = eq(clinics.status, "published");

/**
 * SQL fragment to order by featured status.
 * Premium > Basic > None, then by rating.
 */
const featuredOrderSql = sql`
  CASE
    WHEN ${clinics.featuredTier} = 'premium' AND ${clinics.isFeatured} = true AND (${clinics.featuredUntil} IS NULL OR ${clinics.featuredUntil} > NOW()) THEN 3
    WHEN ${clinics.featuredTier} = 'basic' AND ${clinics.isFeatured} = true AND (${clinics.featuredUntil} IS NULL OR ${clinics.featuredUntil} > NOW()) THEN 2
    WHEN ${clinics.isFeatured} = true AND (${clinics.featuredUntil} IS NULL OR ${clinics.featuredUntil} > NOW()) THEN 1
    ELSE 0
  END
`;

/**
 * Fetch a single clinic by its permalink slug.
 * Handles case-insensitive lookup and automatically prefixes with "pain-management/".
 *
 * @param slug - The clinic slug (without the "pain-management/" prefix)
 * @returns The clinic record or null if not found
 */
export async function getClinicByPermalink(slug: string) {
  const permalinkPath = `pain-management/${slug}`;

  const results = await db
    .select()
    .from(clinics)
    .where(and(
      sql`LOWER(${clinics.permalink}) = LOWER(${permalinkPath})`,
      isPublishedSql
    ))
    .limit(1);

  return results[0] || null;
}

/**
 * Find a clinic by attempting to strip common duplicate suffixes (-2, -3, etc).
 * Used to handle legacy URLs where duplicate clinics had numeric suffixes.
 *
 * @param slug - The clinic slug that may end with -N suffix
 * @returns The clinic record with the canonical permalink, or null if not found
 */
export async function getClinicByStrippedSlug(slug: string): Promise<{ clinic: ClinicRecord; canonicalSlug: string } | null> {
  // Check if slug ends with -{number} pattern (e.g., -2, -3, -4)
  const match = slug.match(/^(.+)-(\d+)$/);

  if (!match || !match[1]) {
    return null;
  }

  const baseSlug = match[1];

  // Try to find clinic with the base slug (without the -N suffix)
  const clinic = await getClinicByPermalink(baseSlug);

  if (clinic) {
    return { clinic, canonicalSlug: baseSlug };
  }

  return null;
}

/**
 * Fetch all clinic permalinks and update timestamps for sitemap generation.
 * Returns only the fields needed for sitemap generation to minimize data transfer.
 *
 * @returns Array of { permalink, updatedAt } objects
 */
export async function getAllClinicPermalinks() {
  return db
    .select({
      permalink: clinics.permalink,
      updatedAt: clinics.updatedAt,
    })
    .from(clinics)
    .where(isPublishedSql);
}

/**
 * Fetch all clinics in a specific state, ordered by featured status, then city and title.
 * Handles case-insensitive state abbreviation lookup.
 * Featured clinics (premium first, then basic) appear before non-featured clinics.
 *
 * @param stateAbbrev - Two-letter state abbreviation (e.g., "AL", "CA")
 * @returns Array of clinic records
 */
export async function getClinicsByState(stateAbbrev: string) {
  return db
    .select()
    .from(clinics)
    .where(and(
      sql`UPPER(${clinics.stateAbbreviation}) = UPPER(${stateAbbrev})`,
      isPublishedSql
    ))
    .orderBy(desc(featuredOrderSql), asc(clinics.city), asc(clinics.title));
}

/**
 * Get all unique state abbreviations that have clinics.
 * Used for generating state landing page routes.
 *
 * @returns Array of unique state abbreviations
 */
export async function getAllStatesWithClinics() {
  const results = await db
    .selectDistinct({ stateAbbreviation: clinics.stateAbbreviation })
    .from(clinics)
    .where(isPublishedSql);

  return results
    .filter((r) => r.stateAbbreviation && r.stateAbbreviation in US_STATES_REVERSE)
    .map((r) => r.stateAbbreviation!);
}

/**
 * Get clinic count by state for summary statistics.
 * Filters out invalid state abbreviations (like 'XX').
 *
 * @returns Array of { stateAbbreviation, count } objects
 */
export async function getClinicCountsByState() {
  const results = await db
    .select({
      stateAbbreviation: clinics.stateAbbreviation,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(clinics)
    .where(isPublishedSql)
    .groupBy(clinics.stateAbbreviation)
    .orderBy(asc(clinics.stateAbbreviation));

  // Filter to only valid US state abbreviations
  return results.filter(
    (r) => r.stateAbbreviation && r.stateAbbreviation in US_STATES_REVERSE
  );
}

/**
 * Search clinics by city and optional state.
 * Featured clinics appear first, ordered by tier (premium > basic > none).
 *
 * @param city - City name (case-insensitive)
 * @param stateAbbrev - Optional state abbreviation filter
 * @returns Array of clinic records
 */
export async function getClinicsByCity(city: string, stateAbbrev?: string) {
  if (stateAbbrev) {
    return db
      .select()
      .from(clinics)
      .where(and(
        sql`LOWER(${clinics.city}) = LOWER(${city}) AND UPPER(${clinics.stateAbbreviation}) = UPPER(${stateAbbrev})`,
        isPublishedSql
      ))
      .orderBy(desc(featuredOrderSql), desc(clinics.rating), asc(clinics.title));
  }

  return db
    .select()
    .from(clinics)
    .where(and(
      sql`LOWER(${clinics.city}) = LOWER(${city})`,
      isPublishedSql
    ))
    .orderBy(desc(featuredOrderSql), desc(clinics.rating), asc(clinics.title));
}

/**
 * Get all unique cities with clinics for a specific state.
 *
 * @param stateAbbrev - Two-letter state abbreviation (e.g., "CA", "NY")
 * @returns Array of unique city names
 */
export async function getCitiesForState(stateAbbrev: string) {
  const results = await db
    .selectDistinct({ city: clinics.city })
    .from(clinics)
    .where(and(
      sql`UPPER(${clinics.stateAbbreviation}) = UPPER(${stateAbbrev})`,
      isPublishedSql
    ))
    .orderBy(asc(clinics.city));
  return results.map((r) => r.city);
}

/**
 * Get all cities with clinics across all states.
 * Includes clinic count per city, grouped by state.
 *
 * @returns Array of { city, stateAbbreviation, count } objects
 */
export async function getAllCitiesWithClinics() {
  return db
    .select({
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(clinics)
    .where(isPublishedSql)
    .groupBy(clinics.city, clinics.stateAbbreviation)
    .orderBy(asc(clinics.stateAbbreviation), asc(clinics.city));
}

/**
 * Get all city permalinks for sitemap generation.
 * Converts city names to URL-friendly slugs.
 *
 * @returns Array of { state, city, count } objects with slugified values
 */
export async function getAllCityPermalinks() {
  const cities = await getAllCitiesWithClinics();
  return cities.map((c) => ({
    state: c.stateAbbreviation?.toLowerCase(),
    city: c.city.toLowerCase().replace(/\s+/g, "-"),
    count: c.count,
  }));
}

/**
 * Get clinic data with image fields for image sitemap generation.
 * Includes permalink, title, location, and all image fields.
 *
 * @returns Array of clinic records with image data
 */
export async function getClinicsWithImages() {
  return db
    .select({
      permalink: clinics.permalink,
      updatedAt: clinics.updatedAt,
      title: clinics.title,
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
      mapLatitude: clinics.mapLatitude,
      mapLongitude: clinics.mapLongitude,
      imageFeatured: clinics.imageFeatured,
      imageUrl: clinics.imageUrl,
      featImage: clinics.featImage,
    })
    .from(clinics)
    .where(isPublishedSql);
}

export interface GetClinicByIdOptions {
  includeRelations?: boolean;
}

/**
 * Fetch a single clinic by its ID.
 *
 * @param id - The clinic ID
 * @param options - Optional configuration
 * @param options.includeRelations - Include clinicServices and owner relations
 * @returns The clinic record or null if not found
 */
export async function getClinicById(
  id: string,
  options: GetClinicByIdOptions = {}
) {
  const { includeRelations = false } = options;

  if (includeRelations) {
    const result = await db.query.clinics.findFirst({
      where: eq(clinics.id, id),
      with: {
        clinicServices: {
          with: {
            service: true,
          },
        },
        owner: true,
      },
    });
    return result ?? null;
  }

  const results = await db
    .select()
    .from(clinics)
    .where(eq(clinics.id, id))
    .limit(1);

  return results[0] ?? null;
}

/**
 * Get all clinics for admin listing with basic info.
 * Returns limited fields for performance.
 * Featured clinics appear first.
 *
 * @param limit - Maximum number of clinics to return (default: 100)
 * @param offset - Number of clinics to skip (default: 0)
 * @returns Array of clinic records with basic info
 */
export async function getClinicsForAdmin(limit = 100, offset = 0) {
  return db
    .select({
      id: clinics.id,
      title: clinics.title,
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
      permalink: clinics.permalink,
      rating: clinics.rating,
      reviewCount: clinics.reviewCount,
      updatedAt: clinics.updatedAt,
      createdAt: clinics.createdAt,
      publishedAt: clinics.publishedAt,
      isFeatured: clinics.isFeatured,
      featuredTier: clinics.featuredTier,
      status: clinics.status,
      hasEnhancedContent: sql<boolean>`CASE WHEN ${clinics.newPostContent} IS NOT NULL AND ${clinics.newPostContent} != '' THEN true ELSE false END`,
      importUpdatedAt: clinics.importUpdatedAt,
    })
    .from(clinics)
    .orderBy(desc(clinics.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get total clinic count for pagination.
 *
 * @returns Total number of clinics
 */
export async function getClinicCount() {
  const result = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(clinics);
  return result[0]?.count ?? 0;
}

/**
 * Get clinics near a geographic coordinate using Haversine formula.
 * Returns clinics within the specified radius, ordered by distance.
 * Featured clinics are prioritized within distance groups.
 *
 * @param lat - Latitude of the center point
 * @param lng - Longitude of the center point
 * @param radiusMiles - Maximum distance in miles (default: 50)
 * @param limit - Maximum number of clinics to return (default: 50)
 * @returns Array of clinic records with distance
 */
export async function getNearbyClinicsByCoordinates(
  lat: number,
  lng: number,
  radiusMiles = 50,
  limit = 50
) {
  // Haversine formula in SQL for distance calculation
  const distanceSql = sql<number>`
    (3959 * acos(
      cos(radians(${lat})) *
      cos(radians(${clinics.mapLatitude})) *
      cos(radians(${clinics.mapLongitude}) - radians(${lng})) +
      sin(radians(${lat})) *
      sin(radians(${clinics.mapLatitude}))
    ))
  `;

  return db
    .select({
      id: clinics.id,
      title: clinics.title,
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
      streetAddress: clinics.streetAddress,
      postalCode: clinics.postalCode,
      phone: clinics.phone,
      permalink: clinics.permalink,
      rating: clinics.rating,
      reviewCount: clinics.reviewCount,
      mapLatitude: clinics.mapLatitude,
      mapLongitude: clinics.mapLongitude,
      isFeatured: clinics.isFeatured,
      featuredTier: clinics.featuredTier,
      imageFeatured: clinics.imageFeatured,
      distance: distanceSql,
    })
    .from(clinics)
    .where(and(
      sql`${clinics.mapLatitude} IS NOT NULL AND ${clinics.mapLongitude} IS NOT NULL AND ${distanceSql} <= ${radiusMiles}`,
      isPublishedSql
    ))
    .orderBy(desc(featuredOrderSql), sql`${distanceSql}`)
    .limit(limit);
}

// Type export for the clinic record
export type ClinicRecord = typeof clinics.$inferSelect;
export type NearbyClinic = Awaited<ReturnType<typeof getNearbyClinicsByCoordinates>>[number];

/**
 * Search clinics by name, city, or state abbreviation.
 * Returns clinics matching the search query.
 *
 * @param query - Search string (minimum 2 characters)
 * @param limit - Maximum number of results (default: 50)
 * @returns Array of clinic records matching the search
 */
export async function searchClinics(query: string, limit = 50) {
  if (!query || query.length < 2) {
    return [];
  }

  const searchPattern = `%${query}%`;

  return db
    .select({
      id: clinics.id,
      title: clinics.title,
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
      streetAddress: clinics.streetAddress,
      postalCode: clinics.postalCode,
      phone: clinics.phone,
      permalink: clinics.permalink,
      rating: clinics.rating,
      reviewCount: clinics.reviewCount,
      isFeatured: clinics.isFeatured,
    })
    .from(clinics)
    .where(and(
      or(
        ilike(clinics.title, searchPattern),
        ilike(clinics.city, searchPattern),
        ilike(clinics.stateAbbreviation, searchPattern)
      ),
      isPublishedSql
    ))
    .orderBy(desc(featuredOrderSql), desc(clinics.rating))
    .limit(limit);
}

/**
 * Featured clinic filter SQL: only currently active featured clinics.
 * A clinic is considered featured if:
 * - isFeatured = true
 * - featuredUntil is null (permanent) OR featuredUntil > now (not expired)
 */
const isFeaturedActiveSql = sql`
  ${clinics.isFeatured} = true AND (
    ${clinics.featuredUntil} IS NULL OR ${clinics.featuredUntil} > NOW()
  )
`;

export interface GetFeaturedClinicsOptions {
  lat?: number;
  lng?: number;
  radiusMiles?: number;
  stateAbbrev?: string;
  city?: string;
  limit?: number;
  excludeClinicId?: string;
  randomize?: boolean;
}

/**
 * Get featured clinics with geo-awareness and random fallback.
 *
 * Logic:
 * 1. Filter: isFeatured = true AND (featuredUntil IS NULL OR featuredUntil > NOW())
 * 2. If lat/lng provided: Calculate distance, sort by featuredTier DESC, distance ASC
 * 3. If stateAbbrev provided: Filter to that state
 * 4. If city provided: Filter to that city
 * 5. If randomize=true (no location): Use ORDER BY RANDOM()
 * 6. Exclude excludeClinicId if provided (for sidebar widget)
 *
 * @param options - Query options for filtering and sorting
 * @returns Array of featured clinics with optional distance
 */
export async function getFeaturedClinics(options: GetFeaturedClinicsOptions = {}) {
  const {
    lat,
    lng,
    radiusMiles = 50,
    stateAbbrev,
    city,
    limit = 10,
    excludeClinicId,
    randomize = false,
  } = options;

  const hasLocation = typeof lat === "number" && typeof lng === "number";

  // Distance calculation SQL (only used when location provided)
  const distanceSql = hasLocation
    ? sql<number>`
        (3959 * acos(
          cos(radians(${lat})) *
          cos(radians(${clinics.mapLatitude})) *
          cos(radians(${clinics.mapLongitude}) - radians(${lng})) +
          sin(radians(${lat})) *
          sin(radians(${clinics.mapLatitude}))
        ))
      `
    : sql<number>`0`;

  // Build WHERE conditions
  const whereConditions: ReturnType<typeof sql>[] = [isFeaturedActiveSql, isPublishedSql];

  // Exclude a specific clinic (for sidebar widget)
  if (excludeClinicId) {
    whereConditions.push(sql`${clinics.id} != ${excludeClinicId}`);
  }

  // State filter
  if (stateAbbrev) {
    whereConditions.push(
      sql`UPPER(${clinics.stateAbbreviation}) = UPPER(${stateAbbrev})`
    );
  }

  // City filter
  if (city) {
    whereConditions.push(sql`LOWER(${clinics.city}) = LOWER(${city})`);
  }

  // Location-based radius filter
  if (hasLocation) {
    whereConditions.push(
      sql`${clinics.mapLatitude} IS NOT NULL AND ${clinics.mapLongitude} IS NOT NULL AND ${distanceSql} <= ${radiusMiles}`
    );
  }

  // Combine all conditions with AND
  const combinedWhere = sql.join(whereConditions, sql` AND `);

  // Determine order by clause
  let orderByClause;
  if (randomize && !hasLocation) {
    // Random order when no location and randomize is true
    orderByClause = sql`RANDOM()`;
  } else if (hasLocation) {
    // Sort by featured tier (premium first), then by distance
    orderByClause = sql`${featuredOrderSql} DESC, ${distanceSql} ASC`;
  } else {
    // Default: sort by featured tier, then rating
    orderByClause = sql`${featuredOrderSql} DESC, ${clinics.rating} DESC NULLS LAST`;
  }

  const results = await db
    .select({
      id: clinics.id,
      title: clinics.title,
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
      streetAddress: clinics.streetAddress,
      postalCode: clinics.postalCode,
      phone: clinics.phone,
      permalink: clinics.permalink,
      rating: clinics.rating,
      reviewCount: clinics.reviewCount,
      mapLatitude: clinics.mapLatitude,
      mapLongitude: clinics.mapLongitude,
      isFeatured: clinics.isFeatured,
      featuredTier: clinics.featuredTier,
      featuredUntil: clinics.featuredUntil,
      imageFeatured: clinics.imageFeatured,
      imageUrl: clinics.imageUrl,
      clinicImageUrls: clinics.clinicImageUrls,
      isVerified: clinics.isVerified,
      distance: distanceSql,
    })
    .from(clinics)
    .where(combinedWhere)
    .orderBy(orderByClause)
    .limit(limit);

  return results;
}

export type FeaturedClinic = Awaited<ReturnType<typeof getFeaturedClinics>>[number];

/**
 * Look up a clinic by legacy WordPress slug format.
 * Old WordPress format: {clinic-name-slug}-{state}-{zipcode}
 * Example: open-arms-pain-clinic-co-80909
 *
 * @param legacySlug - The legacy WordPress slug
 * @returns The clinic record or null if not found
 */
export async function getClinicByLegacySlug(legacySlug: string) {
  // Parse legacy format: extract name, state (2 chars) and zipcode (4-5 digits) from end
  // Format: {name-slug}-{state}-{zipcode}
  // Note: Some zips like CT 06492 may appear as 6492 in URLs (missing leading zero)
  const match = legacySlug.match(/^(.+)-([a-z]{2})-(\d{4,5})$/i);
  if (!match || !match[1] || !match[2] || !match[3]) {
    return null;
  }

  const nameSlug = match[1];
  const stateAbbrev = match[2];
  const zipCode = match[3];

  // Convert slug to title format for matching (e.g., "open-arms-pain-clinic" -> "Open Arms Pain Clinic")
  const titleFromSlug = nameSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Handle zip codes with or without leading zeros
  // Try exact match first, then padded match for 4-digit zips
  const zipPadded = zipCode.padStart(5, "0");

  // Look up by state, postal code (with/without leading zero), and title match
  const results = await db
    .select()
    .from(clinics)
    .where(and(
      sql`UPPER(${clinics.stateAbbreviation}) = UPPER(${stateAbbrev})
          AND (${clinics.postalCode} = ${zipCode} OR ${clinics.postalCode} = ${zipPadded})
          AND LOWER(${clinics.title}) = LOWER(${titleFromSlug})`,
      isPublishedSql
    ))
    .limit(1);

  return results[0] || null;
}

/**
 * Look up a clinic by fuzzy matching from an old WordPress slug.
 * Handles URLs that don't have the standard -{state}-{zip} suffix,
 * or have non-standard formats like:
 *   - "auburn-pain-specialists-llc-36830" (name + zip, no state)
 *   - "arrowhead-endoscopy-pain-management-center" (name only)
 *   - "comprehensive-pain-specialists-saginaw-mi" (name + city + state)
 *   - "dr-christopher-c-wenger-md-ma-02120" (name + state + zip but title doesn't include them)
 *
 * Strategy: Try multiple parsing approaches, from most to least specific.
 *
 * @param slug - The old-format slug
 * @returns The clinic record or null if not found
 */
export async function getClinicByTitleSlug(slug: string) {
  // Normalize a string for comparison: lowercase, strip all punctuation/special chars, collapse spaces
  // This makes "Auburn Pain Specialists, LLC" match "Auburn Pain Specialists Llc"
  // and "Dr. Christopher C. Wenger, MD" match "Dr Christopher C Wenger Md"
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

  function slugToTitle(s: string): string {
    return s
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // Helper: normalize-compare title from slug against DB title (strips punctuation on both sides)
  const normalizedTitleMatch = (titleFromSlug: string) =>
    sql`LOWER(regexp_replace(${clinics.title}, '[^a-zA-Z0-9 ]', '', 'g')) = ${normalize(titleFromSlug)}`;

  // Strategy 1: Slug ends with a zip code (no state) e.g. "auburn-pain-specialists-llc-36830"
  // The actual permalink has -STATE- between name and zip, so the old slug is NOT a substring.
  // Match by normalized title + postal code instead.
  const zipOnlyMatch = slug.match(/^(.+)-(\d{5})$/);
  if (zipOnlyMatch && zipOnlyMatch[1] && zipOnlyMatch[2]) {
    const nameSlug = zipOnlyMatch[1];
    const zipCode = zipOnlyMatch[2];
    const zipPadded = zipCode.padStart(5, "0");
    const titleFromSlug = slugToTitle(nameSlug);

    // Normalized title + zip match
    const results = await db
      .select()
      .from(clinics)
      .where(and(
        sql`${normalizedTitleMatch(titleFromSlug)}
            AND (${clinics.postalCode} = ${zipCode} OR ${clinics.postalCode} = ${zipPadded})`,
        isPublishedSql
      ))
      .limit(1);

    if (results[0]) return results[0];

    // Try without zip (title-only, normalized)
    const resultsNoZip = await db
      .select()
      .from(clinics)
      .where(and(normalizedTitleMatch(titleFromSlug), isPublishedSql))
      .limit(1);

    if (resultsNoZip[0]) return resultsNoZip[0];
  }

  // Strategy 2: Slug ends with a state abbrev e.g. "comprehensive-pain-specialists-saginaw-mi"
  const stateEndMatch = slug.match(/^(.+)-([a-z]{2})$/i);
  if (stateEndMatch && stateEndMatch[1] && stateEndMatch[2]) {
    const stateAbbrev = stateEndMatch[2].toUpperCase();
    if (stateAbbrev in US_STATES_REVERSE) {
      const nameSlug = stateEndMatch[1];
      const titleFromSlug = slugToTitle(nameSlug);

      // Normalized title + state
      const results = await db
        .select()
        .from(clinics)
        .where(and(
          sql`${normalizedTitleMatch(titleFromSlug)}
              AND UPPER(${clinics.stateAbbreviation}) = ${stateAbbrev}`,
          isPublishedSql
        ))
        .limit(1);

      if (results[0]) return results[0];

      // Try stripping trailing city words from the name
      const words = nameSlug.split("-");
      for (let i = 1; i <= Math.min(3, words.length - 2); i++) {
        const shorterTitle = slugToTitle(words.slice(0, -i).join("-"));
        const cityName = slugToTitle(words.slice(-i).join("-"));

        const cityResults = await db
          .select()
          .from(clinics)
          .where(and(
            sql`${normalizedTitleMatch(shorterTitle)}
                AND UPPER(${clinics.stateAbbreviation}) = ${stateAbbrev}
                AND LOWER(${clinics.city}) = LOWER(${cityName})`,
            isPublishedSql
          ))
          .limit(1);

        if (cityResults[0]) return cityResults[0];
      }
    }
  }

  // Strategy 3: Slug has state-zip but legacy resolver already failed (punctuation mismatch)
  // e.g. "dr-christopher-c-wenger-md-ma-02120" -> title "Dr. Christopher C. Wenger, MD"
  const stateZipMatch = slug.match(/^(.+)-([a-z]{2})-(\d{4,5})$/i);
  if (stateZipMatch && stateZipMatch[1] && stateZipMatch[2] && stateZipMatch[3]) {
    const nameSlug = stateZipMatch[1];
    const stateAbbrev = stateZipMatch[2].toUpperCase();
    const zipCode = stateZipMatch[3];
    const zipPadded = zipCode.padStart(5, "0");
    const titleFromSlug = slugToTitle(nameSlug);

    // Normalized title + state + zip
    const results = await db
      .select()
      .from(clinics)
      .where(and(
        sql`${normalizedTitleMatch(titleFromSlug)}
            AND UPPER(${clinics.stateAbbreviation}) = ${stateAbbrev}
            AND (${clinics.postalCode} = ${zipCode} OR ${clinics.postalCode} = ${zipPadded})`,
        isPublishedSql
      ))
      .limit(1);

    if (results[0]) return results[0];
  }

  // Strategy 4: Plain slug, no zip or state suffix
  // e.g. "arrowhead-endoscopy-pain-management-center"
  const titleFromSlug = slugToTitle(slug);
  const results = await db
    .select()
    .from(clinics)
    .where(and(normalizedTitleMatch(titleFromSlug), isPublishedSql))
    .limit(1);

  if (results[0]) return results[0];

  // Strategy 5: Permalink contains the slug (broadest match)
  // e.g. old slug "capitol-pain-institute-austin-north" is substring of new permalink
  const results2 = await db
    .select()
    .from(clinics)
    .where(and(
      sql`LOWER(${clinics.permalink}) LIKE ${"%" + slug.toLowerCase() + "%"}`,
      isPublishedSql
    ))
    .limit(1);

  return results2[0] || null;
}

/**
 * Remove ownership from a clinic.
 * Clears ownerUserId, isVerified, and claimedAt fields.
 *
 * @param clinicId - The clinic ID to remove ownership from
 * @returns The updated clinic record
 */
export async function removeClinicOwnership(clinicId: string) {
  return db
    .update(clinics)
    .set({
      ownerUserId: null,
      isVerified: false,
      claimedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(clinics.id, clinicId))
    .returning();
}

/**
 * Parse search query into terms and build SQL conditions for search.
 * Shared between searchClinicsWithRelevance and countSearchClinics.
 */
function buildSearchConditions(query: string) {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2);

  if (terms.length === 0) return null;

  // Build per-term relevance CASE expressions
  const termScores = terms.map((term) => {
    const pattern = `%${term}%`;
    const startsPattern = `${term}%`;
    return sql`(
      CASE WHEN LOWER(${clinics.title}) = ${term} THEN 100
           WHEN LOWER(${clinics.title}) LIKE ${startsPattern} THEN 50
           WHEN LOWER(${clinics.title}) LIKE ${pattern} THEN 20
           ELSE 0 END
      + CASE WHEN LOWER(${clinics.city}) = ${term} THEN 80
             WHEN LOWER(${clinics.city}) LIKE ${startsPattern} THEN 40
             WHEN LOWER(${clinics.city}) LIKE ${pattern} THEN 15
             ELSE 0 END
      + CASE WHEN LOWER(${clinics.streetAddress}) LIKE ${pattern} THEN 10 ELSE 0 END
      + CASE WHEN ${clinics.postalCode} = ${term} THEN 30
             WHEN ${clinics.postalCode} LIKE ${startsPattern} THEN 15
             ELSE 0 END
    )`;
  });

  const relevanceScore = sql<number>`(${sql.join(termScores, sql` + `)})`;

  // Build WHERE: any term matches any column (OR across terms)
  const termMatches = terms.map((term) => {
    const pattern = `%${term}%`;
    return sql`(
      LOWER(${clinics.title}) LIKE ${pattern}
      OR LOWER(${clinics.city}) LIKE ${pattern}
      OR LOWER(${clinics.streetAddress}) LIKE ${pattern}
      OR ${clinics.postalCode} LIKE ${pattern}
    )`;
  });

  const matchesAnyTerm = sql`(${sql.join(termMatches, sql` OR `)})`;

  return { relevanceScore, matchesAnyTerm };
}

/**
 * Search clinics with multi-field relevance scoring.
 * Splits the query into terms and scores each match by field importance.
 * Uses OR logic between terms for broad matching.
 *
 * @param query - Search string (minimum 2 characters)
 * @param limit - Maximum number of results per page (default: 24)
 * @param offset - Number of results to skip (default: 0)
 * @returns Array of clinic records with relevanceScore
 */
export async function searchClinicsWithRelevance(query: string, limit = 24, offset = 0) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const conditions = buildSearchConditions(query);
  if (!conditions) return [];

  const { relevanceScore, matchesAnyTerm } = conditions;

  return db
    .select({
      id: clinics.id,
      title: clinics.title,
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
      streetAddress: clinics.streetAddress,
      postalCode: clinics.postalCode,
      phone: clinics.phone,
      permalink: clinics.permalink,
      rating: clinics.rating,
      reviewCount: clinics.reviewCount,
      isFeatured: clinics.isFeatured,
      featuredTier: clinics.featuredTier,
      relevanceScore,
    })
    .from(clinics)
    .where(and(matchesAnyTerm, isPublishedSql))
    .orderBy(desc(relevanceScore), asc(clinics.title))
    .limit(limit)
    .offset(offset);
}

export type SearchClinicResult = Awaited<ReturnType<typeof searchClinicsWithRelevance>>[number];

/**
 * Count total search results for a query.
 * Uses the same WHERE conditions as searchClinicsWithRelevance.
 *
 * @param query - Search string (minimum 2 characters)
 * @returns Total number of matching clinics
 */
export async function countSearchClinics(query: string): Promise<number> {
  if (!query || query.trim().length < 2) {
    return 0;
  }

  const conditions = buildSearchConditions(query);
  if (!conditions) return 0;

  const { matchesAnyTerm } = conditions;

  const result = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(clinics)
    .where(and(matchesAnyTerm, isPublishedSql));

  return result[0]?.count ?? 0;
}

/**
 * Detect if a search query is a US state name or abbreviation.
 * Returns the lowercase state abbreviation if matched, null otherwise.
 *
 * @param query - Search query string
 * @returns Lowercase state abbreviation or null
 */
export function detectStateQuery(query: string): string | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  // Check 2-letter abbreviation (case-insensitive)
  const upper = trimmed.toUpperCase();
  if (upper.length === 2 && upper in US_STATES_REVERSE) {
    return upper.toLowerCase();
  }

  // Check full state name (case-insensitive)
  for (const [name, abbrev] of Object.entries(US_STATES)) {
    if (name.toLowerCase() === trimmed.toLowerCase()) {
      return abbrev.toLowerCase();
    }
  }

  return null;
}
