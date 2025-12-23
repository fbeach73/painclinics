import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";

interface RouteParams {
  params: Promise<{ clinicId: string }>;
}

/**
 * PATCH /api/admin/clinics/[clinicId]/status
 * Update a clinic's status (draft, published, deleted)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const { clinicId } = await params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !["draft", "published", "deleted"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'draft', 'published', or 'deleted'" },
        { status: 400 }
      );
    }

    // Check if clinic exists
    const existing = await db
      .select({ id: clinics.id })
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    // Update the status
    const [updated] = await db
      .update(clinics)
      .set({ status: status as "draft" | "published" | "deleted" })
      .where(eq(clinics.id, clinicId))
      .returning({ id: clinics.id, status: clinics.status });

    return NextResponse.json({
      success: true,
      clinic: updated,
    });
  } catch (error) {
    console.error("Error updating clinic status:", error);
    return NextResponse.json(
      { error: "Failed to update clinic status" },
      { status: 500 }
    );
  }
}
