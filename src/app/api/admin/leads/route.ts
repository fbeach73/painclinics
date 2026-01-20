import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import {
  getLeads,
  getLeadsCount,
  getLeadsCountByStatus,
  type LeadStatus,
} from "@/lib/lead-queries";

/**
 * GET /api/admin/leads
 * List leads for admin review with pagination and filtering
 *
 * Query params:
 * - status: "new" | "contacted" | "qualified" | "closed" | "needs_followup" | "all" (default: "all")
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get("status") || "all";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Validate status parameter
    const validStatuses = [
      "new",
      "contacted",
      "qualified",
      "closed",
      "needs_followup",
      "all",
    ];
    const status = validStatuses.includes(statusParam)
      ? (statusParam as LeadStatus | "all" | "needs_followup")
      : "all";

    // Get leads with pagination
    const leads = await getLeads({ status, limit, offset });

    // Get total count for pagination
    const total = await getLeadsCount(status);

    // Get counts for filter tabs
    const counts = await getLeadsCountByStatus();

    return NextResponse.json({
      leads,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + leads.length < total,
      },
      counts,
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
