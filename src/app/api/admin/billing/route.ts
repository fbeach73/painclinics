import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";

const NEON_API_BASE = "https://console.neon.tech/api/v2";

export async function GET(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const apiKey = process.env.NEON_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "NEON_API_KEY environment variable is not set" },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const days = Math.min(Number(searchParams.get("days") || "30"), 60);
  const granularity = searchParams.get("granularity") || "daily";

  // Calculate date range
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);

  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
    granularity,
    metrics:
      "compute_unit_seconds,root_branch_bytes_month,child_branch_bytes_month,instant_restore_bytes_month,public_network_transfer_bytes",
  });

  // Add org_id if set
  const orgId = process.env.NEON_ORG_ID;
  if (orgId) {
    params.set("org_id", orgId);
  }

  // Add project_id filter if set (single project)
  const projectId = process.env.NEON_PROJECT_ID;
  if (projectId) {
    params.set("project_ids", projectId);
  }

  try {
    const res = await fetch(
      `${NEON_API_BASE}/consumption_history/v2/projects?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Neon API error:", res.status, text);
      return NextResponse.json(
        { error: `Neon API returned ${res.status}: ${text}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch Neon billing data:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing data from Neon" },
      { status: 500 }
    );
  }
}
