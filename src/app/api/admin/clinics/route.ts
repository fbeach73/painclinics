import { NextRequest, NextResponse } from "next/server";
import { sql, or, ilike, eq, and, asc, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";

/**
 * Search and filter clinics for admin listing.
 * Supports filtering by search query, state, city, and featured status.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim();
    const state = searchParams.get("state")?.trim().toUpperCase();
    const city = searchParams.get("city")?.trim();
    const featured = searchParams.get("featured");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where conditions
    const conditions = [];

    // Search query filter
    if (query && query.length >= 2) {
      const searchPattern = `%${query}%`;
      conditions.push(
        or(
          ilike(clinics.title, searchPattern),
          ilike(clinics.city, searchPattern),
          ilike(clinics.stateAbbreviation, searchPattern),
          ilike(clinics.phone, searchPattern)
        )
      );
    }

    // State filter
    if (state) {
      conditions.push(eq(clinics.stateAbbreviation, state));
    }

    // City filter
    if (city) {
      conditions.push(ilike(clinics.city, city));
    }

    // Featured filter
    if (featured === "true") {
      conditions.push(eq(clinics.isFeatured, true));
    } else if (featured === "false") {
      conditions.push(
        or(eq(clinics.isFeatured, false), sql`${clinics.isFeatured} IS NULL`)
      );
    }

    // Build the query
    const whereCondition =
      conditions.length > 0 ? and(...conditions) : undefined;

    // Get clinics with filters
    const results = await db
      .select({
        id: clinics.id,
        title: clinics.title,
        city: clinics.city,
        stateAbbreviation: clinics.stateAbbreviation,
        permalink: clinics.permalink,
        rating: clinics.rating,
        reviewCount: clinics.reviewCount,
        isFeatured: clinics.isFeatured,
        featuredTier: clinics.featuredTier,
      })
      .from(clinics)
      .where(whereCondition)
      .orderBy(
        desc(sql`CASE WHEN ${clinics.isFeatured} = true THEN 0 ELSE 1 END`),
        asc(clinics.stateAbbreviation),
        asc(clinics.city),
        asc(clinics.title)
      )
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(clinics)
      .where(whereCondition);
    const totalCount = countResult[0]?.count ?? 0;

    return NextResponse.json({
      clinics: results,
      totalCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Admin clinics search error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clinics" },
      { status: 500 }
    );
  }
}
