import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getEmailStats, getEmailStatsByTemplate } from "@/lib/email-queries";

export async function GET(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const [stats, byTemplate] = await Promise.all([
      getEmailStats(startDate, endDate),
      getEmailStatsByTemplate(startDate, endDate),
    ]);

    // Calculate rates
    const deliveryRate = stats.total > 0
      ? ((stats.delivered + stats.opened + stats.clicked) / stats.total * 100).toFixed(1)
      : "0.0";
    const bounceRate = stats.total > 0
      ? (stats.bounced / stats.total * 100).toFixed(1)
      : "0.0";
    const complaintRate = stats.total > 0
      ? (stats.complained / stats.total * 100).toFixed(1)
      : "0.0";
    const openRate = (stats.delivered + stats.opened + stats.clicked) > 0
      ? ((stats.opened + stats.clicked) / (stats.delivered + stats.opened + stats.clicked) * 100).toFixed(1)
      : "0.0";
    const clickRate = (stats.opened + stats.clicked) > 0
      ? (stats.clicked / (stats.opened + stats.clicked) * 100).toFixed(1)
      : "0.0";

    return NextResponse.json({
      stats,
      rates: {
        delivery: deliveryRate,
        bounce: bounceRate,
        complaint: complaintRate,
        open: openRate,
        click: clickRate,
      },
      byTemplate,
      filters: {
        startDate: startDateStr,
        endDate: endDateStr,
      },
    });
  } catch (error) {
    console.error("Error fetching email stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch email stats" },
      { status: 500 }
    );
  }
}
