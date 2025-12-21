import { NextRequest, NextResponse } from "next/server";
import type { SyncFieldType } from "@/lib/google-places";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getClinicById } from "@/lib/clinic-queries";
import { syncClinic, getSyncStatus, isPlacesApiConfigured } from "@/lib/sync";

interface RouteParams {
  params: Promise<{ clinicId: string }>;
}

// Valid sync field types
const VALID_FIELDS: SyncFieldType[] = ["reviews", "hours", "photos", "contact", "location"];

/**
 * GET /api/admin/clinics/[clinicId]/sync
 * Get sync status for a clinic
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { clinicId } = await params;

  try {
    // Check if clinic exists
    const clinic = await getClinicById(clinicId);
    if (!clinic) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    // Get sync status
    const syncStatus = await getSyncStatus(clinicId);

    return NextResponse.json({
      clinicId,
      placeId: clinic.placeId,
      hasPlaceId: Boolean(clinic.placeId),
      syncStatus: syncStatus || null,
      apiConfigured: isPlacesApiConfigured(),
    });
  } catch (error) {
    console.error("Error fetching sync status:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/clinics/[clinicId]/sync
 * Trigger a sync for a single clinic
 *
 * Body: { fields?: SyncFieldType[] }
 * If fields is not provided, syncs all available fields
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { clinicId } = await params;

  try {
    // Check if Places API is configured
    if (!isPlacesApiConfigured()) {
      return NextResponse.json(
        { error: "Google Places API is not configured" },
        { status: 503 }
      );
    }

    // Check if clinic exists
    const clinic = await getClinicById(clinicId);
    if (!clinic) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    // Check if clinic has a Place ID
    if (!clinic.placeId) {
      return NextResponse.json(
        { error: "Clinic has no Place ID. Please set a Place ID first." },
        { status: 400 }
      );
    }

    // Parse request body
    let fields: SyncFieldType[] | undefined;
    try {
      const body = await request.json();
      if (body.fields && Array.isArray(body.fields)) {
        // Validate fields
        const invalidFields = body.fields.filter(
          (f: string) => !VALID_FIELDS.includes(f as SyncFieldType)
        );
        if (invalidFields.length > 0) {
          return NextResponse.json(
            { error: `Invalid fields: ${invalidFields.join(", ")}. Valid fields are: ${VALID_FIELDS.join(", ")}` },
            { status: 400 }
          );
        }
        fields = body.fields as SyncFieldType[];
      }
    } catch {
      // No body or invalid JSON - use default fields
    }

    // Perform the sync
    const result = await syncClinic(clinicId, fields ? { fields } : {});

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          clinicId: result.clinicId,
          placeId: result.placeId,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      clinicId: result.clinicId,
      placeId: result.placeId,
      updatedFields: result.updatedFields,
      changes: result.changes,
      apiCallsUsed: result.apiCallsUsed,
    });
  } catch (error) {
    console.error("Error syncing clinic:", error);
    return NextResponse.json(
      { error: "Failed to sync clinic" },
      { status: 500 }
    );
  }
}
