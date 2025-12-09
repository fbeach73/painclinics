import { headers } from "next/headers";
import { eq, and, sql, inArray } from "drizzle-orm";
import {
  optimizeClinicContent,
  type ClinicData,
  type OptimizationConfig,
} from "@/lib/ai";
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
 * POST /api/admin/optimize/[batchId]/execute
 * Start or resume batch processing with SSE progress
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const adminCheck = await checkAdmin();
  if ("error" in adminCheck) {
    return new Response(JSON.stringify({ error: adminCheck.error }), {
      status: adminCheck.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { batchId } = await params;

  // Get batch details
  const batch = await db.query.optimizationBatches.findFirst({
    where: eq(schema.optimizationBatches.id, batchId),
  });

  if (!batch) {
    return new Response(JSON.stringify({ error: "Batch not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Can only execute pending, paused, or awaiting_review batches
  if (!["pending", "paused", "awaiting_review"].includes(batch.status || "")) {
    return new Response(
      JSON.stringify({
        error: `Cannot execute batch with status: ${batch.status}`,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        // Update batch status to processing
        await db
          .update(schema.optimizationBatches)
          .set({
            status: "processing",
            startedAt: batch.startedAt || new Date(),
          })
          .where(eq(schema.optimizationBatches.id, batchId));

        sendEvent("status", { message: "Starting optimization...", batchId });

        // Build query conditions from filters
        const filters = (batch.clinicFilters as ClinicFilters) || {};
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
          conditions.push(
            sql`${schema.clinics.reviewCount} >= ${filters.minReviewCount}`
          );
        }

        // Exclude already optimized
        if (filters.excludeOptimized) {
          const optimizedClinicIds = db
            .select({ clinicId: schema.contentVersions.clinicId })
            .from(schema.contentVersions)
            .where(eq(schema.contentVersions.status, "applied"));

          conditions.push(
            sql`${schema.clinics.id} NOT IN (${optimizedClinicIds})`
          );
        }

        // Query clinics
        const clinics = await db
          .select()
          .from(schema.clinics)
          .where(and(...conditions))
          .offset(batch.currentOffset || 0)
          .limit(batch.totalClinics || 10000);

        const totalToProcess = clinics.length;
        const batchSize = batch.batchSize || 50;
        const reviewFrequency = batch.reviewFrequency || 250;

        sendEvent("status", {
          message: `Found ${totalToProcess} clinics to process`,
          totalClinics: totalToProcess,
          startingFrom: batch.currentOffset || 0,
        });

        const config: OptimizationConfig = {
          targetWordCount: batch.targetWordCount || 400,
          faqCount: batch.faqCount || 4,
          includeKeywords: batch.includeKeywords !== false,
          model: batch.aiModel || "anthropic/claude-sonnet-4",
          promptVersion: batch.promptVersion || "v1.0",
        };

        let processedCount = batch.processedCount || 0;
        let successCount = batch.successCount || 0;
        let errorCount = batch.errorCount || 0;
        let totalCost = batch.estimatedCost || 0;
        let totalInputTokens = batch.totalInputTokens || 0;
        let totalOutputTokens = batch.totalOutputTokens || 0;
        let pendingReviewCount = batch.pendingReviewCount || 0;

        const errors: Array<{ clinicId: string; error: string }> =
          (batch.errors as Array<{ clinicId: string; error: string }>) || [];

        // Process clinics in batches
        for (let i = 0; i < totalToProcess; i++) {
          const clinic = clinics[i];
          if (!clinic) continue;

          // Check if we need to pause for review
          if (
            processedCount > 0 &&
            processedCount % reviewFrequency === 0 &&
            pendingReviewCount > 0
          ) {
            // Pause for review
            await db
              .update(schema.optimizationBatches)
              .set({
                status: "awaiting_review",
                currentOffset: (batch.currentOffset || 0) + i,
                processedCount,
                successCount,
                errorCount,
                pendingReviewCount,
                totalInputTokens,
                totalOutputTokens,
                estimatedCost: totalCost,
                errors: errors.length > 0 ? errors : null,
                pausedAt: new Date(),
              })
              .where(eq(schema.optimizationBatches.id, batchId));

            sendEvent("review_pause", {
              message: `Paused for review after ${processedCount} clinics`,
              processedCount,
              pendingReviewCount,
              successCount,
              errorCount,
            });

            controller.close();
            return;
          }

          // Send progress update
          sendEvent("clinic_progress", {
            clinicId: clinic.id,
            clinicTitle: clinic.title,
            clinicCity: clinic.city,
            clinicState: clinic.state,
            current: i + 1,
            total: totalToProcess,
            percentage: Math.round(((i + 1) / totalToProcess) * 100),
          });

          // Prepare clinic data for optimization
          const clinicData: ClinicData = {
            id: clinic.id,
            title: clinic.title,
            city: clinic.city,
            state: clinic.state,
            streetAddress: clinic.streetAddress,
            phone: clinic.phone,
            phones: clinic.phones,
            rating: clinic.rating,
            reviewCount: clinic.reviewCount,
            reviewKeywords: clinic.reviewKeywords as Array<{
              keyword: string;
              count: number;
            }> | null,
            content: clinic.content,
          };

          // Optimize content
          const result = await optimizeClinicContent(clinicData, config);

          processedCount++;

          if (result.success && result.optimizedContent) {
            successCount++;

            // Create content version record
            await db.insert(schema.contentVersions).values({
              clinicId: clinic.id,
              version: 1, // TODO: increment based on existing versions
              originalContent: result.originalContent,
              optimizedContent: result.optimizedContent,
              keywordsUsed: result.keywordsIntegrated,
              faqGenerated: result.faqs,
              changesSummary: result.changesSummary,
              wordCountBefore: result.wordCountBefore,
              wordCountAfter: result.wordCountAfter,
              status: "pending",
              optimizationBatchId: batchId,
              aiModel: result.aiModel,
              promptVersion: result.promptVersion,
              inputTokens: result.inputTokens,
              outputTokens: result.outputTokens,
              cost: result.cost,
              validationPassed: result.validation?.passed,
              validationWarnings: result.validation?.warnings,
              validationErrors: result.validation?.errors,
              requiresManualReview: result.validation?.requiresManualReview,
              optimizedAt: new Date(),
            });

            pendingReviewCount++;
            totalInputTokens += result.inputTokens || 0;
            totalOutputTokens += result.outputTokens || 0;
            totalCost += result.cost || 0;

            sendEvent("clinic_success", {
              clinicId: clinic.id,
              clinicTitle: clinic.title,
              wordCountBefore: result.wordCountBefore,
              wordCountAfter: result.wordCountAfter,
              keywordsUsed: result.keywordsIntegrated?.length || 0,
              faqsGenerated: result.faqs?.length || 0,
              validationPassed: result.validation?.passed,
              cost: result.cost,
            });
          } else {
            errorCount++;
            errors.push({
              clinicId: clinic.id,
              error: result.error || "Unknown error",
            });

            sendEvent("clinic_error", {
              clinicId: clinic.id,
              clinicTitle: clinic.title,
              error: result.error,
              errorType: result.errorType,
            });
          }

          // Update batch progress periodically
          if (processedCount % batchSize === 0) {
            await db
              .update(schema.optimizationBatches)
              .set({
                currentOffset: (batch.currentOffset || 0) + i + 1,
                processedCount,
                successCount,
                errorCount,
                pendingReviewCount,
                totalInputTokens,
                totalOutputTokens,
                estimatedCost: totalCost,
                errors: errors.length > 0 ? errors.slice(-100) : null, // Keep last 100 errors
              })
              .where(eq(schema.optimizationBatches.id, batchId));

            sendEvent("batch_progress", {
              processedCount,
              successCount,
              errorCount,
              pendingReviewCount,
              totalCost,
              percentage: Math.round((processedCount / totalToProcess) * 100),
            });
          }
        }

        // Batch complete
        const finalStatus =
          errorCount > 0 && successCount === 0 ? "failed" : "completed";

        await db
          .update(schema.optimizationBatches)
          .set({
            status: finalStatus,
            currentOffset: (batch.currentOffset || 0) + totalToProcess,
            processedCount,
            successCount,
            errorCount,
            pendingReviewCount,
            totalInputTokens,
            totalOutputTokens,
            estimatedCost: totalCost,
            errors: errors.length > 0 ? errors.slice(-100) : null,
            completedAt: new Date(),
          })
          .where(eq(schema.optimizationBatches.id, batchId));

        sendEvent("complete", {
          batchId,
          status: finalStatus,
          processedCount,
          successCount,
          errorCount,
          pendingReviewCount,
          totalCost,
          totalInputTokens,
          totalOutputTokens,
        });
      } catch (error) {
        console.error("Batch execution error:", error);

        // Update batch status to failed
        await db
          .update(schema.optimizationBatches)
          .set({
            status: "failed",
            errors: [
              {
                error:
                  error instanceof Error
                    ? error.message
                    : "Unknown execution error",
              },
            ],
          })
          .where(eq(schema.optimizationBatches.id, batchId));

        sendEvent("error", {
          message:
            error instanceof Error
              ? error.message
              : "Batch execution failed unexpectedly",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
