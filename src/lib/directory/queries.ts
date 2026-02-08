/**
 * Filtered directory query engine.
 * Single dynamic query with filter composition via Drizzle ORM.
 */

import { sql, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinics,
  clinicServices,
  services,
  clinicInsurance,
  insuranceProviders,
} from "@/lib/schema";
import type { DirectoryFilters, SortOption } from "./filters";

const ITEMS_PER_PAGE = 20;

/** SQL fragment: only published clinics */
const isPublishedSql = eq(clinics.status, "published");

/** SQL fragment: featured ordering (premium > basic > none) */
const featuredOrderSql = sql`
  CASE
    WHEN ${clinics.featuredTier} = 'premium' AND ${clinics.isFeatured} = true AND (${clinics.featuredUntil} IS NULL OR ${clinics.featuredUntil} > NOW()) THEN 3
    WHEN ${clinics.featuredTier} = 'basic' AND ${clinics.isFeatured} = true AND (${clinics.featuredUntil} IS NULL OR ${clinics.featuredUntil} > NOW()) THEN 2
    WHEN ${clinics.isFeatured} = true AND (${clinics.featuredUntil} IS NULL OR ${clinics.featuredUntil} > NOW()) THEN 1
    ELSE 0
  END
`;

export interface ClinicListItem {
  id: string;
  title: string;
  permalink: string;
  streetAddress: string | null;
  city: string;
  stateAbbreviation: string | null;
  postalCode: string;
  phone: string | null;
  rating: number | null;
  reviewCount: number | null;
  isFeatured: boolean;
  featuredTier: string | null;
  isVerified: boolean;
  clinicHours: unknown;
  timezone: string | null;
  amenities: string[] | null;
  normalizedAmenities: string[] | null;
  imageFeatured: string | null;
  imageUrl: string | null;
  // Joined data
  serviceNames: string | null;
  serviceSlugs: string | null;
}

export interface DirectoryStats {
  totalCount: number;
  filteredCount: number;
  avgRating: number | null;
  verifiedCount: number;
  topSpecialties: Array<{ name: string; slug: string; count: number }>;
}

export interface FilteredClinicsResult {
  clinics: ClinicListItem[];
  stats: DirectoryStats;
  totalPages: number;
  currentPage: number;
}

/** Build ORDER BY clause based on sort option */
function buildOrderBy(sort: SortOption) {
  switch (sort) {
    case "rating":
      return sql`${clinics.rating} DESC NULLS LAST, ${clinics.reviewCount} DESC NULLS LAST`;
    case "reviews":
      return sql`${clinics.reviewCount} DESC NULLS LAST, ${clinics.rating} DESC NULLS LAST`;
    case "name":
      return sql`${clinics.title} ASC`;
    case "featured":
    default:
      return sql`${featuredOrderSql} DESC, ${clinics.rating} DESC NULLS LAST`;
  }
}

/**
 * Get filtered clinics for a city or state directory page.
 *
 * @param scope - Geographic scope: { stateAbbrev } or { stateAbbrev, city }
 * @param filters - Active directory filters from URL params
 * @returns Paginated clinics list with aggregate stats
 */
export async function getFilteredClinics(
  scope: { stateAbbrev: string; city?: string },
  filters: DirectoryFilters
): Promise<FilteredClinicsResult> {
  const { stateAbbrev, city } = scope;

  // ── Base WHERE conditions ──────────────────────────────────
  const whereConditions: ReturnType<typeof sql>[] = [
    isPublishedSql,
    sql`UPPER(${clinics.stateAbbreviation}) = UPPER(${stateAbbrev})`,
  ];

  if (city) {
    whereConditions.push(sql`LOWER(${clinics.city}) = LOWER(${city})`);
  }

  // ── Filter conditions ──────────────────────────────────────

  // Specialty filter: EXISTS subquery against clinicServices junction
  if (filters.specialty.length > 0) {
    const slugList = filters.specialty.map((s) => `'${s}'`).join(",");
    whereConditions.push(sql`EXISTS (
      SELECT 1 FROM ${clinicServices}
      JOIN ${services} ON ${services.id} = ${clinicServices.serviceId}
      WHERE ${clinicServices.clinicId} = ${clinics.id}
      AND ${services.slug} IN (${sql.raw(slugList)})
    )`);
  }

  // Rating filter
  if (filters.rating !== null) {
    whereConditions.push(
      sql`${clinics.rating} >= ${filters.rating}`
    );
  }

  // Insurance filter: EXISTS subquery against clinicInsurance junction
  if (filters.insurance.length > 0) {
    const slugList = filters.insurance.map((s) => `'${s}'`).join(",");
    whereConditions.push(sql`EXISTS (
      SELECT 1 FROM ${clinicInsurance}
      JOIN ${insuranceProviders} ON ${insuranceProviders.id} = ${clinicInsurance.insuranceId}
      WHERE ${clinicInsurance.clinicId} = ${clinics.id}
      AND ${insuranceProviders.slug} IN (${sql.raw(slugList)})
    )`);
  }

  // Amenity filter: array overlap on normalizedAmenities
  if (filters.amenity.length > 0) {
    const amenityArray = `ARRAY[${filters.amenity.map((a) => `'${a}'`).join(",")}]::text[]`;
    whereConditions.push(
      sql`${clinics.normalizedAmenities} && ${sql.raw(amenityArray)}`
    );
  }

  // Boolean toggles
  if (filters.verified) {
    whereConditions.push(sql`${clinics.isVerified} = true`);
  }

  if (filters.featured) {
    whereConditions.push(
      sql`${clinics.isFeatured} = true AND (${clinics.featuredUntil} IS NULL OR ${clinics.featuredUntil} > NOW())`
    );
  }

  if (filters.hasReviews) {
    whereConditions.push(sql`${clinics.reviewCount} > 0`);
  }

  // Note: openNow filter is computed client-side since it depends on current time + timezone.
  // Server-side we'd need clinic_hours parsing which is complex. We include all clinics
  // and let the client component handle filtering for open-now display.

  // ── Combined WHERE ────────────────────────────────────────
  const combinedWhere = sql.join(whereConditions, sql` AND `);

  // ── Stats query (total across all pages) ──────────────────
  const statsQuery = db
    .select({
      totalCount: sql<number>`COUNT(*)::int`,
      avgRating: sql<number>`ROUND(AVG(${clinics.rating})::numeric, 1)::float`,
      verifiedCount: sql<number>`COUNT(*) FILTER (WHERE ${clinics.isVerified} = true)::int`,
    })
    .from(clinics)
    .where(combinedWhere);

  // ── Count total (unfiltered) for stats bar ────────────────
  const baseWhereConditions: ReturnType<typeof sql>[] = [
    isPublishedSql,
    sql`UPPER(${clinics.stateAbbreviation}) = UPPER(${stateAbbrev})`,
  ];
  if (city) {
    baseWhereConditions.push(sql`LOWER(${clinics.city}) = LOWER(${city})`);
  }
  const baseWhere = sql.join(baseWhereConditions, sql` AND `);

  const totalCountQuery = db
    .select({ totalCount: sql<number>`COUNT(*)::int` })
    .from(clinics)
    .where(baseWhere);

  // ── Top specialties query ─────────────────────────────────
  const topSpecialtiesQuery = db
    .select({
      name: services.name,
      slug: services.slug,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(clinicServices)
    .innerJoin(services, eq(services.id, clinicServices.serviceId))
    .innerJoin(clinics, eq(clinics.id, clinicServices.clinicId))
    .where(baseWhere)
    .groupBy(services.name, services.slug)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(6);

  // ── Main clinics query with pagination ────────────────────
  const offset = (filters.page - 1) * ITEMS_PER_PAGE;
  const orderBy = buildOrderBy(filters.sort);

  // Subquery to get comma-separated service names and slugs for each clinic
  const clinicsQuery = db
    .select({
      id: clinics.id,
      title: clinics.title,
      permalink: clinics.permalink,
      streetAddress: clinics.streetAddress,
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
      postalCode: clinics.postalCode,
      phone: clinics.phone,
      rating: clinics.rating,
      reviewCount: clinics.reviewCount,
      isFeatured: clinics.isFeatured,
      featuredTier: clinics.featuredTier,
      isVerified: clinics.isVerified,
      clinicHours: clinics.clinicHours,
      timezone: clinics.timezone,
      amenities: clinics.amenities,
      normalizedAmenities: clinics.normalizedAmenities,
      imageFeatured: clinics.imageFeatured,
      imageUrl: clinics.imageUrl,
      serviceNames: sql<string>`(
        SELECT string_agg(s.name, ', ' ORDER BY s.name)
        FROM ${clinicServices} cs
        JOIN ${services} s ON s.id = cs.service_id
        WHERE cs.clinic_id = ${sql.raw('"clinics"."id"')}
      )`,
      serviceSlugs: sql<string>`(
        SELECT string_agg(s.slug, ',' ORDER BY s.name)
        FROM ${clinicServices} cs
        JOIN ${services} s ON s.id = cs.service_id
        WHERE cs.clinic_id = ${sql.raw('"clinics"."id"')}
      )`,
    })
    .from(clinics)
    .where(combinedWhere)
    .orderBy(orderBy)
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  // ── Execute all queries in parallel ───────────────────────
  const [statsResult, totalResult, topSpecialties, clinicResults] =
    await Promise.all([
      statsQuery,
      totalCountQuery,
      topSpecialtiesQuery,
      clinicsQuery,
    ]);

  const filteredCount = statsResult[0]?.totalCount ?? 0;
  const totalCount = totalResult[0]?.totalCount ?? 0;

  return {
    clinics: clinicResults,
    stats: {
      totalCount,
      filteredCount,
      avgRating: statsResult[0]?.avgRating ?? null,
      verifiedCount: statsResult[0]?.verifiedCount ?? 0,
      topSpecialties,
    },
    totalPages: Math.ceil(filteredCount / ITEMS_PER_PAGE),
    currentPage: filters.page,
  };
}

/**
 * Get nearby cities with clinic counts for a given city + state.
 * Used in the "Browse Nearby Cities" section.
 */
export async function getNearbyCities(
  stateAbbrev: string,
  currentCity?: string,
  limit = 12
): Promise<Array<{ city: string; count: number; slug: string }>> {
  const whereConditions: ReturnType<typeof sql>[] = [
    isPublishedSql,
    sql`UPPER(${clinics.stateAbbreviation}) = UPPER(${stateAbbrev})`,
  ];

  if (currentCity) {
    whereConditions.push(sql`LOWER(${clinics.city}) != LOWER(${currentCity})`);
  }

  const result = await db
    .select({
      city: clinics.city,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(clinics)
    .where(sql.join(whereConditions, sql` AND `))
    .groupBy(clinics.city)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(limit);

  return result.map((r) => ({
    city: r.city,
    count: r.count,
    slug: r.city.toLowerCase().replace(/\s+/g, "-"),
  }));
}

/**
 * Get service counts for a given scope (state or city).
 * Used in the "Browse by Specialty" section.
 */
export async function getServiceCounts(
  stateAbbrev: string,
  city?: string
): Promise<Array<{ name: string; slug: string; count: number }>> {
  const whereConditions: ReturnType<typeof sql>[] = [
    isPublishedSql,
    sql`UPPER(${clinics.stateAbbreviation}) = UPPER(${stateAbbrev})`,
  ];

  if (city) {
    whereConditions.push(sql`LOWER(${clinics.city}) = LOWER(${city})`);
  }

  return db
    .select({
      name: services.name,
      slug: services.slug,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(clinicServices)
    .innerJoin(services, eq(services.id, clinicServices.serviceId))
    .innerJoin(clinics, eq(clinics.id, clinicServices.clinicId))
    .where(sql.join(whereConditions, sql` AND `))
    .groupBy(services.name, services.slug)
    .orderBy(sql`COUNT(*) DESC`);
}

/**
 * Get insurance counts for a given scope.
 * Used in the "Browse by Insurance" section.
 */
export async function getInsuranceCounts(
  stateAbbrev: string,
  city?: string
): Promise<Array<{ name: string; slug: string; count: number }>> {
  const whereConditions: ReturnType<typeof sql>[] = [
    isPublishedSql,
    sql`UPPER(${clinics.stateAbbreviation}) = UPPER(${stateAbbrev})`,
  ];

  if (city) {
    whereConditions.push(sql`LOWER(${clinics.city}) = LOWER(${city})`);
  }

  return db
    .select({
      name: insuranceProviders.name,
      slug: insuranceProviders.slug,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(clinicInsurance)
    .innerJoin(
      insuranceProviders,
      eq(insuranceProviders.id, clinicInsurance.insuranceId)
    )
    .innerJoin(clinics, eq(clinics.id, clinicInsurance.clinicId))
    .where(sql.join(whereConditions, sql` AND `))
    .groupBy(insuranceProviders.name, insuranceProviders.slug)
    .orderBy(sql`COUNT(*) DESC`);
}
