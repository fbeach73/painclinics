import { revalidatePath } from "next/cache";
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

    // Check if clinic exists and get data needed for revalidation
    const existing = await db
      .select({
        id: clinics.id,
        permalink: clinics.permalink,
        city: clinics.city,
        stateAbbreviation: clinics.stateAbbreviation,
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

    // Update the status
    const [updated] = await db
      .update(clinics)
      .set({ status: status as "draft" | "published" | "deleted" })
      .where(eq(clinics.id, clinicId))
      .returning({ id: clinics.id, status: clinics.status });

    // Revalidate all affected pages when status changes
    // This ensures pages are regenerated with the new status
    const clinic = existing[0];
    if (clinic) {
      const { permalink, stateAbbreviation, city } = clinic;

      // 1. Revalidate the individual clinic page
      if (permalink) {
        revalidatePath(`/${permalink}`);
      }

      // 2. Revalidate the state listing page (clinic appears/disappears here)
      if (stateAbbreviation) {
        const statePath = `/pain-management/${stateAbbreviation.toLowerCase()}`;
        revalidatePath(statePath);
      }

      // 3. Revalidate the city listing page (clinic appears/disappears here)
      if (stateAbbreviation && city) {
        const citySlug = city.toLowerCase().replace(/\s+/g, "-");
        const cityPath = `/pain-management/${stateAbbreviation.toLowerCase()}/${citySlug}`;
        revalidatePath(cityPath);
      }

      // 4. Revalidate the main clinics directory page
      revalidatePath("/pain-management");

      // 5. Revalidate the catch-all route layout to clear any 404 cache
      // Using 'page' type ensures we're targeting the page specifically
      revalidatePath("/pain-management/[...slug]", "page");
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
