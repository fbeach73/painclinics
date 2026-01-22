import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { checkAdminApi } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

type ClinicStatus = "draft" | "published" | "deleted";

/**
 * PATCH /api/admin/clinics/bulk-status
 * Update the status of multiple clinics at once
 */
export async function PATCH(request: Request) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  try {
    const { clinicIds, status } = await request.json();

    if (!Array.isArray(clinicIds) || clinicIds.length === 0) {
      return NextResponse.json(
        { error: "clinicIds array is required" },
        { status: 400 }
      );
    }

    const validStatuses: ClinicStatus[] = ["draft", "published", "deleted"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Valid status is required (draft, published, or deleted)" },
        { status: 400 }
      );
    }

    // Limit bulk update to 500 at a time for safety
    if (clinicIds.length > 500) {
      return NextResponse.json(
        { error: "Cannot update more than 500 clinics at once" },
        { status: 400 }
      );
    }

    // Update the status of all selected clinics
    const result = await db
      .update(schema.clinics)
      .set({
        status: status as ClinicStatus,
        updatedAt: new Date(),
      })
      .where(inArray(schema.clinics.id, clinicIds))
      .returning({ id: schema.clinics.id, title: schema.clinics.title });

    // Revalidate the clinics pages
    revalidatePath("/admin/clinics");
    revalidatePath("/pain-management");

    return NextResponse.json({
      success: true,
      updatedCount: result.length,
      status,
      updatedClinics: result,
    });
  } catch (error) {
    console.error("Bulk status update error:", error);
    return NextResponse.json(
      { error: "Failed to update clinic statuses" },
      { status: 500 }
    );
  }
}
