/**
 * Dynamic metadata generation for filtered directory pages.
 * Each filter combination gets a unique title + description for SEO.
 */

import type { Metadata } from "next";
import type { DirectoryFilters } from "./filters";
import { hasActiveFilters, describeFilters } from "./filters";

interface MetaScope {
  cityName?: string;
  stateName: string;
  stateAbbrev: string;
  clinicCount: number;
  filteredCount: number;
}

/**
 * Generate filter-aware metadata for city/state directory pages.
 * Unfiltered pages get standard titles; filtered pages get descriptive titles.
 */
export function generateFilteredMeta(
  scope: MetaScope,
  filters: DirectoryFilters
): Metadata {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com";

  const locationName = scope.cityName
    ? `${scope.cityName}, ${scope.stateAbbrev}`
    : scope.stateName;

  const basePath = scope.cityName
    ? `/pain-management/${scope.stateAbbrev.toLowerCase()}/${scope.cityName.toLowerCase().replace(/\s+/g, "-")}/`
    : `/pain-management/${scope.stateAbbrev.toLowerCase()}/`;

  const canonicalUrl = `${baseUrl}${basePath}`;
  const isFiltered = hasActiveFilters(filters);
  const filterDescription = isFiltered ? describeFilters(filters) : "";

  // Build title
  let title: string;
  if (isFiltered) {
    const countStr = `${scope.filteredCount} of ${scope.clinicCount}`;
    title = filterDescription
      ? `${filterDescription} Pain Clinics in ${locationName} (${countStr})`
      : `Pain Management Clinics in ${locationName} (${countStr})`;
    // Truncate if too long
    if (title.length > 70) {
      title = `${scope.filteredCount} Pain Clinics in ${locationName} | Filtered Results`;
    }
  } else {
    title = `Pain Management Clinics in ${locationName} | ${scope.clinicCount} Verified Clinics`;
  }

  // Build description
  let description: string;
  if (isFiltered && filterDescription) {
    description = `Browse ${scope.filteredCount} ${filterDescription} pain management clinics in ${locationName}. Compare ratings, read reviews, and find the right clinic for your needs.`;
  } else {
    description = scope.cityName
      ? `Find top-rated pain management clinics in ${scope.cityName}, ${scope.stateName}. Browse ${scope.clinicCount} verified clinic${scope.clinicCount !== 1 ? "s" : ""}, read patient reviews, and schedule appointments.`
      : `Find top-rated pain management clinics in ${scope.stateName}. Browse ${scope.clinicCount} verified clinics, read patient reviews, and schedule appointments for pain relief.`;
  }

  // Compute geo centroid (we don't have it here, but leave the structure)
  const geoRegion = `US-${scope.stateAbbrev}`;
  const geoPlacename = scope.cityName
    ? `${scope.cityName}, ${scope.stateAbbrev}`
    : scope.stateName;

  return {
    title,
    description,
    alternates: {
      // Canonical always points to unfiltered base URL
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "PainClinics.com",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: {
      // Index filtered pages for SEO, but canonical handles dedup
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large" as const,
        "max-snippet": -1,
      },
    },
    other: {
      "geo.region": geoRegion,
      "geo.placename": geoPlacename,
    },
  };
}
