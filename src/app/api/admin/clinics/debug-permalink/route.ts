import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";

/**
 * GET /api/admin/clinics/debug-permalink?slug=clinic-name-st-12345
 * Debug endpoint to check why a clinic might not be appearing at its URL
 */
export async function GET(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { error: "Missing 'slug' query parameter" },
      { status: 400 }
    );
  }

  // Build the full permalink path as the query would
  const permalinkPath = `pain-management/${slug}`;

  // Try to find clinic with exact match (case-insensitive)
  const exactMatch = await db
    .select({
      id: clinics.id,
      title: clinics.title,
      permalink: clinics.permalink,
      status: clinics.status,
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
      postalCode: clinics.postalCode,
      createdAt: clinics.createdAt,
      updatedAt: clinics.updatedAt,
    })
    .from(clinics)
    .where(sql`LOWER(${clinics.permalink}) = LOWER(${permalinkPath})`)
    .limit(1);

  // Also try to find similar permalinks (for debugging mismatches)
  const similarPermalinks = await db
    .select({
      id: clinics.id,
      title: clinics.title,
      permalink: clinics.permalink,
      status: clinics.status,
    })
    .from(clinics)
    .where(sql`${clinics.permalink} ILIKE ${`%${slug.slice(0, 20)}%`}`)
    .limit(5);

  const clinic = exactMatch[0];

  if (!clinic) {
    return NextResponse.json({
      found: false,
      searchedFor: permalinkPath,
      message: "No clinic found with this permalink",
      similarPermalinks: similarPermalinks.map((c) => ({
        id: c.id,
        title: c.title,
        permalink: c.permalink,
        status: c.status,
      })),
      debug: {
        queryPath: permalinkPath,
        note: "The clinic either doesn't exist or has a different permalink format",
      },
    });
  }

  // Check why it might not be appearing
  const issues: string[] = [];

  if (clinic.status !== "published") {
    issues.push(`Status is "${clinic.status}" - must be "published" to appear on public site`);
  }

  if (clinic.permalink.toLowerCase() !== permalinkPath.toLowerCase()) {
    issues.push(`Permalink case mismatch: stored as "${clinic.permalink}" but searched for "${permalinkPath}"`);
  }

  return NextResponse.json({
    found: true,
    clinic: {
      id: clinic.id,
      title: clinic.title,
      permalink: clinic.permalink,
      status: clinic.status,
      city: clinic.city,
      stateAbbreviation: clinic.stateAbbreviation,
      postalCode: clinic.postalCode,
      createdAt: clinic.createdAt,
      updatedAt: clinic.updatedAt,
    },
    searchedFor: permalinkPath,
    wouldAppearOnPublicSite: clinic.status === "published",
    issues: issues.length > 0 ? issues : ["No issues found - clinic should be visible"],
    expectedUrl: `https://www.painclinics.com/${clinic.permalink}`,
    debug: {
      statusIsPublished: clinic.status === "published",
      permalinkMatchesQuery: clinic.permalink.toLowerCase() === permalinkPath.toLowerCase(),
    },
  });
}
