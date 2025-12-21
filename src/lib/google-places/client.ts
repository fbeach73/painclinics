/**
 * Google Places API (New) Client
 * @see https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places
 */

import type {
  PlaceDetails,
  PlaceSearchResult,
  PlacePhotoMedia,
  PlacesApiError,
} from "./types";

const PLACES_API_BASE = "https://places.googleapis.com/v1";

export class GooglePlacesClient {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Google Places API key is required");
    }
    this.apiKey = apiKey;
  }

  /**
   * Fetch place details by Place ID
   * @param placeId - The Google Place ID (e.g., "ChIJN1t_tDeuEmsRUsoyG83frY4")
   * @param fields - Array of field names to retrieve
   * @returns Place details object
   */
  async getPlaceDetails(
    placeId: string,
    fields: string[]
  ): Promise<PlaceDetails> {
    const fieldMask = fields.join(",");

    const response = await fetch(
      `${PLACES_API_BASE}/places/${placeId}`,
      {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": fieldMask,
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({})) as PlacesApiError;
      const errorMessage = errorBody.error?.message || response.statusText;
      throw new PlacesApiClientError(
        `Places API error: ${errorMessage}`,
        response.status,
        errorBody
      );
    }

    return response.json() as Promise<PlaceDetails>;
  }

  /**
   * Search for places using text query
   * @param query - Search query (e.g., "pain clinic in Chicago, IL")
   * @param options - Optional search parameters
   * @returns Array of matching places
   */
  async searchPlaces(
    query: string,
    options: SearchPlacesOptions = {}
  ): Promise<PlaceSearchResult> {
    const { maxResultCount = 10, includedType, locationBias } = options;

    const body: Record<string, unknown> = {
      textQuery: query,
      maxResultCount,
    };

    if (includedType) {
      body.includedType = includedType;
    }

    if (locationBias) {
      body.locationBias = {
        circle: {
          center: {
            latitude: locationBias.latitude,
            longitude: locationBias.longitude,
          },
          radius: locationBias.radiusMeters || 50000,
        },
      };
    }

    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.location",
    ].join(",");

    const response = await fetch(`${PLACES_API_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": fieldMask,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({})) as PlacesApiError;
      const errorMessage = errorBody.error?.message || response.statusText;
      throw new PlacesApiClientError(
        `Places API search error: ${errorMessage}`,
        response.status,
        errorBody
      );
    }

    const result = await response.json() as PlaceSearchResult;

    // Ensure places array exists even if empty
    return {
      places: result.places || [],
    };
  }

  /**
   * Get photo URL for a place photo reference
   * @param photoName - The photo resource name from PlaceDetails
   * @param maxWidthPx - Maximum width in pixels (1-4800)
   * @param maxHeightPx - Maximum height in pixels (1-4800)
   * @returns Photo media object with URI
   */
  async getPhotoUri(
    photoName: string,
    maxWidthPx: number = 400,
    maxHeightPx?: number
  ): Promise<PlacePhotoMedia> {
    const params = new URLSearchParams();
    params.set("maxWidthPx", String(Math.min(maxWidthPx, 4800)));
    if (maxHeightPx) {
      params.set("maxHeightPx", String(Math.min(maxHeightPx, 4800)));
    }
    params.set("key", this.apiKey);

    const response = await fetch(
      `${PLACES_API_BASE}/${photoName}/media?${params.toString()}`,
      {
        method: "GET",
        redirect: "follow",
      }
    );

    if (!response.ok) {
      throw new PlacesApiClientError(
        `Places API photo error: ${response.statusText}`,
        response.status
      );
    }

    return {
      name: photoName,
      photoUri: response.url,
    };
  }

  /**
   * Build the photo URL directly (without making an API call)
   * This uses the simple URL format that redirects to the actual image
   * @param photoName - The photo resource name
   * @param maxWidthPx - Maximum width in pixels
   * @returns URL string for the photo
   */
  buildPhotoUrl(photoName: string, maxWidthPx: number = 400): string {
    const params = new URLSearchParams();
    params.set("maxWidthPx", String(Math.min(maxWidthPx, 4800)));
    params.set("key", this.apiKey);

    return `${PLACES_API_BASE}/${photoName}/media?${params.toString()}`;
  }
}

// ============================================
// Search Options
// ============================================

export interface SearchPlacesOptions {
  maxResultCount?: number;
  includedType?: string;
  locationBias?: {
    latitude: number;
    longitude: number;
    radiusMeters?: number;
  };
}

// ============================================
// Custom Error Class
// ============================================

export class PlacesApiClientError extends Error {
  public statusCode: number;
  public apiError?: PlacesApiError;

  constructor(message: string, statusCode: number, apiError?: PlacesApiError) {
    super(message);
    this.name = "PlacesApiClientError";
    this.statusCode = statusCode;
    if (apiError) {
      this.apiError = apiError;
    }
  }

  get isRateLimited(): boolean {
    return this.statusCode === 429;
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isInvalidApiKey(): boolean {
    return this.statusCode === 403 || this.statusCode === 401;
  }

  get isQuotaExceeded(): boolean {
    return (
      this.statusCode === 429 ||
      this.apiError?.error?.status === "RESOURCE_EXHAUSTED"
    );
  }
}
