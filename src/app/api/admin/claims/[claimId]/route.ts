import { NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getClaimById, getClinicClaimHistory } from "@/lib/claim-queries";

interface RouteParams {
  params: Promise<{ claimId: string }>;
}

/**
 * GET /api/admin/claims/[claimId]
 * Get full details of a specific claim for admin review
 */
export async function GET(_request: Request, { params }: RouteParams) {
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
    const claim = await getClaimById(claimId);

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Get claim history for this clinic (other claims)
    const claimHistory = await getClinicClaimHistory(claim.clinicId);
    const otherClaims = claimHistory.filter((c) => c.id !== claimId);

    return NextResponse.json({
      claim,
      otherClaims,
    });
  } catch (error) {
    console.error("Error fetching claim:", error);
    return NextResponse.json(
      { error: "Failed to fetch claim" },
      { status: 500 }
    );
  }
}
