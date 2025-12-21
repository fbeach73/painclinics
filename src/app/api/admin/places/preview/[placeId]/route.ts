import { NextRequest, NextResponse } from "next/server";
import type { SyncFieldType } from "@/lib/google-places";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { PlacesApiClientError } from "@/lib/google-places";
import { previewPlaceData, isPlacesApiConfigured } from "@/lib/sync";

interface RouteParams {
  params: Promise<{ placeId: string }>;
}

// Valid sync field types
const VALID_FIELDS: SyncFieldType[] = ["reviews", "hours", "photos", "contact", "location"];

/**
 * GET /api/admin/places/preview/[placeId]
 * Preview data from a Google Place without saving
 *
 * Query params:
 * - fields: Comma-separated list of fields to preview (optional, defaults to all)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { placeId } = await params;

  try {
    // Check if Places API is configured
    if (!isPlacesApiConfigured()) {
      return NextResponse.json(
        { error: "Google Places API is not configured" },
        { status: 503 }
      );
    }

    // Validate place ID format (basic validation)
    if (!placeId || placeId.length < 10) {
      return NextResponse.json(
        { error: "Invalid Place ID" },
        { status: 400 }
      );
    }

    // Parse fields from query params
    const { searchParams } = request.nextUrl;
    const fieldsParam = searchParams.get("fields");
    let fields: SyncFieldType[] | undefined;

    if (fieldsParam) {
      const requestedFields = fieldsParam.split(",").map((f) => f.trim());
      const invalidFields = requestedFields.filter(
        (f) => !VALID_FIELDS.includes(f as SyncFieldType)
      );
      if (invalidFields.length > 0) {
        return NextResponse.json(
          { error: `Invalid fields: ${invalidFields.join(", ")}. Valid fields are: ${VALID_FIELDS.join(", ")}` },
          { status: 400 }
        );
      }
      fields = requestedFields as SyncFieldType[];
    }

    // Fetch preview data
    const result = await previewPlaceData(placeId, fields);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch place data" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      placeId,
      data: result.data,
      rawData: result.rawData,
    });
  } catch (error) {
    console.error("Places preview error:", error);

    if (error instanceof PlacesApiClientError) {
      if (error.isNotFound) {
        return NextResponse.json(
          { error: "Place not found" },
          { status: 404 }
        );
      }
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
      { error: "Failed to preview place data" },
      { status: 500 }
    );
  }
}
