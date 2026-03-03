import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { sql, and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";

/**
 * Common directory terms that match nearly every listing.
 * These are excluded from autocomplete filtering to avoid returning all 5000+ clinics.
 */
const COMMON_TERMS = new Set([
  "pain", "clinic", "clinics", "management", "center", "medical",
  "health", "healthcare", "wellness", "institute", "specialist",
  "specialists", "doctor", "physicians", "care", "treatment",
]);

/**
 * Search clinics by name, city, or state.
 * Returns up to 10 results for dropdown autocomplete.
 * Results cached for 1 hour per query to reduce DB wakeups.
 *
 * Uses relevance scoring to prioritize:
 * 1. Exact title/city matches
 * 2. Starts-with matches
 * 3. Word-boundary matches
 * 4. Substring matches (lowest priority)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim()?.toLowerCase();

    if (!query || query.length < 3) {
      return NextResponse.json({ results: [] });
    }

    const results = await unstable_cache(
      async () => {
        // Split into terms and filter
        const terms = query.split(/\s+/).filter((t) => t.length >= 2);
        if (terms.length === 0) return [];

        const meaningfulTerms = terms.filter((t) => !COMMON_TERMS.has(t));

        // If only common terms, return empty — too broad for autocomplete
        if (meaningfulTerms.length === 0) return [];

        // Build relevance score from meaningful terms
        const termScores = meaningfulTerms.map((term) => {
          const pattern = `%${term}%`;
          const startsPattern = `${term}%`;
          const wordBoundary = `% ${term}%`;
          return sql`(
            CASE WHEN LOWER(${clinics.title}) = ${term} THEN 100
                 WHEN LOWER(${clinics.title}) LIKE ${startsPattern} THEN 60
                 WHEN LOWER(${clinics.title}) LIKE ${wordBoundary} THEN 40
                 WHEN LOWER(${clinics.title}) LIKE ${pattern} THEN 10
                 ELSE 0 END
            + CASE WHEN LOWER(${clinics.city}) = ${term} THEN 80
                   WHEN LOWER(${clinics.city}) LIKE ${startsPattern} THEN 50
                   WHEN LOWER(${clinics.city}) LIKE ${wordBoundary} THEN 30
                   WHEN LOWER(${clinics.city}) LIKE ${pattern} THEN 10
                   ELSE 0 END
            + CASE WHEN ${clinics.postalCode} = ${term} THEN 30
                   WHEN ${clinics.postalCode} LIKE ${startsPattern} THEN 15
                   ELSE 0 END
            + CASE WHEN UPPER(${clinics.stateAbbreviation}) = UPPER(${term}) THEN 25 ELSE 0 END
          )`;
        });

        // Phrase bonus for multi-word queries
        const fullPhrase = meaningfulTerms.join(' ');
        const phraseBonus = meaningfulTerms.length >= 2
          ? sql`CASE WHEN LOWER(${clinics.title}) LIKE ${`%${fullPhrase}%`} THEN 200
                 WHEN LOWER(${clinics.city}) LIKE ${`%${fullPhrase}%`} THEN 100
                 ELSE 0 END`
          : sql`0`;

        const relevanceScore = sql<number>`(${sql.join(termScores, sql` + `)} + ${phraseBonus})`;

        // WHERE: all meaningful terms must match somewhere
        const termMatches = meaningfulTerms.map((term) => {
          const pattern = `%${term}%`;
          return sql`(
            LOWER(${clinics.title}) LIKE ${pattern}
            OR LOWER(${clinics.city}) LIKE ${pattern}
            OR ${clinics.postalCode} LIKE ${pattern}
            OR UPPER(${clinics.stateAbbreviation}) = UPPER(${term})
          )`;
        });

        const matchCondition = sql`(${sql.join(termMatches, sql` AND `)})`;

        return db
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
          .where(and(
            matchCondition,
            eq(clinics.status, "published"),
            sql`${relevanceScore} >= 15`
          ))
          .orderBy(sql`${relevanceScore} DESC`, sql`${clinics.rating} DESC NULLS LAST`)
          .limit(10);
      },
      [`search:${query}`],
      { revalidate: 3600, tags: ["search"] }
    )();

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 500 });
  }
}
