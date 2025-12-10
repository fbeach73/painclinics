import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { approveClaim } from "@/lib/claim-queries";

interface RouteParams {
  params: Promise<{ claimId: string }>;
}

/**
 * POST /api/admin/claims/[claimId]/approve
 * Approve a pending claim and transfer ownership to the claimant
 *
 * Body: {
 *   adminNotes?: string  // Optional notes for internal tracking
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
    const body = await request.json().catch(() => ({}));
    const { adminNotes } = body;

    const result = await approveClaim(
      claimId,
      adminCheck.user.id,
      adminNotes
    );

    return NextResponse.json({
      success: true,
      message: "Claim approved successfully. Ownership has been transferred.",
      claimId: result.claimId,
      clinicId: result.clinicId,
      userId: result.userId,
    });
  } catch (error) {
    console.error("Error approving claim:", error);

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
      { error: "Failed to approve claim" },
      { status: 500 }
    );
  }
}
