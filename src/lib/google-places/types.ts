/**
 * TypeScript interfaces for Google Places API (New) responses
 * @see https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places
 */

// ============================================
// Core Types
// ============================================

export interface LocalizedText {
  text: string;
  languageCode: string;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

// ============================================
// Opening Hours Types
// ============================================

export interface OpeningHoursPeriod {
  open: {
    day: number; // 0 = Sunday, 6 = Saturday
    hour: number;
    minute: number;
  };
  close?: {
    day: number;
    hour: number;
    minute: number;
  };
}

export interface RegularOpeningHours {
  openNow?: boolean;
  periods: OpeningHoursPeriod[];
  weekdayDescriptions: string[];
}

// ============================================
// Photo Types
// ============================================

export interface PlacePhoto {
  name: string;
  widthPx: number;
  heightPx: number;
  authorAttributions: AuthorAttribution[];
}

export interface AuthorAttribution {
  displayName: string;
  uri: string;
  photoUri?: string;
}

// ============================================
// Review Types
// ============================================

export interface PlaceReview {
  name: string;
  relativePublishTimeDescription: string;
  rating: number;
  text: LocalizedText;
  originalText?: LocalizedText;
  authorAttribution: AuthorAttribution;
  publishTime: string; // ISO 8601 timestamp
}

// ============================================
// Place Details Response
// ============================================

export interface PlaceDetails {
  id: string;
  displayName: LocalizedText;
  formattedAddress: string;
  shortFormattedAddress?: string;
  location: LatLng;
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: RegularOpeningHours;
  photos?: PlacePhoto[];
  reviews?: PlaceReview[];
  googleMapsUri?: string;
  businessStatus?: BusinessStatus;
  priceLevel?: PriceLevel;
  types?: string[];
  primaryType?: string;
  primaryTypeDisplayName?: LocalizedText;
  editorialSummary?: LocalizedText;
  addressComponents?: AddressComponent[];
}

export type BusinessStatus =
  | "OPERATIONAL"
  | "CLOSED_TEMPORARILY"
  | "CLOSED_PERMANENTLY";

export type PriceLevel =
  | "PRICE_LEVEL_UNSPECIFIED"
  | "PRICE_LEVEL_FREE"
  | "PRICE_LEVEL_INEXPENSIVE"
  | "PRICE_LEVEL_MODERATE"
  | "PRICE_LEVEL_EXPENSIVE"
  | "PRICE_LEVEL_VERY_EXPENSIVE";

export interface AddressComponent {
  longText: string;
  shortText: string;
  types: string[];
  languageCode: string;
}

// ============================================
// Search Response Types
// ============================================

export interface PlaceSearchResult {
  places: PlaceSearchItem[];
}

export interface PlaceSearchItem {
  id: string;
  displayName: LocalizedText;
  formattedAddress: string;
  location?: LatLng;
}

// ============================================
// Photo Media Response
// ============================================

export interface PlacePhotoMedia {
  name: string;
  photoUri: string;
}

// ============================================
// API Error Types
// ============================================

export interface PlacesApiError {
  error: {
    code: number;
    message: string;
    status: string;
    details?: Array<{
      "@type": string;
      reason?: string;
      domain?: string;
      metadata?: Record<string, string>;
    }>;
  };
}

// ============================================
// Sync-Related Types
// ============================================

export type SyncFieldType =
  | "reviews"
  | "hours"
  | "photos"
  | "contact"
  | "location";

export interface SyncOptions {
  fields?: SyncFieldType[];
}

export interface SyncResult {
  success: boolean;
  clinicId: string;
  placeId: string;
  updatedFields: SyncFieldType[];
  changes: FieldChange[];
  error?: string;
  apiCallsUsed: number;
}

export interface FieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface BulkSyncResult {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  results: SyncResult[];
  errors: Array<{
    clinicId: string;
    error: string;
    timestamp: Date;
  }>;
}

export interface SyncProgress {
  current: number;
  total: number;
  currentClinicId?: string;
  currentClinicName?: string;
  status: "pending" | "in_progress" | "completed" | "failed";
}

// ============================================
// Mapped Clinic Data Types
// ============================================

export interface MappedClinicHour {
  day: string;
  hours: string;
}

export interface MappedReview {
  username: string;
  url: string;
  review: string;
  date: string;
  rating: number;
}

export interface MappedClinicData {
  rating?: number;
  reviewCount?: number;
  featuredReviews?: MappedReview[];
  phone?: string;
  website?: string;
  clinicHours?: MappedClinicHour[];
  mapLatitude?: number;
  mapLongitude?: number;
  detailedAddress?: string;
  googleListingLink?: string;
}
