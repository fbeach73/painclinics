import { sql, asc, desc, eq, or, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";

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
    .where(sql`LOWER(${clinics.permalink}) = LOWER(${permalinkPath})`)
    .limit(1);

  return results[0] || null;
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
    .from(clinics);
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
    .where(sql`UPPER(${clinics.stateAbbreviation}) = UPPER(${stateAbbrev})`)
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
    .from(clinics);

  return results
    .filter((r) => r.stateAbbreviation)
    .map((r) => r.stateAbbreviation!);
}

/**
 * Get clinic count by state for summary statistics.
 *
 * @returns Array of { stateAbbreviation, count } objects
 */
export async function getClinicCountsByState() {
  return db
    .select({
      stateAbbreviation: clinics.stateAbbreviation,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(clinics)
    .groupBy(clinics.stateAbbreviation)
    .orderBy(asc(clinics.stateAbbreviation));
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
      .where(
        sql`LOWER(${clinics.city}) = LOWER(${city}) AND UPPER(${clinics.stateAbbreviation}) = UPPER(${stateAbbrev})`
      )
      .orderBy(desc(featuredOrderSql), desc(clinics.rating), asc(clinics.title));
  }

  return db
    .select()
    .from(clinics)
    .where(sql`LOWER(${clinics.city}) = LOWER(${city})`)
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
    .where(sql`UPPER(${clinics.stateAbbreviation}) = UPPER(${stateAbbrev})`)
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
    .from(clinics);
}

/**
 * Fetch a single clinic by its ID.
 *
 * @param id - The clinic ID
 * @returns The clinic record or null if not found
 */
export async function getClinicById(id: string) {
  const results = await db
    .select()
    .from(clinics)
    .where(eq(clinics.id, id))
    .limit(1);

  return results[0] || null;
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
      isFeatured: clinics.isFeatured,
      featuredTier: clinics.featuredTier,
    })
    .from(clinics)
    .orderBy(desc(featuredOrderSql), asc(clinics.stateAbbreviation), asc(clinics.city), asc(clinics.title))
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
    .where(
      sql`${clinics.mapLatitude} IS NOT NULL AND ${clinics.mapLongitude} IS NOT NULL AND ${distanceSql} <= ${radiusMiles}`
    )
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
    .where(
      or(
        ilike(clinics.title, searchPattern),
        ilike(clinics.city, searchPattern),
        ilike(clinics.stateAbbreviation, searchPattern)
      )
    )
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
  const whereConditions: ReturnType<typeof sql>[] = [isFeaturedActiveSql];

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
  // Parse legacy format: extract name, state (2 chars) and zipcode (5 digits) from end
  // Format: {name-slug}-{state}-{zipcode}
  const match = legacySlug.match(/^(.+)-([a-z]{2})-(\d{5})$/i);
  if (!match) {
    return null;
  }

  const [, nameSlug, stateAbbrev, zipCode] = match;

  // Convert slug to title format for matching (e.g., "open-arms-pain-clinic" -> "Open Arms Pain Clinic")
  const titleFromSlug = nameSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Look up by state, postal code, and title match
  const results = await db
    .select()
    .from(clinics)
    .where(
      sql`UPPER(${clinics.stateAbbreviation}) = UPPER(${stateAbbrev})
          AND ${clinics.postalCode} = ${zipCode}
          AND LOWER(${clinics.title}) = LOWER(${titleFromSlug})`
    )
    .limit(1);

  return results[0] || null;
}
