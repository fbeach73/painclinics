import { NextRequest, NextResponse } from "next/server";
import {
  checkAdminApi,
  adminErrorResponse,
} from "@/lib/admin-auth";
import {
  getClinicFeaturedInfo,
  updateClinicFeaturedStatus,
  removeClinicFeaturedStatus,
} from "@/lib/admin-clinic-queries";

interface RouteContext {
  params: Promise<{ clinicId: string }>;
}

/**
 * GET /api/admin/clinics/[clinicId]/featured
 * Fetch featured info with subscription context for a clinic
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { clinicId } = await context.params;

  try {
    const featuredInfo = await getClinicFeaturedInfo(clinicId);

    if (!featuredInfo) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(featuredInfo);
  } catch (error) {
    console.error("Failed to fetch clinic featured info:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured info" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/clinics/[clinicId]/featured
 * Update featured status for a clinic (admin override)
 *
 * Body: {
 *   isFeatured: boolean,
 *   featuredTier?: 'basic' | 'premium',
 *   featuredUntil?: string (ISO date)
 * }
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { clinicId } = await context.params;

  try {
    const body = await request.json();
    const { isFeatured, featuredTier, featuredUntil } = body;

    // Validate isFeatured is provided
    if (typeof isFeatured !== "boolean") {
      return NextResponse.json(
        { error: "isFeatured (boolean) is required" },
        { status: 400 }
      );
    }

    // Validate featuredTier if provided
    if (featuredTier && !["basic", "premium"].includes(featuredTier)) {
      return NextResponse.json(
        { error: "featuredTier must be 'basic' or 'premium'" },
        { status: 400 }
      );
    }

    // Validate featuredUntil when featuring
    let featuredUntilDate: Date | undefined;
    if (isFeatured) {
      if (!featuredUntil) {
        return NextResponse.json(
          { error: "featuredUntil is required when featuring a clinic" },
          { status: 400 }
        );
      }

      featuredUntilDate = new Date(featuredUntil);
      if (isNaN(featuredUntilDate.getTime())) {
        return NextResponse.json(
          { error: "featuredUntil must be a valid ISO date string" },
          { status: 400 }
        );
      }

      // Check that the date is in the future
      if (featuredUntilDate <= new Date()) {
        return NextResponse.json(
          { error: "featuredUntil must be a future date" },
          { status: 400 }
        );
      }
    }

    // Check if clinic exists
    const existingInfo = await getClinicFeaturedInfo(clinicId);
    if (!existingInfo) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    // Update the featured status
    const updatedInfo = await updateClinicFeaturedStatus(clinicId, {
      isFeatured,
      featuredTier: featuredTier as "basic" | "premium" | undefined,
      featuredUntil: featuredUntilDate,
    });

    return NextResponse.json({
      message: isFeatured
        ? `Clinic featured as ${featuredTier || "basic"} until ${featuredUntilDate?.toISOString()}`
        : "Clinic featured status removed",
      ...updatedInfo,
    });
  } catch (error) {
    console.error("Failed to update clinic featured status:", error);
    return NextResponse.json(
      { error: "Failed to update featured status" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/clinics/[clinicId]/featured
 * Remove featured status from a clinic
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { clinicId } = await context.params;

  try {
    // Check if clinic exists
    const existingInfo = await getClinicFeaturedInfo(clinicId);
    if (!existingInfo) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    const updatedInfo = await removeClinicFeaturedStatus(clinicId);

    return NextResponse.json({
      message: "Featured status removed",
      ...updatedInfo,
    });
  } catch (error) {
    console.error("Failed to remove clinic featured status:", error);
    return NextResponse.json(
      { error: "Failed to remove featured status" },
      { status: 500 }
    );
  }
}
