import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getOwnerClinicAnalytics } from "@/lib/analytics/owner-analytics";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

/**
 * GET /api/owner/analytics/detailed?clinicId=xxx&days=30
 * Get detailed analytics for a Premium clinic
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId");
    const daysParam = searchParams.get("days");

    if (!clinicId) {
      return NextResponse.json(
        { error: "clinicId is required" },
        { status: 400 }
      );
    }

    // Parse days parameter (default 30, max 90)
    let days = 30;
    if (daysParam) {
      const parsed = parseInt(daysParam, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 90) {
        days = parsed;
      }
    }

    // Verify user is a clinic owner or admin
    const user = await db.query.user.findFirst({
      where: eq(schema.user.id, session.user.id),
    });

    if (!user || !["admin", "clinic_owner"].includes(user.role)) {
      return NextResponse.json(
        { error: "You must be a clinic owner to access this resource" },
        { status: 403 }
      );
    }

    // Get the clinic
    const clinic = await db.query.clinics.findFirst({
      where: eq(schema.clinics.id, clinicId),
    });

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Verify user owns this clinic (admins can access any clinic)
    if (user.role !== "admin" && clinic.ownerUserId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not own this clinic" },
        { status: 403 }
      );
    }

    // Verify clinic has Premium subscription (admins bypass this check)
    if (user.role !== "admin" && clinic.featuredTier !== "premium") {
      return NextResponse.json(
        { error: "Detailed analytics require a Premium subscription" },
        { status: 403 }
      );
    }

    // Get detailed analytics
    const analytics = await getOwnerClinicAnalytics(clinicId, days);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching detailed clinic analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
