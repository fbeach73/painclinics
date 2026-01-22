import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { checkAdminApi } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";

/**
 * POST /api/admin/clinics/bulk-names
 * Fetch clinic names for a list of clinic IDs.
 * Used by bulk enhance modal to display proper clinic names across pagination.
 */
export async function POST(request: Request) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  try {
    const { clinicIds } = await request.json();

    if (!Array.isArray(clinicIds) || clinicIds.length === 0) {
      return NextResponse.json(
        { error: "clinicIds array is required" },
        { status: 400 }
      );
    }

    // Limit to 500 IDs for safety
    if (clinicIds.length > 500) {
      return NextResponse.json(
        { error: "Cannot fetch more than 500 clinics at once" },
        { status: 400 }
      );
    }

    // Fetch clinic id and title for all requested IDs
    const results = await db
      .select({
        id: clinics.id,
        title: clinics.title,
      })
      .from(clinics)
      .where(inArray(clinics.id, clinicIds));

    // Convert to Map for easy lookup
    const clinicMap = new Map(results.map((r) => [r.id, r.title]));

    return NextResponse.json({
      clinics: results,
      clinicMap: Object.fromEntries(clinicMap),
    });
  } catch (error) {
    console.error("Bulk names fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clinic names" },
      { status: 500 }
    );
  }
}
