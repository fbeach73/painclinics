import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import type { TargetAudience, TargetFilters } from "@/lib/broadcast/broadcast-queries";
import { previewRecipientCount } from "@/lib/broadcast/broadcast-service";

/**
 * GET /api/admin/broadcasts/preview-count
 * Get recipient count for given targeting filters
 *
 * Query params: audience, states (comma-separated), tiers (comma-separated), excludeUnsubscribed
 */
export async function GET(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const { searchParams } = new URL(request.url);
    const audience = (searchParams.get("audience") || "all_with_email") as TargetAudience;
    const statesParam = searchParams.get("states");
    const tiersParam = searchParams.get("tiers");
    const excludeUnsubscribed = searchParams.get("excludeUnsubscribed") === "true";

    // Validate audience
    const validAudiences: TargetAudience[] = [
      "all_with_email",
      "featured_only",
      "by_state",
      "by_tier",
      "custom",
    ];
    if (!validAudiences.includes(audience)) {
      return NextResponse.json(
        { error: "Invalid audience" },
        { status: 400 }
      );
    }

    // Build filters
    const filters: TargetFilters = {
      excludeUnsubscribed,
    };

    if (statesParam) {
      filters.states = statesParam.split(",").filter(Boolean);
    }

    if (tiersParam) {
      filters.tiers = tiersParam.split(",").filter(Boolean);
    }

    const count = await previewRecipientCount(audience, filters);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error getting recipient count:", error);
    return NextResponse.json(
      { error: "Failed to get recipient count" },
      { status: 500 }
    );
  }
}
