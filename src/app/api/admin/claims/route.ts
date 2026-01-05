import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getClaims, getClaimsCountByStatus, deleteClaims } from "@/lib/claim-queries";

/**
 * GET /api/admin/claims
 * List claims for admin review with pagination and filtering
 *
 * Query params:
 * - status: "pending" | "approved" | "rejected" | "expired" | "all" (default: "pending")
 * - limit: number (default: 20)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get("status") || "pending";
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Validate status parameter
    const validStatuses = ["pending", "approved", "rejected", "expired", "all"];
    const status = validStatuses.includes(statusParam)
      ? (statusParam as "pending" | "approved" | "rejected" | "expired" | "all")
      : "pending";

    // Get claims with pagination
    const result = await getClaims({ status, limit, offset });

    // Get counts for dashboard
    const counts = await getClaimsCountByStatus();

    return NextResponse.json({
      claims: result.claims,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        hasMore: result.offset + result.claims.length < result.total,
      },
      counts,
    });
  } catch (error) {
    console.error("Error fetching claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/claims
 * Delete claims by IDs (for cleanup of old/test data)
 *
 * Body: {
 *   claimIds: string[]  // Array of claim IDs to delete
 * }
 */
export async function DELETE(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const body = await request.json();
    const { claimIds } = body;

    if (!Array.isArray(claimIds) || claimIds.length === 0) {
      return NextResponse.json(
        { error: "claimIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Audit log for claim deletion
    console.warn("[API] Claims deletion initiated", {
      claimIds,
      count: claimIds.length,
      adminId: adminCheck.user.id,
    });

    const result = await deleteClaims(claimIds);

    console.warn("[API] Claims deletion completed", {
      requested: claimIds.length,
      deleted: result.deleted,
      adminId: adminCheck.user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.deleted} claim(s)`,
      deleted: result.deleted,
    });
  } catch (error) {
    console.error("Error deleting claims:", error);
    return NextResponse.json(
      { error: "Failed to delete claims" },
      { status: 500 }
    );
  }
}
