import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { type SyncFieldType } from "@/lib/google-places";
import {
  syncBulk,
  createSyncLog,
  updateSyncLog,
  isPlacesApiConfigured,
} from "@/lib/sync";

/**
 * POST /api/admin/clinics/bulk-sync
 * Sync multiple clinics with Google Places data
 *
 * Request body:
 * - clinicIds: string[] - Array of clinic IDs to sync
 * - fields: SyncFieldType[] - Optional array of fields to sync
 */
export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  // Check if Places API is configured
  if (!isPlacesApiConfigured()) {
    return NextResponse.json(
      { error: "Google Places API is not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { clinicIds, fields } = body as {
      clinicIds?: string[];
      fields?: SyncFieldType[];
    };

    // Validate clinicIds
    if (!clinicIds || !Array.isArray(clinicIds) || clinicIds.length === 0) {
      return NextResponse.json(
        { error: "clinicIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate fields if provided
    const validFields: SyncFieldType[] = [
      "reviews",
      "hours",
      "photos",
      "contact",
      "location",
    ];
    if (fields) {
      if (!Array.isArray(fields)) {
        return NextResponse.json(
          { error: "fields must be an array" },
          { status: 400 }
        );
      }
      for (const field of fields) {
        if (!validFields.includes(field)) {
          return NextResponse.json(
            { error: `Invalid field: ${field}. Valid fields: ${validFields.join(", ")}` },
            { status: 400 }
          );
        }
      }
    }

    // Create sync log entry
    const syncLog = await createSyncLog({
      status: "in_progress",
      startedAt: new Date(),
      totalClinics: clinicIds.length,
      triggeredBy: adminCheck.user.id,
    });

    try {
      // Build options object conditionally to satisfy exactOptionalPropertyTypes
      const syncOptions: Parameters<typeof syncBulk>[1] = {
        skipClinicsWithErrors: true,
        delayBetweenRequests: 100, // 100ms between requests
      };
      if (fields && fields.length > 0) {
        syncOptions.fields = fields;
      }

      // Process with rate limiting
      const results = await syncBulk(clinicIds, syncOptions);

      // Calculate API calls used
      const apiCallsUsed = results.results.reduce(
        (sum, r) => sum + r.apiCallsUsed,
        0
      );

      // Update log with results
      await updateSyncLog(syncLog.id, {
        status: "completed",
        completedAt: new Date(),
        successCount: results.successCount,
        errorCount: results.errorCount,
        skippedCount: results.skippedCount,
        apiCallsUsed,
        errors:
          results.errors.length > 0
            ? results.errors.map((e) => ({
                clinicId: e.clinicId,
                error: e.error,
                timestamp: e.timestamp.toISOString(),
              }))
            : null,
      });

      return NextResponse.json({
        success: true,
        syncLogId: syncLog.id,
        totalProcessed: results.totalProcessed,
        successCount: results.successCount,
        errorCount: results.errorCount,
        skippedCount: results.skippedCount,
        apiCallsUsed,
        errors: results.errors.map((e) => ({
          clinicId: e.clinicId,
          error: e.error,
        })),
      });
    } catch (syncError) {
      // Update log with failure
      await updateSyncLog(syncLog.id, {
        status: "failed",
        completedAt: new Date(),
        errors: [
          {
            clinicId: "bulk",
            error:
              syncError instanceof Error
                ? syncError.message
                : "Unknown error during bulk sync",
            timestamp: new Date().toISOString(),
          },
        ],
      });

      throw syncError;
    }
  } catch (error) {
    console.error("Bulk sync error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to perform bulk sync",
      },
      { status: 500 }
    );
  }
}
