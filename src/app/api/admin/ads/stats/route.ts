import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import {
  getAdOverviewStats,
  getAdStatsOverTime,
  getTopCreatives,
  type DateRange,
} from "@/lib/ad-stats-queries";

const VALID_RANGES: DateRange[] = ["today", "7d", "30d", "all"];

export async function GET(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) return adminErrorResponse(adminCheck);

  const rawRange = request.nextUrl.searchParams.get("range") ?? "7d";
  const range: DateRange = VALID_RANGES.includes(rawRange as DateRange)
    ? (rawRange as DateRange)
    : "7d";

  const [overview, overTime, topCreatives] = await Promise.all([
    getAdOverviewStats(range),
    getAdStatsOverTime(range),
    getTopCreatives(range),
  ]);

  return NextResponse.json({ overview, overTime, topCreatives });
}
