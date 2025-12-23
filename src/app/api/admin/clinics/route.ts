import { NextRequest, NextResponse } from "next/server";
import { sql, or, ilike, eq, and, asc, desc, isNotNull, isNull } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";

type SortColumn = "title" | "createdAt" | "enhanced" | "rating" | "reviewCount";
type SortDirection = "asc" | "desc";

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
    const status = searchParams.get("status")?.trim();
    const enhanced = searchParams.get("enhanced");
    const sortBy = (searchParams.get("sortBy") || "createdAt") as SortColumn;
    const sortDir = (searchParams.get("sortDir") || "desc") as SortDirection;
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

    // Status filter
    if (status && ["draft", "published", "deleted"].includes(status)) {
      conditions.push(eq(clinics.status, status as "draft" | "published" | "deleted"));
    }

    // Enhanced filter
    if (enhanced === "true") {
      conditions.push(
        and(
          isNotNull(clinics.newPostContent),
          sql`${clinics.newPostContent} != ''`
        )
      );
    } else if (enhanced === "false") {
      conditions.push(
        or(
          isNull(clinics.newPostContent),
          sql`${clinics.newPostContent} = ''`
        )
      );
    }

    // Build the query
    const whereCondition =
      conditions.length > 0 ? and(...conditions) : undefined;

    // Build sort order
    const sortFn = sortDir === "asc" ? asc : desc;
    let orderByClause;
    switch (sortBy) {
      case "createdAt":
        orderByClause = sortFn(clinics.createdAt);
        break;
      case "enhanced":
        orderByClause = sortFn(sql`CASE WHEN ${clinics.newPostContent} IS NOT NULL AND ${clinics.newPostContent} != '' THEN 1 ELSE 0 END`);
        break;
      case "rating":
        orderByClause = sortFn(clinics.rating);
        break;
      case "reviewCount":
        orderByClause = sortFn(clinics.reviewCount);
        break;
      case "title":
      default:
        orderByClause = sortFn(clinics.title);
        break;
    }

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
        status: clinics.status,
        createdAt: clinics.createdAt,
        hasEnhancedContent: sql<boolean>`CASE WHEN ${clinics.newPostContent} IS NOT NULL AND ${clinics.newPostContent} != '' THEN true ELSE false END`,
      })
      .from(clinics)
      .where(whereCondition)
      .orderBy(orderByClause)
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

/**
 * Generate a permalink from clinic title, city, and state
 */
function generatePermalink(title: string, city: string, stateAbbrev: string): string {
  const slug = `${title}-${city}-${stateAbbrev}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  return `pain-management/${slug}`;
}

/**
 * POST /api/admin/clinics
 * Create a new clinic
 */
export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ["title", "city", "state", "postalCode", "mapLatitude", "mapLongitude"];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate data types
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title must be a non-empty string" },
        { status: 400 }
      );
    }

    if (typeof body.mapLatitude !== "number" || typeof body.mapLongitude !== "number") {
      return NextResponse.json(
        { error: "Coordinates must be numbers" },
        { status: 400 }
      );
    }

    // Generate state abbreviation if not provided
    const stateAbbrev = body.stateAbbreviation || body.state.substring(0, 2).toUpperCase();

    // Generate permalink
    const permalink = body.permalink || generatePermalink(body.title, body.city, stateAbbrev);

    // Check for duplicate permalink
    const existingClinic = await db
      .select({ id: clinics.id })
      .from(clinics)
      .where(eq(clinics.permalink, permalink))
      .limit(1);

    if (existingClinic.length > 0) {
      return NextResponse.json(
        { error: "A clinic with this permalink already exists" },
        { status: 409 }
      );
    }

    // Build clinic data
    const clinicData = {
      title: body.title.trim(),
      city: body.city.trim(),
      state: body.state.trim(),
      stateAbbreviation: stateAbbrev,
      postalCode: body.postalCode.trim(),
      mapLatitude: body.mapLatitude,
      mapLongitude: body.mapLongitude,
      permalink,
      streetAddress: body.streetAddress?.trim() || null,
      phone: body.phone?.trim() || null,
      website: body.website?.trim() || null,
      clinicType: body.clinicType?.trim() || null,
      placeId: body.placeId?.trim() || null,
      detailedAddress: body.detailedAddress?.trim() || null,
      content: body.content || null,
      newPostContent: body.newPostContent || null,
      imageUrl: body.imageUrl || null,
      rating: body.rating || null,
      reviewCount: body.reviewCount || null,
      clinicHours: body.clinicHours || null,
      googleListingLink: body.googleListingLink || null,
    };

    // Insert the clinic
    const [created] = await db.insert(clinics).values(clinicData).returning();

    if (!created) {
      return NextResponse.json(
        { error: "Failed to create clinic" },
        { status: 500 }
      );
    }

    return NextResponse.json({ clinic: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating clinic:", error);
    return NextResponse.json(
      { error: "Failed to create clinic" },
      { status: 500 }
    );
  }
}
