import { headers } from "next/headers";
import { eq, desc, sql, and, gte, inArray } from "drizzle-orm";
import { estimateOptimizationCost } from "@/lib/ai";
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

interface ClinicFilters {
  states?: string[];
  minReviewCount?: number;
  excludeOptimized?: boolean;
}

/**
 * GET /api/admin/optimize
 * List optimization batches and stats
 */
export async function GET() {
  const adminCheck = await checkAdmin();
  if ("error" in adminCheck) {
    return new Response(JSON.stringify({ error: adminCheck.error }), {
      status: adminCheck.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get recent batches
    const batches = await db.query.optimizationBatches.findMany({
      orderBy: [desc(schema.optimizationBatches.createdAt)],
      limit: 20,
    });

    // Get total clinics
    const totalClinicsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.clinics);
    const totalClinics = totalClinicsResult[0]?.count || 0;

    // Get clinics with content
    const clinicsWithContentResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.clinics)
      .where(sql`${schema.clinics.content} IS NOT NULL AND ${schema.clinics.content} != ''`);
    const clinicsWithContent = clinicsWithContentResult[0]?.count || 0;

    // Get clinics already optimized (have content versions applied)
    const optimizedResult = await db
      .select({ count: sql<number>`count(DISTINCT ${schema.contentVersions.clinicId})` })
      .from(schema.contentVersions)
      .where(eq(schema.contentVersions.status, "applied"));
    const optimizedClinics = optimizedResult[0]?.count || 0;

    // Get pending reviews count
    const pendingReviewsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.contentVersions)
      .where(eq(schema.contentVersions.status, "pending"));
    const pendingReviews = pendingReviewsResult[0]?.count || 0;

    // Get total cost spent
    const costResult = await db
      .select({ totalCost: sql<number>`COALESCE(SUM(${schema.optimizationBatches.estimatedCost}), 0)` })
      .from(schema.optimizationBatches)
      .where(eq(schema.optimizationBatches.status, "completed"));
    const totalCostSpent = costResult[0]?.totalCost || 0;

    return new Response(
      JSON.stringify({
        batches,
        stats: {
          totalClinics,
          clinicsWithContent,
          optimizedClinics,
          remainingToOptimize: clinicsWithContent - optimizedClinics,
          pendingReviews,
          totalCostSpent,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching optimization data:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch optimization data" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * POST /api/admin/optimize
 * Create a new optimization batch
 */
export async function POST(request: Request) {
  const adminCheck = await checkAdmin();
  if ("error" in adminCheck) {
    return new Response(JSON.stringify({ error: adminCheck.error }), {
      status: adminCheck.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { user } = adminCheck;

  let body: {
    name?: string;
    clinicFilters?: ClinicFilters;
    options?: {
      batchSize?: number;
      reviewFrequency?: number;
      targetWordCount?: number;
      includeKeywords?: boolean;
      generateFaq?: boolean;
      faqCount?: number;
    };
  };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const filters = body.clinicFilters || {};
  const options = body.options || {};

  try {
    // Build query to count matching clinics
    const conditions = [];

    // Must have content
    conditions.push(
      sql`${schema.clinics.content} IS NOT NULL AND ${schema.clinics.content} != ''`
    );

    // Filter by states
    if (filters.states && filters.states.length > 0) {
      conditions.push(inArray(schema.clinics.state, filters.states));
    }

    // Filter by minimum review count
    if (filters.minReviewCount && filters.minReviewCount > 0) {
      conditions.push(gte(schema.clinics.reviewCount, filters.minReviewCount));
    }

    // Exclude already optimized
    if (filters.excludeOptimized) {
      // Subquery to find clinics with applied content versions
      const optimizedClinicIds = db
        .select({ clinicId: schema.contentVersions.clinicId })
        .from(schema.contentVersions)
        .where(eq(schema.contentVersions.status, "applied"));

      conditions.push(
        sql`${schema.clinics.id} NOT IN (${optimizedClinicIds})`
      );
    }

    // Count matching clinics
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.clinics)
      .where(and(...conditions));

    const totalClinics = countResult[0]?.count || 0;

    if (totalClinics === 0) {
      return new Response(
        JSON.stringify({ error: "No clinics match the specified filters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Estimate cost
    const costEstimate = estimateOptimizationCost(
      totalClinics,
      600, // Average content length
      {
        targetWordCount: options.targetWordCount || 400,
        model: "anthropic/claude-sonnet-4",
      }
    );

    // Create batch
    const batchResult = await db
      .insert(schema.optimizationBatches)
      .values({
        name: body.name || `Optimization ${new Date().toISOString().split("T")[0]}`,
        status: "pending",
        batchSize: options.batchSize || 50,
        reviewFrequency: options.reviewFrequency || 250,
        targetWordCount: options.targetWordCount || 400,
        includeKeywords: options.includeKeywords !== false,
        generateFaq: options.generateFaq !== false,
        faqCount: options.faqCount || 4,
        clinicFilters: filters,
        totalClinics,
        estimatedCost: costEstimate.total,
        startedBy: user.id,
      })
      .returning();

    const batch = batchResult[0];

    return new Response(
      JSON.stringify({
        batch,
        costEstimate: {
          perClinic: costEstimate.perClinic,
          total: costEstimate.total,
          model: costEstimate.model,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating optimization batch:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create optimization batch" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
