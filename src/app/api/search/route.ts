import { NextRequest, NextResponse } from "next/server";
import { sql, or, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";

/**
 * Search clinics by name, city, or state.
 * Returns up to 10 results for dropdown autocomplete.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 3) {
      return NextResponse.json({ results: [] });
    }

    const searchPattern = `%${query}%`;

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
      })
      .from(clinics)
      .where(
        or(
          ilike(clinics.title, searchPattern),
          ilike(clinics.city, searchPattern),
          ilike(clinics.stateAbbreviation, searchPattern)
        )
      )
      .orderBy(
        sql`CASE WHEN ${clinics.isFeatured} = true THEN 0 ELSE 1 END`,
        sql`${clinics.rating} DESC NULLS LAST`
      )
      .limit(10);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}
