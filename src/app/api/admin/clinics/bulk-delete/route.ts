import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { checkAdminApi } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

/**
 * DELETE /api/admin/clinics/bulk-delete
 * Permanently delete multiple clinics from the database
 */
export async function DELETE(request: Request) {
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

    // Limit bulk delete to 500 at a time for safety
    if (clinicIds.length > 500) {
      return NextResponse.json(
        { error: "Cannot delete more than 500 clinics at once" },
        { status: 400 }
      );
    }

    // Delete related records first (foreign key constraints)
    // Delete clinic services junction records
    await db
      .delete(schema.clinicServices)
      .where(inArray(schema.clinicServices.clinicId, clinicIds));

    // Delete clinic claims
    await db
      .delete(schema.clinicClaims)
      .where(inArray(schema.clinicClaims.clinicId, clinicIds));

    // Delete the clinics
    const result = await db
      .delete(schema.clinics)
      .where(inArray(schema.clinics.id, clinicIds))
      .returning({ id: schema.clinics.id });

    return NextResponse.json({
      success: true,
      deletedCount: result.length,
      deletedIds: result.map((r) => r.id),
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete clinics" },
      { status: 500 }
    );
  }
}
