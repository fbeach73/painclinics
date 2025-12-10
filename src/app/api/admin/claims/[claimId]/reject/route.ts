import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { rejectClaim } from "@/lib/claim-queries";

interface RouteParams {
  params: Promise<{ claimId: string }>;
}

/**
 * POST /api/admin/claims/[claimId]/reject
 * Reject a pending claim
 *
 * Body: {
 *   rejectionReason: string  // Required - reason shown to the user
 *   adminNotes?: string      // Optional notes for internal tracking
 * }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { claimId } = await params;

  if (!claimId) {
    return NextResponse.json(
      { error: "Claim ID is required" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { rejectionReason, adminNotes } = body;

    // Validate rejection reason is provided
    if (!rejectionReason || typeof rejectionReason !== "string" || rejectionReason.trim().length === 0) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const result = await rejectClaim(
      claimId,
      adminCheck.user.id,
      rejectionReason.trim(),
      adminNotes?.trim()
    );

    return NextResponse.json({
      success: true,
      message: "Claim rejected successfully.",
      claimId: result.claimId,
      clinicId: result.clinicId,
    });
  } catch (error) {
    console.error("Error rejecting claim:", error);

    // Check for specific error messages
    if (error instanceof Error) {
      if (error.message === "Claim not found") {
        return NextResponse.json({ error: "Claim not found" }, { status: 404 });
      }
      if (error.message === "Claim has already been reviewed") {
        return NextResponse.json(
          { error: "This claim has already been reviewed" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to reject claim" },
      { status: 500 }
    );
  }
}
