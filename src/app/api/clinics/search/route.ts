import { NextRequest, NextResponse } from "next/server";
import {
  searchClinicsWithRelevance,
  countSearchClinics,
  detectStateQuery,
} from "@/lib/clinic-queries";

const RESULTS_PER_PAGE = 24;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("limit") ?? String(RESULTS_PER_PAGE), 10) || RESULTS_PER_PAGE)
  );

  if (!q || q.length < 2) {
    return NextResponse.json(
      { results: [], totalResults: 0, totalPages: 0, currentPage: 1 },
      { status: 200 }
    );
  }

  // Check if query is a state name/abbreviation
  const stateMatch = detectStateQuery(q);
  if (stateMatch) {
    return NextResponse.json({
      redirect: `/pain-management/${stateMatch}`,
    });
  }

  const offset = (page - 1) * limit;

  try {
    const [results, totalResults] = await Promise.all([
      searchClinicsWithRelevance(q, limit, offset),
      countSearchClinics(q),
    ]);

    return NextResponse.json(
      {
        results,
        totalResults,
        totalPages: Math.ceil(totalResults / limit),
        currentPage: page,
      },
      {
        headers: {
          // Cache identical search queries at Vercel CDN edge for 60s
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Clinic search API error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
