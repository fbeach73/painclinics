import { sql, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";

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
 * Fetch all clinics in a specific state, ordered by city and title.
 * Handles case-insensitive state abbreviation lookup.
 *
 * @param stateAbbrev - Two-letter state abbreviation (e.g., "AL", "CA")
 * @returns Array of clinic records
 */
export async function getClinicsByState(stateAbbrev: string) {
  return db
    .select()
    .from(clinics)
    .where(sql`UPPER(${clinics.stateAbbreviation}) = UPPER(${stateAbbrev})`)
    .orderBy(asc(clinics.city), asc(clinics.title));
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
      .orderBy(asc(clinics.title));
  }

  return db
    .select()
    .from(clinics)
    .where(sql`LOWER(${clinics.city}) = LOWER(${city})`)
    .orderBy(asc(clinics.title));
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

// Type export for the clinic record
export type ClinicRecord = typeof clinics.$inferSelect;
