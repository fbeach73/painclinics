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

    // Audit log for claim approval
    console.warn("[API] Claim approval initiated", {
      claimId,
      adminId: adminCheck.user.id,
      hasAdminNotes: !!adminNotes,
    });

    const result = await approveClaim(
      claimId,
      adminCheck.user.id,
      adminNotes
    );

    console.warn("[API] Claim approval completed", {
      claimId,
      clinicId: result.clinicId,
      userId: result.userId,
      emailSent: result.emailSent,
    });

    return NextResponse.json({
      success: true,
      message: "Claim approved successfully. Ownership has been transferred.",
      claimId: result.claimId,
      clinicId: result.clinicId,
      userId: result.userId,
      emailSent: result.emailSent,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Structured logging with full context
    console.error("[API] Claim approval failed", {
      claimId,
      adminId: adminCheck.user.id,
      error: errorMessage,
      stack: errorStack,
    });

    // Return specific error messages based on failure type
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
      // Pass through specific error messages for debugging
      return NextResponse.json(
        { error: errorMessage, details: "Check server logs for full stack trace" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to approve claim" },
      { status: 500 }
    );
  }
}
