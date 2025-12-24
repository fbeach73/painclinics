import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getClinicAnalytics } from "@/lib/analytics/queries";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

/**
 * GET /api/owner/analytics?clinicId=xxx - Get analytics for a specific clinic
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clinicId = searchParams.get("clinicId");

    if (!clinicId) {
      return NextResponse.json(
        { error: "clinicId is required" },
        { status: 400 }
      );
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

    // Verify user owns this clinic (admins can access any clinic)
    if (user.role !== "admin") {
      const clinic = await db.query.clinics.findFirst({
        where: and(
          eq(schema.clinics.id, clinicId),
          eq(schema.clinics.ownerUserId, session.user.id)
        ),
      });

      if (!clinic) {
        return NextResponse.json(
          { error: "You do not own this clinic" },
          { status: 403 }
        );
      }
    }

    // Get analytics for this clinic
    const analytics = await getClinicAnalytics(clinicId);

    return NextResponse.json({
      totalViews: analytics.overview.clinicViews,
      uniqueVisitors: analytics.overview.uniqueVisitors,
      referrers: analytics.referrers,
      viewsOverTime: analytics.viewsOverTime.map((d) => ({
        date: d.date,
        views: d.views,
      })),
    });
  } catch (error) {
    console.error("Error fetching clinic analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
