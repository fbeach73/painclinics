import { NextResponse } from "next/server";
import { and, isNull, or, sql } from "drizzle-orm";
import { checkAdminApi } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

interface VerificationCheck {
  name: string;
  description: string;
  passed: boolean;
  count: number;
  details?: unknown;
}

/**
 * GET /api/admin/import/verify
 * Run verification checks on imported data
 */
export async function GET() {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  try {
    const checks: VerificationCheck[] = [];

    // 1. Total clinic count
    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.clinics);
    const totalClinics = totalResult[0]?.count || 0;

    checks.push({
      name: "Total Clinics",
      description: "Total number of clinics in database",
      passed: totalClinics > 0,
      count: totalClinics,
    });

    // 2. Check for duplicate permalinks
    const duplicatePermalinks = await db
      .select({
        permalink: schema.clinics.permalink,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.clinics)
      .groupBy(schema.clinics.permalink)
      .having(sql`count(*) > 1`);

    checks.push({
      name: "Unique Permalinks",
      description: "All clinic permalinks should be unique",
      passed: duplicatePermalinks.length === 0,
      count: duplicatePermalinks.length,
      details:
        duplicatePermalinks.length > 0
          ? duplicatePermalinks.slice(0, 10)
          : undefined,
    });

    // 3. Check for duplicate Place IDs (where not null)
    const duplicatePlaceIds = await db
      .select({
        placeId: schema.clinics.placeId,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.clinics)
      .where(sql`place_id IS NOT NULL`)
      .groupBy(schema.clinics.placeId)
      .having(sql`count(*) > 1`);

    checks.push({
      name: "Unique Place IDs",
      description: "All Place IDs (where present) should be unique",
      passed: duplicatePlaceIds.length === 0,
      count: duplicatePlaceIds.length,
      details:
        duplicatePlaceIds.length > 0
          ? duplicatePlaceIds.slice(0, 10)
          : undefined,
    });

    // 4. Check for missing coordinates
    const missingCoords = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.clinics)
      .where(
        or(
          isNull(schema.clinics.mapLatitude),
          isNull(schema.clinics.mapLongitude),
          sql`map_latitude = 0`,
          sql`map_longitude = 0`
        )
      );

    checks.push({
      name: "Valid Coordinates",
      description: "All clinics should have valid coordinates",
      passed: (missingCoords[0]?.count || 0) === 0,
      count: missingCoords[0]?.count || 0,
    });

    // 5. Check for clinics with ratings
    const clinicsWithRatings = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.clinics)
      .where(
        and(
          sql`rating IS NOT NULL`,
          sql`rating > 0`,
          sql`rating <= 5`
        )
      );

    checks.push({
      name: "Clinics with Ratings",
      description: "Clinics that have valid ratings (1-5)",
      passed: true, // Info check, always passes
      count: clinicsWithRatings[0]?.count || 0,
    });

    // 6. Clinics by state distribution
    const clinicsByState = await db
      .select({
        state: schema.clinics.state,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.clinics)
      .groupBy(schema.clinics.state)
      .orderBy(sql`count(*) DESC`);

    checks.push({
      name: "State Coverage",
      description: "Distribution of clinics across states",
      passed: clinicsByState.length > 0,
      count: clinicsByState.length,
      details: clinicsByState.slice(0, 20), // Top 20 states
    });

    // 7. Average rating
    const avgRating = await db
      .select({
        avg: sql<number>`round(avg(rating)::numeric, 2)`,
        totalReviews: sql<number>`sum(review_count)::int`,
      })
      .from(schema.clinics)
      .where(sql`rating IS NOT NULL`);

    checks.push({
      name: "Average Rating",
      description: "Average rating across all clinics",
      passed: true,
      count: 0,
      details: {
        averageRating: avgRating[0]?.avg || null,
        totalReviews: avgRating[0]?.totalReviews || 0,
      },
    });

    // 8. Check clinics with images
    const clinicsWithImages = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.clinics)
      .where(sql`image_url IS NOT NULL AND image_url != ''`);

    checks.push({
      name: "Clinics with Images",
      description: "Clinics that have an image URL",
      passed: true,
      count: clinicsWithImages[0]?.count || 0,
    });

    // 9. Check clinics with hours
    const clinicsWithHours = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.clinics)
      .where(sql`clinic_hours IS NOT NULL`);

    checks.push({
      name: "Clinics with Hours",
      description: "Clinics that have business hours",
      passed: true,
      count: clinicsWithHours[0]?.count || 0,
    });

    // 10. Check clinics with reviews
    const clinicsWithReviews = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.clinics)
      .where(sql`featured_reviews IS NOT NULL`);

    checks.push({
      name: "Clinics with Featured Reviews",
      description: "Clinics that have featured reviews",
      passed: true,
      count: clinicsWithReviews[0]?.count || 0,
    });

    // Calculate overall pass rate
    const criticalChecks = checks.filter(
      (c) =>
        c.name === "Unique Permalinks" ||
        c.name === "Unique Place IDs" ||
        c.name === "Valid Coordinates"
    );
    const allCriticalPassed = criticalChecks.every((c) => c.passed);

    return NextResponse.json({
      summary: {
        totalClinics,
        allCriticalPassed,
        checksRun: checks.length,
        checksPassed: checks.filter((c) => c.passed).length,
      },
      checks,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Failed to run verification checks" },
      { status: 500 }
    );
  }
}
