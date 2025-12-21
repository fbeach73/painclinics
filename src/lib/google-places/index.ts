/**
 * Google Places API integration module
 *
 * This module provides:
 * - GooglePlacesClient: API client for fetching place details and searching
 * - PlacesRateLimiter: Queue-based rate limiting for API calls
 * - Field mapping utilities for converting API responses to clinic schema
 * - TypeScript types for all API interactions
 */

// Client exports
export { GooglePlacesClient, PlacesApiClientError } from "./client";
export type { SearchPlacesOptions } from "./client";

// Rate limiter exports
export {
  PlacesRateLimiter,
  getSharedRateLimiter,
  resetSharedRateLimiter,
  withRateLimit,
} from "./rate-limiter";
export type { RateLimiterOptions } from "./rate-limiter";

// Field mapper exports
export {
  REVIEW_FIELDS,
  HOURS_FIELDS,
  CONTACT_FIELDS,
  LOCATION_FIELDS,
  PHOTO_FIELDS,
  BASE_FIELDS,
  getApiFieldsForSyncType,
  buildApiFieldList,
  getAllApiFields,
  mapPlaceToClinic,
  detectChanges,
} from "./field-mapper";
export type { FieldDiff } from "./field-mapper";

// Type exports
export type {
  // Core types
  LocalizedText,
  LatLng,
  // Opening hours
  OpeningHoursPeriod,
  RegularOpeningHours,
  // Photos
  PlacePhoto,
  AuthorAttribution,
  // Reviews
  PlaceReview,
  // Place details
  PlaceDetails,
  BusinessStatus,
  PriceLevel,
  AddressComponent,
  // Search
  PlaceSearchResult,
  PlaceSearchItem,
  PlacePhotoMedia,
  // Errors
  PlacesApiError,
  // Sync types
  SyncFieldType,
  SyncOptions,
  SyncResult,
  FieldChange,
  BulkSyncResult,
  SyncProgress,
  // Mapped data types
  MappedClinicHour,
  MappedReview,
  MappedClinicData,
} from "./types";
