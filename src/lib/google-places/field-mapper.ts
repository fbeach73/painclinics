/**
 * Field mapping utilities for Google Places API to clinic schema
 */

import type {
  PlaceDetails,
  PlaceReview,
  SyncFieldType,
  MappedClinicData,
  MappedClinicHour,
  MappedReview,
} from "./types";

// ============================================
// Field Mapping Constants
// ============================================

/**
 * Google Places API field names for review-related data
 */
export const REVIEW_FIELDS = [
  "rating",
  "userRatingCount",
  "reviews",
] as const;

/**
 * Google Places API field names for hours-related data
 */
export const HOURS_FIELDS = [
  "regularOpeningHours",
] as const;

/**
 * Google Places API field names for contact-related data
 */
export const CONTACT_FIELDS = [
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "websiteUri",
] as const;

/**
 * Google Places API field names for location-related data
 */
export const LOCATION_FIELDS = [
  "formattedAddress",
  "location",
  "googleMapsUri",
] as const;

/**
 * Google Places API field names for photo-related data
 */
export const PHOTO_FIELDS = [
  "photos",
] as const;

/**
 * Base fields always included in requests
 */
export const BASE_FIELDS = [
  "id",
  "displayName",
] as const;

// ============================================
// Field Selection Helpers
// ============================================

/**
 * Get the Places API fields needed for a given sync field type
 */
export function getApiFieldsForSyncType(syncType: SyncFieldType): readonly string[] {
  switch (syncType) {
    case "reviews":
      return REVIEW_FIELDS;
    case "hours":
      return HOURS_FIELDS;
    case "contact":
      return CONTACT_FIELDS;
    case "location":
      return LOCATION_FIELDS;
    case "photos":
      return PHOTO_FIELDS;
    default:
      return [];
  }
}

/**
 * Build the full list of API fields for a set of sync types
 */
export function buildApiFieldList(syncTypes: SyncFieldType[]): string[] {
  const fields = new Set<string>([...BASE_FIELDS]);

  for (const syncType of syncTypes) {
    for (const field of getApiFieldsForSyncType(syncType)) {
      fields.add(field);
    }
  }

  return Array.from(fields);
}

/**
 * Get all API fields for a full sync
 */
export function getAllApiFields(): string[] {
  return buildApiFieldList(["reviews", "hours", "contact", "location", "photos"]);
}

// ============================================
// Data Mapping Functions
// ============================================

/**
 * Day names for mapping opening hours
 */
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * Map a Google Places API response to clinic schema fields
 * @param place - The Places API response
 * @param syncTypes - Optional array of specific field types to map
 * @returns Partial clinic data object
 */
export function mapPlaceToClinic(
  place: PlaceDetails,
  syncTypes?: SyncFieldType[]
): MappedClinicData {
  const result: MappedClinicData = {};
  const typesToMap = syncTypes || (["reviews", "hours", "contact", "location"] as SyncFieldType[]);

  for (const syncType of typesToMap) {
    switch (syncType) {
      case "reviews":
        mapReviewFields(place, result);
        break;
      case "hours":
        mapHoursFields(place, result);
        break;
      case "contact":
        mapContactFields(place, result);
        break;
      case "location":
        mapLocationFields(place, result);
        break;
      // Photos are handled separately due to additional API calls needed
    }
  }

  return result;
}

/**
 * Map review-related fields
 */
function mapReviewFields(place: PlaceDetails, result: MappedClinicData): void {
  if (place.rating !== undefined) {
    result.rating = place.rating;
  }

  if (place.userRatingCount !== undefined) {
    result.reviewCount = place.userRatingCount;
  }

  if (place.reviews && place.reviews.length > 0) {
    // Take up to 5 most recent reviews
    result.featuredReviews = place.reviews.slice(0, 5).map(mapReview);
  }
}

/**
 * Map a single review to our schema format
 */
function mapReview(review: PlaceReview): MappedReview {
  return {
    username: review.authorAttribution.displayName,
    url: review.authorAttribution.uri || "",
    review: review.text?.text || "",
    date: review.publishTime,
    rating: review.rating,
  };
}

/**
 * Map hours-related fields
 */
function mapHoursFields(place: PlaceDetails, result: MappedClinicData): void {
  if (place.regularOpeningHours?.weekdayDescriptions) {
    result.clinicHours = mapOpeningHours(
      place.regularOpeningHours.weekdayDescriptions
    );
  }
}

/**
 * Map opening hours descriptions to our schema format
 * Google returns weekdayDescriptions as an array of 7 strings starting with Sunday
 */
function mapOpeningHours(weekdayDescriptions: string[]): MappedClinicHour[] {
  return weekdayDescriptions.map((description, index): MappedClinicHour => {
    // Description format: "Monday: 9:00 AM – 5:00 PM" or "Monday: Closed"
    const colonIndex = description.indexOf(":");

    let day: string;
    let hours: string;

    if (colonIndex > -1) {
      day = description.slice(0, colonIndex);
      hours = description.slice(colonIndex + 1).trim();
    } else {
      // Fall back to DAY_NAMES or a default
      day = DAY_NAMES[index % 7] ?? `Day ${index + 1}`;
      hours = description;
    }

    return { day, hours };
  });
}

/**
 * Map contact-related fields
 */
function mapContactFields(place: PlaceDetails, result: MappedClinicData): void {
  // Prefer national phone number format
  if (place.nationalPhoneNumber) {
    result.phone = place.nationalPhoneNumber;
  } else if (place.internationalPhoneNumber) {
    result.phone = place.internationalPhoneNumber;
  }

  if (place.websiteUri) {
    result.website = place.websiteUri;
  }
}

/**
 * Map location-related fields
 */
function mapLocationFields(place: PlaceDetails, result: MappedClinicData): void {
  if (place.location) {
    result.mapLatitude = place.location.latitude;
    result.mapLongitude = place.location.longitude;
  }

  if (place.formattedAddress) {
    result.detailedAddress = place.formattedAddress;
  }

  if (place.googleMapsUri) {
    result.googleListingLink = place.googleMapsUri;
  }
}

// ============================================
// Change Detection
// ============================================

export interface FieldDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Compare current clinic data with new data from Places API
 * @param current - Current clinic record fields
 * @param incoming - New data from Places API
 * @returns Array of changed fields
 */
export function detectChanges(
  current: Partial<MappedClinicData>,
  incoming: MappedClinicData
): FieldDiff[] {
  const changes: FieldDiff[] = [];

  const fieldsToCompare: (keyof MappedClinicData)[] = [
    "rating",
    "reviewCount",
    "phone",
    "website",
    "mapLatitude",
    "mapLongitude",
    "detailedAddress",
    "googleListingLink",
  ];

  for (const field of fieldsToCompare) {
    const oldValue = current[field];
    const newValue = incoming[field];

    if (newValue !== undefined && !isEqual(oldValue, newValue)) {
      changes.push({
        field,
        oldValue,
        newValue,
      });
    }
  }

  // Handle complex fields (featuredReviews, clinicHours) with JSON comparison
  if (incoming.featuredReviews !== undefined) {
    const oldReviews = JSON.stringify(current.featuredReviews || []);
    const newReviews = JSON.stringify(incoming.featuredReviews);
    if (oldReviews !== newReviews) {
      changes.push({
        field: "featuredReviews",
        oldValue: current.featuredReviews,
        newValue: incoming.featuredReviews,
      });
    }
  }

  if (incoming.clinicHours !== undefined) {
    const oldHours = JSON.stringify(current.clinicHours || []);
    const newHours = JSON.stringify(incoming.clinicHours);
    if (oldHours !== newHours) {
      changes.push({
        field: "clinicHours",
        oldValue: current.clinicHours,
        newValue: incoming.clinicHours,
      });
    }
  }

  return changes;
}

/**
 * Simple equality check for primitive values
 */
function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;

  // Handle number comparisons with small tolerance for floats
  if (typeof a === "number" && typeof b === "number") {
    return Math.abs(a - b) < 0.0001;
  }

  return false;
}
