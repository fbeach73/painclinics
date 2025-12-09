import { NextResponse } from "next/server";
import { eq, desc, and, sql } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

/**
 * GET /api/admin/optimize/content
 * List content versions with filters
 */
export async function GET(request: Request) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "pending";
  const batchId = searchParams.get("batchId");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    // Build conditions
    const conditions = [];

    if (status !== "all") {
      conditions.push(eq(schema.contentVersions.status, status));
    }

    if (batchId) {
      conditions.push(eq(schema.contentVersions.optimizationBatchId, batchId));
    }

    // Get content versions with clinic info
    const versions = await db
      .select({
        id: schema.contentVersions.id,
        clinicId: schema.contentVersions.clinicId,
        clinicTitle: schema.clinics.title,
        clinicCity: schema.clinics.city,
        clinicState: schema.clinics.state,
        version: schema.contentVersions.version,
        status: schema.contentVersions.status,
        wordCountBefore: schema.contentVersions.wordCountBefore,
        wordCountAfter: schema.contentVersions.wordCountAfter,
        keywordsUsed: schema.contentVersions.keywordsUsed,
        faqGenerated: schema.contentVersions.faqGenerated,
        cost: schema.contentVersions.cost,
        validationPassed: schema.contentVersions.validationPassed,
        validationWarnings: schema.contentVersions.validationWarnings,
        validationErrors: schema.contentVersions.validationErrors,
        requiresManualReview: schema.contentVersions.requiresManualReview,
        optimizationBatchId: schema.contentVersions.optimizationBatchId,
        createdAt: schema.contentVersions.createdAt,
        optimizedAt: schema.contentVersions.optimizedAt,
      })
      .from(schema.contentVersions)
      .innerJoin(
        schema.clinics,
        eq(schema.contentVersions.clinicId, schema.clinics.id)
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schema.contentVersions.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.contentVersions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = countResult[0]?.count || 0;

    return NextResponse.json({
      versions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + versions.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching content versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch content versions" },
      { status: 500 }
    );
  }
}
