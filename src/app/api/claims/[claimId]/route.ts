import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getClaimById } from "@/lib/claim-queries";

interface RouteParams {
  params: Promise<{ claimId: string }>;
}

/**
 * GET /api/claims/[claimId]
 * Get the status and details of a specific claim
 * Only accessible by the claim owner
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Only allow the claim owner to view their claim
    if (claim.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Return a sanitized version (without admin notes or internal data)
    return NextResponse.json({
      claim: {
        id: claim.id,
        clinicId: claim.clinicId,
        status: claim.status,
        fullName: claim.fullName,
        role: claim.role,
        businessEmail: claim.businessEmail,
        businessPhone: claim.businessPhone,
        additionalNotes: claim.additionalNotes,
        rejectionReason: claim.rejectionReason,
        createdAt: claim.createdAt,
        reviewedAt: claim.reviewedAt,
        clinic: {
          id: claim.clinic.id,
          title: claim.clinic.title,
          city: claim.clinic.city,
          state: claim.clinic.state,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching claim:", error);
    return NextResponse.json(
      { error: "Failed to fetch claim" },
      { status: 500 }
    );
  }
}
