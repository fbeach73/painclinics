/**
 * Directory filter types and URL parsing/serialization utilities.
 * Filters are encoded as query parameters for server-rendered, cacheable pages.
 */

import { services, insuranceProviders } from "@/data/services";
import { NORMALIZED_AMENITIES, getAmenityLabel } from "./amenity-map";

export type SortOption = "featured" | "rating" | "reviews" | "name";

export interface DirectoryFilters {
  specialty: string[];     // service slugs from clinicServices
  rating: number | null;   // minimum rating (3 or 4)
  insurance: string[];     // insurance slugs from clinicInsurance
  amenity: string[];       // normalized amenity slugs
  verified: boolean;
  featured: boolean;
  hasReviews: boolean;
  openNow: boolean;
  sort: SortOption;
  page: number;
}

const VALID_SPECIALTIES = new Set(services.map((s) => s.type));
const VALID_INSURANCE = new Set(insuranceProviders.map((i) => i.type));
const VALID_AMENITIES = new Set(NORMALIZED_AMENITIES.map((a) => a.slug));
const VALID_SORTS: Set<string> = new Set(["featured", "rating", "reviews", "name"]);

/**
 * Parse directory filters from URL search params.
 * All invalid values are silently dropped.
 */
export function parseFilters(
  searchParams: Record<string, string | string[] | undefined>
): DirectoryFilters {
  const getParam = (key: string): string | undefined => {
    const val = searchParams[key];
    if (Array.isArray(val)) return val[0];
    return val;
  };

  const getArrayParam = (key: string): string[] => {
    const val = searchParams[key];
    if (!val) return [];
    const raw = Array.isArray(val) ? val[0] : val;
    if (!raw) return [];
    return raw.split(",").filter(Boolean);
  };

  // Parse specialty filter (validate against known service types)
  const specialty = getArrayParam("specialty").filter((s) =>
    VALID_SPECIALTIES.has(s as never)
  );

  // Parse insurance filter
  const insurance = getArrayParam("insurance").filter((i) =>
    VALID_INSURANCE.has(i as never)
  );

  // Parse amenity filter
  const amenity = getArrayParam("amenity").filter((a) =>
    VALID_AMENITIES.has(a)
  );

  // Parse rating filter (only 3 or 4 are valid)
  const ratingStr = getParam("rating");
  const ratingNum = ratingStr ? parseInt(ratingStr, 10) : null;
  const rating = ratingNum === 3 || ratingNum === 4 ? ratingNum : null;

  // Parse boolean toggles
  const verified = getParam("verified") === "true";
  const featured = getParam("featured") === "true";
  const hasReviews = getParam("has-reviews") === "true";
  const openNow = getParam("open-now") === "true";

  // Parse sort
  const sortStr = getParam("sort");
  const sort: SortOption =
    sortStr && VALID_SORTS.has(sortStr) ? (sortStr as SortOption) : "featured";

  // Parse page
  const pageStr = getParam("page");
  const pageNum = pageStr ? parseInt(pageStr, 10) : 1;
  const page = pageNum > 0 ? pageNum : 1;

  return {
    specialty,
    rating,
    insurance,
    amenity,
    verified,
    featured,
    hasReviews,
    openNow,
    sort,
    page,
  };
}

/**
 * Serialize filters to URL search params string.
 * Only non-default values are included.
 */
export function serializeFilters(filters: DirectoryFilters): string {
  const params = new URLSearchParams();

  if (filters.specialty.length > 0)
    params.set("specialty", filters.specialty.join(","));
  if (filters.rating !== null) params.set("rating", String(filters.rating));
  if (filters.insurance.length > 0)
    params.set("insurance", filters.insurance.join(","));
  if (filters.amenity.length > 0)
    params.set("amenity", filters.amenity.join(","));
  if (filters.verified) params.set("verified", "true");
  if (filters.featured) params.set("featured", "true");
  if (filters.hasReviews) params.set("has-reviews", "true");
  if (filters.openNow) params.set("open-now", "true");
  if (filters.sort !== "featured") params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));

  const str = params.toString();
  return str ? `?${str}` : "";
}

/**
 * Check if any filters are active (non-default values).
 */
export function hasActiveFilters(filters: DirectoryFilters): boolean {
  return (
    filters.specialty.length > 0 ||
    filters.rating !== null ||
    filters.insurance.length > 0 ||
    filters.amenity.length > 0 ||
    filters.verified ||
    filters.featured ||
    filters.hasReviews ||
    filters.openNow
  );
}

/**
 * Count the number of active filters for UI display.
 */
export function countActiveFilters(filters: DirectoryFilters): number {
  let count = 0;
  count += filters.specialty.length;
  if (filters.rating !== null) count++;
  count += filters.insurance.length;
  count += filters.amenity.length;
  if (filters.verified) count++;
  if (filters.featured) count++;
  if (filters.hasReviews) count++;
  if (filters.openNow) count++;
  return count;
}

export interface ActiveFilterPill {
  key: string;
  label: string;
  paramKey: string;
  paramValue: string; // value to remove from the comma-separated list, or "" for boolean
}

/**
 * Generate a list of active filter "pills" with labels for UI display.
 */
export function getActiveFilterPills(
  filters: DirectoryFilters
): ActiveFilterPill[] {
  const pills: ActiveFilterPill[] = [];

  for (const slug of filters.specialty) {
    const svc = services.find((s) => s.type === slug);
    pills.push({
      key: `specialty-${slug}`,
      label: svc?.name ?? slug,
      paramKey: "specialty",
      paramValue: slug,
    });
  }

  if (filters.rating !== null) {
    pills.push({
      key: "rating",
      label: `${filters.rating}+ Stars`,
      paramKey: "rating",
      paramValue: "",
    });
  }

  for (const slug of filters.insurance) {
    const ins = insuranceProviders.find((i) => i.type === slug);
    pills.push({
      key: `insurance-${slug}`,
      label: ins?.name ?? slug,
      paramKey: "insurance",
      paramValue: slug,
    });
  }

  for (const slug of filters.amenity) {
    pills.push({
      key: `amenity-${slug}`,
      label: getAmenityLabel(slug),
      paramKey: "amenity",
      paramValue: slug,
    });
  }

  if (filters.verified) {
    pills.push({
      key: "verified",
      label: "Verified",
      paramKey: "verified",
      paramValue: "",
    });
  }

  if (filters.featured) {
    pills.push({
      key: "featured",
      label: "Featured",
      paramKey: "featured",
      paramValue: "",
    });
  }

  if (filters.hasReviews) {
    pills.push({
      key: "has-reviews",
      label: "Has Reviews",
      paramKey: "has-reviews",
      paramValue: "",
    });
  }

  if (filters.openNow) {
    pills.push({
      key: "open-now",
      label: "Open Now",
      paramKey: "open-now",
      paramValue: "",
    });
  }

  return pills;
}

/**
 * Human-readable description of active filters, used in meta descriptions.
 */
export function describeFilters(filters: DirectoryFilters): string {
  const parts: string[] = [];

  if (filters.specialty.length > 0) {
    const names = filters.specialty.map(
      (slug) => services.find((s) => s.type === slug)?.name ?? slug
    );
    parts.push(names.join(", "));
  }

  if (filters.rating !== null) {
    parts.push(`${filters.rating}+ star rated`);
  }

  if (filters.insurance.length > 0) {
    const names = filters.insurance.map(
      (slug) => insuranceProviders.find((i) => i.type === slug)?.name ?? slug
    );
    parts.push(`accepting ${names.join(", ")}`);
  }

  if (filters.amenity.length > 0) {
    const names = filters.amenity.map(getAmenityLabel);
    parts.push(`with ${names.join(", ")}`);
  }

  if (filters.verified) parts.push("verified");
  if (filters.hasReviews) parts.push("with patient reviews");
  if (filters.openNow) parts.push("open now");

  return parts.join(" · ");
}
