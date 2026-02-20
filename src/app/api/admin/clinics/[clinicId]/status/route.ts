import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { pingIndexNow, clinicUrl } from "@/lib/indexnow";
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

    // Check if clinic exists and get data needed for revalidation
    const existing = await db
      .select({
        id: clinics.id,
        permalink: clinics.permalink,
        city: clinics.city,
        stateAbbreviation: clinics.stateAbbreviation,
        status: clinics.status,
      })
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    const clinic = existing[0]!;
    const oldStatus = clinic.status;

    // Prepare update data
    const updateData: {
      status: "draft" | "published" | "deleted";
      publishedAt?: Date;
    } = {
      status: status as "draft" | "published" | "deleted",
    };

    // Set publishedAt when publishing for the first time
    if (oldStatus !== "published" && status === "published") {
      updateData.publishedAt = new Date();
    }

    // Update the status
    const [updated] = await db
      .update(clinics)
      .set(updateData)
      .where(eq(clinics.id, clinicId))
      .returning({ id: clinics.id, status: clinics.status });

    // Smart revalidation: only revalidate listing pages when public visibility changes
    // Draft → Published: clinic appears on public site (revalidate all)
    // Published → Draft: clinic disappears from public site (revalidate all)
    // Published → Deleted: clinic disappears (revalidate all)
    // Draft → Deleted: clinic was never visible (skip listing revalidation)
    const wasPublic = oldStatus === "published";
    const isPublic = status === "published";
    const visibilityChanged = wasPublic !== isPublic || (status === "deleted" && wasPublic);

    if (clinic) {
      const { permalink, stateAbbreviation, city } = clinic;

      // Always revalidate the individual clinic page
      if (permalink) {
        revalidatePath(`/${permalink}`);
      }

      // Only revalidate listing pages if public visibility changed
      if (visibilityChanged && stateAbbreviation) {
        // Revalidate the state listing page
        const statePath = `/pain-management/${stateAbbreviation.toLowerCase()}`;
        revalidatePath(statePath);

        // Revalidate the city listing page
        if (city) {
          const citySlug = city.toLowerCase().replace(/\s+/g, "-");
          const cityPath = `/pain-management/${stateAbbreviation.toLowerCase()}/${citySlug}`;
          revalidatePath(cityPath);
        }

        // Revalidate the main clinics directory page
        revalidatePath("/pain-management");
      }
    }

    // Ping IndexNow when a clinic is published (fire-and-forget)
    if (status === "published" && clinic.permalink) {
      void pingIndexNow([clinicUrl(clinic.permalink)]);
    }

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
