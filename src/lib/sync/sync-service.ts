/**
 * Sync service for orchestrating Google Places data synchronization
 */

import { getServerEnv } from "@/lib/env";
import {
  GooglePlacesClient,
  PlacesRateLimiter,
  buildApiFieldList,
  mapPlaceToClinic,
  detectChanges,
  type SyncFieldType,
  type SyncResult,
  type BulkSyncResult,
  type SyncProgress,
  type MappedClinicData,
  type MappedReview,
  type MappedClinicHour,
} from "@/lib/google-places";
import { sleep } from "@/lib/utils";
import {
  getClinicForSync,
  updateClinicFromSync,
  getSyncStatus,
  upsertSyncStatus,
  incrementClinicSyncErrors,
  resetClinicSyncErrors,
  getClinicsByIds,
  getClinicIdsWithPlaceId,
  getClinicIdsWithMissingData,
  type ClinicSyncStatusRecord,
} from "./sync-queries";

// ============================================
// Constants
// ============================================

const MAX_CONSECUTIVE_ERRORS = 3;
const ALL_SYNC_FIELDS: SyncFieldType[] = [
  "reviews",
  "hours",
  "contact",
  "location",
];

// ============================================
// Sync Service Types
// ============================================

export interface SyncClinicOptions {
  fields?: SyncFieldType[];
  skipErrorCheck?: boolean;
}

export interface BulkSyncOptions {
  fields?: SyncFieldType[];
  onProgress?: (progress: SyncProgress) => void;
  abortSignal?: AbortSignal;
  skipClinicsWithErrors?: boolean;
  delayBetweenRequests?: number;
}

export interface ScheduleScopeOptions {
  scope: "all" | "selected" | "missing_data" | "by_state";
  clinicIds?: string[];
  stateFilter?: string;
}

// ============================================
// API Client Initialization
// ============================================

let placesClient: GooglePlacesClient | null = null;
let rateLimiter: PlacesRateLimiter | null = null;

/**
 * Get or create the Places API client
 */
function getPlacesClient(): GooglePlacesClient {
  if (!placesClient) {
    const env = getServerEnv();
    const apiKey = env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_PLACES_API_KEY is not configured");
    }
    placesClient = new GooglePlacesClient(apiKey);
  }
  return placesClient;
}

/**
 * Get or create the rate limiter
 */
function getRateLimiter(): PlacesRateLimiter {
  if (!rateLimiter) {
    rateLimiter = new PlacesRateLimiter({
      requestsPerSecond: 10,
      maxConcurrent: 5,
    });
  }
  return rateLimiter;
}

// ============================================
// Single Clinic Sync
// ============================================

/**
 * Sync a single clinic with Google Places data
 */
export async function syncClinic(
  clinicId: string,
  options: SyncClinicOptions = {}
): Promise<SyncResult> {
  const { fields = ALL_SYNC_FIELDS, skipErrorCheck = false } = options;

  // Get clinic data
  const clinic = await getClinicForSync(clinicId);
  if (!clinic) {
    return {
      success: false,
      clinicId,
      placeId: "",
      updatedFields: [],
      changes: [],
      error: "Clinic not found",
      apiCallsUsed: 0,
    };
  }

  if (!clinic.placeId) {
    return {
      success: false,
      clinicId,
      placeId: "",
      updatedFields: [],
      changes: [],
      error: "Clinic has no Place ID",
      apiCallsUsed: 0,
    };
  }

  // Check for excessive errors
  if (!skipErrorCheck) {
    const syncStatus = await getSyncStatus(clinicId);
    if (
      syncStatus?.consecutiveErrors &&
      syncStatus.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS
    ) {
      return {
        success: false,
        clinicId,
        placeId: clinic.placeId,
        updatedFields: [],
        changes: [],
        error: `Clinic has ${syncStatus.consecutiveErrors} consecutive errors - sync skipped`,
        apiCallsUsed: 0,
      };
    }
  }

  try {
    // Build API field list
    const apiFields = buildApiFieldList(fields);

    // Fetch data from Google Places API with rate limiting
    const limiter = getRateLimiter();
    const client = getPlacesClient();

    const placeDetails = await limiter.execute(() =>
      client.getPlaceDetails(clinic.placeId!, apiFields)
    );

    // Map Place data to clinic schema
    const mappedData = mapPlaceToClinic(placeDetails, fields);

    // Detect changes - build currentData carefully to avoid undefined values
    const currentData: Partial<MappedClinicData> = {};
    if (clinic.rating !== null) currentData.rating = clinic.rating;
    if (clinic.reviewCount !== null) currentData.reviewCount = clinic.reviewCount;
    if (clinic.featuredReviews) currentData.featuredReviews = clinic.featuredReviews as MappedReview[];
    if (clinic.phone !== null) currentData.phone = clinic.phone;
    if (clinic.website !== null) currentData.website = clinic.website;
    if (clinic.clinicHours) currentData.clinicHours = clinic.clinicHours as MappedClinicHour[];
    currentData.mapLatitude = clinic.mapLatitude;
    currentData.mapLongitude = clinic.mapLongitude;
    if (clinic.detailedAddress !== null) currentData.detailedAddress = clinic.detailedAddress;
    if (clinic.googleListingLink !== null) currentData.googleListingLink = clinic.googleListingLink;

    const changes = detectChanges(currentData, mappedData);

    // Update clinic if there are changes - only include defined values
    if (changes.length > 0) {
      const updateData: Parameters<typeof updateClinicFromSync>[1] = {};
      if (mappedData.rating !== undefined) updateData.rating = mappedData.rating;
      if (mappedData.reviewCount !== undefined) updateData.reviewCount = mappedData.reviewCount;
      if (mappedData.featuredReviews !== undefined) updateData.featuredReviews = mappedData.featuredReviews;
      if (mappedData.phone !== undefined) updateData.phone = mappedData.phone;
      if (mappedData.website !== undefined) updateData.website = mappedData.website;
      if (mappedData.clinicHours !== undefined) updateData.clinicHours = mappedData.clinicHours;
      if (mappedData.mapLatitude !== undefined) updateData.mapLatitude = mappedData.mapLatitude;
      if (mappedData.mapLongitude !== undefined) updateData.mapLongitude = mappedData.mapLongitude;
      if (mappedData.detailedAddress !== undefined) updateData.detailedAddress = mappedData.detailedAddress;
      if (mappedData.googleListingLink !== undefined) updateData.googleListingLink = mappedData.googleListingLink;

      await updateClinicFromSync(clinicId, updateData);
    }

    // Update sync status
    const syncTimestamps = buildSyncTimestamps(fields);
    await upsertSyncStatus(clinicId, {
      ...syncTimestamps,
      lastFullSync: fields.length === ALL_SYNC_FIELDS.length ? new Date() : undefined,
      consecutiveErrors: 0,
      lastSyncError: null,
    });

    // Reset error count on success
    await resetClinicSyncErrors(clinicId);

    return {
      success: true,
      clinicId,
      placeId: clinic.placeId,
      updatedFields: fields,
      changes: changes.map((c) => ({
        field: c.field,
        oldValue: c.oldValue,
        newValue: c.newValue,
      })),
      apiCallsUsed: 1,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Increment error count
    await incrementClinicSyncErrors(clinicId, errorMessage);

    return {
      success: false,
      clinicId,
      placeId: clinic.placeId,
      updatedFields: [],
      changes: [],
      error: errorMessage,
      apiCallsUsed: 1,
    };
  }
}

/**
 * Build sync timestamp updates based on fields being synced
 */
function buildSyncTimestamps(
  fields: SyncFieldType[]
): Partial<ClinicSyncStatusRecord> {
  const now = new Date();
  const timestamps: Partial<ClinicSyncStatusRecord> = {};

  for (const field of fields) {
    switch (field) {
      case "reviews":
        timestamps.lastReviewSync = now;
        break;
      case "hours":
        timestamps.lastHoursSync = now;
        break;
      case "photos":
        timestamps.lastPhotosSync = now;
        break;
      case "contact":
        timestamps.lastContactSync = now;
        break;
      case "location":
        timestamps.lastLocationSync = now;
        break;
    }
  }

  return timestamps;
}

// ============================================
// Bulk Sync Operations
// ============================================

/**
 * Sync multiple clinics in bulk with progress tracking
 */
export async function syncBulk(
  clinicIds: string[],
  options: BulkSyncOptions = {}
): Promise<BulkSyncResult> {
  const {
    fields = ALL_SYNC_FIELDS,
    onProgress,
    abortSignal,
    skipClinicsWithErrors = true,
    delayBetweenRequests = 100,
  } = options;

  const result: BulkSyncResult = {
    totalProcessed: 0,
    successCount: 0,
    errorCount: 0,
    skippedCount: 0,
    results: [],
    errors: [],
  };

  const total = clinicIds.length;

  // Get clinic info for progress reporting
  const clinicInfo = await getClinicsByIds(clinicIds);
  const clinicMap = new Map(clinicInfo.map((c) => [c.id, c]));

  for (let i = 0; i < clinicIds.length; i++) {
    // Check for abort signal
    if (abortSignal?.aborted) {
      break;
    }

    const clinicId = clinicIds[i]!; // Safe: loop ensures index is valid
    const clinic = clinicMap.get(clinicId);

    // Report progress
    if (onProgress) {
      const progress: SyncProgress = {
        current: i + 1,
        total,
        status: "in_progress",
      };
      progress.currentClinicId = clinicId;
      if (clinic?.title) progress.currentClinicName = clinic.title;
      onProgress(progress);
    }

    // Skip if no Place ID
    if (!clinic?.placeId) {
      result.skippedCount++;
      result.totalProcessed++;
      continue;
    }

    // Check for excessive errors if enabled
    if (skipClinicsWithErrors) {
      const syncStatus = await getSyncStatus(clinicId);
      if (
        syncStatus?.consecutiveErrors &&
        syncStatus.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS
      ) {
        result.skippedCount++;
        result.totalProcessed++;
        continue;
      }
    }

    // Sync the clinic
    const syncResult = await syncClinic(clinicId, {
      fields,
      skipErrorCheck: true, // We already checked above
    });

    result.results.push(syncResult);
    result.totalProcessed++;

    if (syncResult.success) {
      result.successCount++;
    } else {
      result.errorCount++;
      if (syncResult.error) {
        result.errors.push({
          clinicId: clinicId,
          error: syncResult.error,
          timestamp: new Date(),
        });
      }
    }

    // Small delay between requests to be nice to the API
    if (i < clinicIds.length - 1 && delayBetweenRequests > 0) {
      await sleep(delayBetweenRequests);
    }
  }

  // Final progress update
  if (onProgress) {
    onProgress({
      current: total,
      total,
      status: abortSignal?.aborted ? "failed" : "completed",
    });
  }

  return result;
}

/**
 * Get clinic IDs based on schedule scope
 */
export async function getClinicIdsForScope(
  options: ScheduleScopeOptions
): Promise<string[]> {
  const { scope, clinicIds, stateFilter } = options;

  switch (scope) {
    case "selected":
      // Return the explicitly selected clinic IDs
      return clinicIds ?? [];

    case "by_state":
      // Get all clinics with Place ID in the specified state
      if (stateFilter) {
        return getClinicIdsWithPlaceId({ stateFilter });
      }
      return getClinicIdsWithPlaceId();

    case "missing_data":
      // Get clinics that have Place ID but are missing data
      return getClinicIdsWithMissingData();

    case "all":
    default:
      // Get all clinics with Place ID
      return getClinicIdsWithPlaceId();
  }
}

// ============================================
// Field-Specific Sync Functions
// ============================================

/**
 * Sync only review data for a clinic
 */
export async function syncClinicReviews(
  clinicId: string
): Promise<SyncResult> {
  return syncClinic(clinicId, { fields: ["reviews"] });
}

/**
 * Sync only hours data for a clinic
 */
export async function syncClinicHours(
  clinicId: string
): Promise<SyncResult> {
  return syncClinic(clinicId, { fields: ["hours"] });
}

/**
 * Sync only contact data for a clinic
 */
export async function syncClinicContact(
  clinicId: string
): Promise<SyncResult> {
  return syncClinic(clinicId, { fields: ["contact"] });
}

/**
 * Sync only location data for a clinic
 */
export async function syncClinicLocation(
  clinicId: string
): Promise<SyncResult> {
  return syncClinic(clinicId, { fields: ["location"] });
}

// ============================================
// Preview Functions
// ============================================

/**
 * Preview what changes would be made by syncing a clinic
 * (fetches data but doesn't update the database)
 */
export async function previewClinicSync(
  clinicId: string,
  fields: SyncFieldType[] = ALL_SYNC_FIELDS
): Promise<{
  success: boolean;
  changes: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
  error?: string;
}> {
  const clinic = await getClinicForSync(clinicId);
  if (!clinic) {
    return {
      success: false,
      changes: [],
      error: "Clinic not found",
    };
  }

  if (!clinic.placeId) {
    return {
      success: false,
      changes: [],
      error: "Clinic has no Place ID",
    };
  }

  try {
    const apiFields = buildApiFieldList(fields);
    const limiter = getRateLimiter();
    const client = getPlacesClient();

    const placeDetails = await limiter.execute(() =>
      client.getPlaceDetails(clinic.placeId!, apiFields)
    );

    const mappedData = mapPlaceToClinic(placeDetails, fields);

    // Build currentData carefully to avoid undefined values with exactOptionalPropertyTypes
    const currentData: Partial<MappedClinicData> = {};
    if (clinic.rating !== null) currentData.rating = clinic.rating;
    if (clinic.reviewCount !== null) currentData.reviewCount = clinic.reviewCount;
    if (clinic.featuredReviews) currentData.featuredReviews = clinic.featuredReviews as MappedReview[];
    if (clinic.phone !== null) currentData.phone = clinic.phone;
    if (clinic.website !== null) currentData.website = clinic.website;
    if (clinic.clinicHours) currentData.clinicHours = clinic.clinicHours as MappedClinicHour[];
    currentData.mapLatitude = clinic.mapLatitude;
    currentData.mapLongitude = clinic.mapLongitude;
    if (clinic.detailedAddress !== null) currentData.detailedAddress = clinic.detailedAddress;
    if (clinic.googleListingLink !== null) currentData.googleListingLink = clinic.googleListingLink;

    const changes = detectChanges(currentData, mappedData);

    return {
      success: true,
      changes: changes.map((c) => ({
        field: c.field,
        oldValue: c.oldValue,
        newValue: c.newValue,
      })),
    };
  } catch (error) {
    return {
      success: false,
      changes: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Preview data from a Place ID (for lookup before associating with a clinic)
 */
export async function previewPlaceData(
  placeId: string,
  fields: SyncFieldType[] = ALL_SYNC_FIELDS
): Promise<{
  success: boolean;
  data?: MappedClinicData;
  rawData?: unknown;
  error?: string;
}> {
  try {
    const apiFields = buildApiFieldList(fields);
    const limiter = getRateLimiter();
    const client = getPlacesClient();

    const placeDetails = await limiter.execute(() =>
      client.getPlaceDetails(placeId, apiFields)
    );

    const mappedData = mapPlaceToClinic(placeDetails, fields);

    return {
      success: true,
      data: mappedData,
      rawData: placeDetails,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Check if the Places API is configured and available
 */
export function isPlacesApiConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(env.GOOGLE_PLACES_API_KEY);
}

/**
 * Get the current rate limiter statistics
 */
export function getRateLimiterStats(): {
  queueLength: number;
  activeRequests: number;
  isBusy: boolean;
} {
  const limiter = getRateLimiter();
  return {
    queueLength: limiter.queueLength,
    activeRequests: limiter.activeRequests,
    isBusy: limiter.isBusy,
  };
}
