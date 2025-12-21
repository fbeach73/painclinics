import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getServerEnv } from "@/lib/env";
import { GooglePlacesClient, PlacesApiClientError } from "@/lib/google-places";

/**
 * GET /api/admin/places/lookup
 * Search for places using Google Places API
 *
 * Query params:
 * - q: Search query (required)
 * - lat: Optional latitude for location bias
 * - lng: Optional longitude for location bias
 */
export async function GET(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get("q")?.trim();
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!query || query.length < 3) {
      return NextResponse.json(
        { error: "Search query must be at least 3 characters" },
        { status: 400 }
      );
    }

    // Get API key
    const env = getServerEnv();
    const apiKey = env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Places API is not configured" },
        { status: 503 }
      );
    }

    const client = new GooglePlacesClient(apiKey);

    // Build search options
    const options: {
      maxResultCount?: number;
      locationBias?: {
        latitude: number;
        longitude: number;
        radiusMeters?: number;
      };
    } = {
      maxResultCount: 10,
    };

    // Add location bias if coordinates provided
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      if (!isNaN(latitude) && !isNaN(longitude)) {
        options.locationBias = {
          latitude,
          longitude,
          radiusMeters: 50000, // 50km radius
        };
      }
    }

    // Search for places
    const results = await client.searchPlaces(query, options);

    return NextResponse.json({
      places: results.places.map((place) => ({
        id: place.id,
        name: place.displayName?.text || "Unknown",
        address: place.formattedAddress || "",
        location: place.location || null,
      })),
    });
  } catch (error) {
    console.error("Places lookup error:", error);

    if (error instanceof PlacesApiClientError) {
      if (error.isInvalidApiKey) {
        return NextResponse.json(
          { error: "Invalid Google Places API key" },
          { status: 503 }
        );
      }
      if (error.isQuotaExceeded) {
        return NextResponse.json(
          { error: "Google Places API quota exceeded" },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to search places" },
      { status: 500 }
    );
  }
}
