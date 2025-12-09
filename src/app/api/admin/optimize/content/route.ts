import { headers } from "next/headers";
import { eq, desc, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

type AdminCheckResult =
  | { error: string; status: 401 | 403 }
  | { session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>; user: typeof schema.user.$inferSelect };

/**
 * Helper to check admin status for API routes
 */
async function checkAdmin(): Promise<AdminCheckResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return { error: "Unauthorized", status: 401 };
  }

  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, session.user.id),
  });

  if (!user || user.role !== "admin") {
    return { error: "Forbidden - Admin access required", status: 403 };
  }

  return { session, user };
}

/**
 * GET /api/admin/optimize/content
 * List content versions with filters
 */
export async function GET(request: Request) {
  const adminCheck = await checkAdmin();
  if ("error" in adminCheck) {
    return new Response(JSON.stringify({ error: adminCheck.error }), {
      status: adminCheck.status,
      headers: { "Content-Type": "application/json" },
    });
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

    return new Response(
      JSON.stringify({
        versions,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + versions.length < totalCount,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching content versions:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch content versions" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
