import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { checkAdminApi } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { pingIndexNow, clinicUrl } from "@/lib/indexnow";
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

    // Fetch clinic data needed for smart revalidation
    const clinicsToUpdate = await db
      .select({
        id: schema.clinics.id,
        permalink: schema.clinics.permalink,
        stateAbbreviation: schema.clinics.stateAbbreviation,
        status: schema.clinics.status,
      })
      .from(schema.clinics)
      .where(inArray(schema.clinics.id, clinicIds));

    // Determine if any clinics are changing public visibility
    const hasVisibilityChange = clinicsToUpdate.some(
      (c) => (c.status === "published") !== (status === "published")
    );

    // Find clinics being published for the first time (draft/deleted → published)
    const clinicsBeingPublished = clinicsToUpdate
      .filter((c) => c.status !== "published" && status === "published")
      .map((c) => c.id);

    // Update the status of all selected clinics
    const now = new Date();
    const result = await db
      .update(schema.clinics)
      .set({
        status: status as ClinicStatus,
        updatedAt: now,
      })
      .where(inArray(schema.clinics.id, clinicIds))
      .returning({ id: schema.clinics.id, title: schema.clinics.title });

    // Set publishedAt for clinics being published for the first time
    // (only if they don't already have a publishedAt date)
    if (clinicsBeingPublished.length > 0) {
      await db
        .update(schema.clinics)
        .set({ publishedAt: now })
        .where(
          inArray(schema.clinics.id, clinicsBeingPublished)
        );
    }

    // Ping IndexNow for clinics being published (fire-and-forget)
    if (status === "published") {
      const publishedUrls = clinicsToUpdate
        .filter((c) => c.permalink)
        .map((c) => clinicUrl(c.permalink!));
      if (publishedUrls.length > 0) {
        void pingIndexNow(publishedUrls);
      }
    }

    // Smart revalidation: revalidate individual clinic pages that changed
    // Only revalidate listing pages if visibility changed for any clinic
    for (const clinic of clinicsToUpdate) {
      if (clinic.permalink) {
        revalidatePath(`/${clinic.permalink}`);
      }
    }

    // Revalidate listing pages only if public visibility changed
    if (hasVisibilityChange) {
      revalidatePath("/admin/clinics");
      revalidatePath("/pain-management");
    } else {
      // Still revalidate admin page to show status updates
      revalidatePath("/admin/clinics");
    }

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
