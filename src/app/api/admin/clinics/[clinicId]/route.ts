import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getClinicById } from "@/lib/clinic-queries";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";

interface RouteParams {
  params: Promise<{ clinicId: string }>;
}

/**
 * GET /api/admin/clinics/[clinicId]
 * Get a single clinic by ID with all fields
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { clinicId } = await params;

  try {
    const clinic = await getClinicById(clinicId);

    if (!clinic) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ clinic });
  } catch (error) {
    console.error("Error fetching clinic:", error);
    return NextResponse.json(
      { error: "Failed to fetch clinic" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/clinics/[clinicId]
 * Update a clinic with partial data
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { clinicId } = await params;

  try {
    // Check if clinic exists
    const existingClinic = await getClinicById(clinicId);
    if (!existingClinic) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    // Validate and collect updates for allowed fields
    const allowedFields = [
      // Basic info
      "title",
      "clinicType",
      "permalink",
      // Location
      "streetAddress",
      "city",
      "state",
      "stateAbbreviation",
      "postalCode",
      "mapLatitude",
      "mapLongitude",
      "detailedAddress",
      "placeId",
      // Contact
      "phone",
      "phones",
      "website",
      "emails",
      // Content
      "content",
      "newPostContent",
      // Media
      "imageUrl",
      "imageFeatured",
      "featImage",
      "clinicImageUrls",
      "qrCode",
      // Features
      "amenities",
      "checkboxFeatures",
      "googleListingLink",
      // Social media
      "facebook",
      "instagram",
      "twitter",
      "youtube",
      "linkedin",
      "tiktok",
      "pinterest",
      // Featured status
      "isFeatured",
      "featuredTier",
      "featuredUntil",
      // Review data (admin override)
      "rating",
      "reviewCount",
      // Business hours
      "clinicHours",
      "closedOn",
      // Reviews
      "featuredReviews",
      "reviewsPerScore",
      "reviewKeywords",
      // Q&A
      "questions",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Validate required fields if being updated
    if (updates.title !== undefined && typeof updates.title !== "string") {
      return NextResponse.json(
        { error: "Title must be a string" },
        { status: 400 }
      );
    }

    if (updates.city !== undefined && typeof updates.city !== "string") {
      return NextResponse.json(
        { error: "City must be a string" },
        { status: 400 }
      );
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Add updatedAt timestamp
    updates.updatedAt = new Date();

    // Perform update
    const [updated] = await db
      .update(clinics)
      .set(updates)
      .where(eq(clinics.id, clinicId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update clinic" },
        { status: 500 }
      );
    }

    return NextResponse.json({ clinic: updated });
  } catch (error) {
    console.error("Error updating clinic:", error);
    return NextResponse.json(
      { error: "Failed to update clinic" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/clinics/[clinicId]
 * Delete a clinic
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { clinicId } = await params;

  try {
    // Check if clinic exists
    const existingClinic = await getClinicById(clinicId);
    if (!existingClinic) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 404 }
      );
    }

    // Delete the clinic (cascade will handle related records)
    const result = await db
      .delete(clinics)
      .where(eq(clinics.id, clinicId))
      .returning({ id: clinics.id });

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Failed to delete clinic" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Clinic "${existingClinic.title}" has been deleted`,
    });
  } catch (error) {
    console.error("Error deleting clinic:", error);
    return NextResponse.json(
      { error: "Failed to delete clinic" },
      { status: 500 }
    );
  }
}
