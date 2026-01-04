import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { getTargetClinics } from "@/lib/broadcast/clinic-targeting";
import type { TargetAudience, TargetFilters } from "@/lib/broadcast/broadcast-queries";

/**
 * GET /api/admin/broadcasts/preview-recipients
 * Preview a sample of recipients based on targeting options
 *
 * Query params: audience, states, tiers, excludeUnsubscribed, manualEmails, limit
 * Returns: { recipients: [{ clinicName, email }], total: number }
 */
export async function GET(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const { searchParams } = new URL(request.url);
    const audience = (searchParams.get("audience") || "all_with_email") as TargetAudience;
    const limit = Math.min(parseInt(searchParams.get("limit") || "5"), 10); // Max 10 preview

    // Build filters
    const filters: TargetFilters = {
      excludeUnsubscribed: searchParams.get("excludeUnsubscribed") === "true",
    };

    const statesParam = searchParams.get("states");
    if (statesParam) {
      filters.states = statesParam.split(",").filter(Boolean);
    }

    const tiersParam = searchParams.get("tiers");
    if (tiersParam) {
      filters.tiers = tiersParam.split(",").filter(Boolean) as ("none" | "basic" | "premium")[];
    }

    const manualEmailsParam = searchParams.get("manualEmails");
    if (manualEmailsParam) {
      filters.manualEmails = manualEmailsParam.split(",").filter(Boolean);
    }

    // Get all target clinics
    const allClinics = await getTargetClinics({ audience, filters });

    // Return sample + total count
    const sample = allClinics.slice(0, limit).map((c) => ({
      clinicName: c.clinicName,
      email: c.email,
      city: c.city,
      state: c.stateAbbreviation || c.state,
    }));

    return NextResponse.json({
      recipients: sample,
      total: allClinics.length,
      showing: sample.length,
    });
  } catch (error) {
    console.error("Error fetching recipient preview:", error);
    return NextResponse.json(
      { error: "Failed to fetch recipient preview" },
      { status: 500 }
    );
  }
}
