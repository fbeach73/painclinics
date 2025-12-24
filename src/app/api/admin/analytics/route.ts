import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi } from "@/lib/admin-auth";
import {
  getOverviewStats,
  getReferrerStats,
  getTopPages,
  getViewsOverTime,
  type DateRange,
} from "@/lib/analytics/queries";

export async function GET(request: NextRequest) {
  // Verify admin access
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const range = (searchParams.get("range") as DateRange) || "30d";

  // Validate range parameter
  if (!["today", "7d", "30d", "all"].includes(range)) {
    return NextResponse.json(
      { error: "Invalid range parameter" },
      { status: 400 }
    );
  }

  try {
    // Fetch all analytics data in parallel
    const [overview, referrers, topPages, viewsOverTime] = await Promise.all([
      getOverviewStats(range),
      getReferrerStats(range, 10),
      getTopPages(range, 10),
      getViewsOverTime(range),
    ]);

    return NextResponse.json({
      overview,
      referrers,
      topPages,
      viewsOverTime,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}
