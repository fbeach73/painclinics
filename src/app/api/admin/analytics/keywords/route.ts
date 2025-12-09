import { NextRequest, NextResponse } from "next/server";
import { and, sql, ilike } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";

// Sentiment word lists for classification
const POSITIVE_KEYWORDS = [
  "friendly",
  "professional",
  "helpful",
  "caring",
  "excellent",
  "great",
  "amazing",
  "wonderful",
  "recommend",
  "best",
  "knowledgeable",
  "thorough",
  "compassionate",
  "patient",
  "attentive",
  "kind",
  "efficient",
  "clean",
  "comfortable",
  "responsive",
];

const NEGATIVE_KEYWORDS = [
  "rude",
  "unprofessional",
  "wait",
  "waiting",
  "slow",
  "disappointed",
  "terrible",
  "worst",
  "avoid",
  "never",
  "dismissive",
  "rushed",
  "billing",
  "insurance",
  "pain",
  "horrible",
  "awful",
  "poor",
  "bad",
  "rude",
];

interface KeywordData {
  keyword: string;
  count: number;
}

interface KeywordAggregation {
  keyword: string;
  totalCount: number;
  clinicCount: number;
  avgPerClinic: number;
  sentiment: "positive" | "neutral" | "negative";
}

function classifySentiment(
  keyword: string
): "positive" | "neutral" | "negative" {
  const lowerKeyword = keyword.toLowerCase();
  if (POSITIVE_KEYWORDS.some((pk) => lowerKeyword.includes(pk))) {
    return "positive";
  }
  if (NEGATIVE_KEYWORDS.some((nk) => lowerKeyword.includes(nk))) {
    return "negative";
  }
  return "neutral";
}

/**
 * GET /api/admin/analytics/keywords
 * Get aggregated review keywords with sentiment analysis
 *
 * Query params:
 * - state: Filter by state abbreviation (e.g., "CA")
 * - city: Filter by city slug (e.g., "los-angeles")
 * - limit: Max keywords to return (default 50)
 */
export async function GET(request: NextRequest) {
  // Check admin authentication
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const searchParams = request.nextUrl.searchParams;
  const stateFilter = searchParams.get("state");
  const cityFilter = searchParams.get("city");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

  try {
    // Build query conditions
    const conditions = [];

    // Only include clinics with reviewKeywords
    conditions.push(sql`${clinics.reviewKeywords} IS NOT NULL`);

    if (stateFilter) {
      conditions.push(
        sql`UPPER(${clinics.stateAbbreviation}) = UPPER(${stateFilter})`
      );
    }

    if (cityFilter) {
      // Convert slug back to searchable city name
      const cityName = cityFilter.replace(/-/g, " ");
      conditions.push(ilike(clinics.city, cityName));
    }

    // Query clinics with reviewKeywords
    const clinicsWithKeywords = await db
      .select({
        id: clinics.id,
        reviewKeywords: clinics.reviewKeywords,
      })
      .from(clinics)
      .where(and(...conditions));

    // Aggregate keywords across all clinics
    const keywordMap = new Map<
      string,
      { totalCount: number; clinicCount: number }
    >();

    for (const clinic of clinicsWithKeywords) {
      const keywords = clinic.reviewKeywords as KeywordData[] | null;
      if (!keywords || !Array.isArray(keywords)) continue;

      const seenInClinic = new Set<string>();

      for (const kw of keywords) {
        if (!kw.keyword || typeof kw.count !== "number") continue;

        const normalizedKeyword = kw.keyword.toLowerCase().trim();
        if (!normalizedKeyword) continue;

        const existing = keywordMap.get(normalizedKeyword) || {
          totalCount: 0,
          clinicCount: 0,
        };
        existing.totalCount += kw.count;

        // Count each clinic only once per keyword
        if (!seenInClinic.has(normalizedKeyword)) {
          existing.clinicCount += 1;
          seenInClinic.add(normalizedKeyword);
        }

        keywordMap.set(normalizedKeyword, existing);
      }
    }

    // Convert to array and sort by total count
    const aggregatedKeywords: KeywordAggregation[] = Array.from(
      keywordMap.entries()
    )
      .map(([keyword, data]) => ({
        keyword,
        totalCount: data.totalCount,
        clinicCount: data.clinicCount,
        avgPerClinic:
          data.clinicCount > 0
            ? Math.round((data.totalCount / data.clinicCount) * 10) / 10
            : 0,
        sentiment: classifySentiment(keyword),
      }))
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, limit);

    // Calculate summary statistics
    const sentimentCounts = aggregatedKeywords.reduce(
      (acc, kw) => {
        acc[kw.sentiment]++;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );

    return NextResponse.json({
      keywords: aggregatedKeywords,
      summary: {
        totalKeywords: keywordMap.size,
        clinicsAnalyzed: clinicsWithKeywords.length,
        sentiment: sentimentCounts,
      },
      filters: {
        state: stateFilter,
        city: cityFilter,
        limit,
      },
    });
  } catch (error) {
    console.error("Error aggregating keywords:", error);
    return NextResponse.json(
      { error: "Failed to aggregate keywords" },
      { status: 500 }
    );
  }
}
