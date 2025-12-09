import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import {
  transformClinicRows,
  type RawClinicCSVRow,
  type TransformedClinic,
} from "@/lib/clinic-transformer";
import { parseCSV } from "@/lib/csv-parser";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

const BATCH_SIZE = 100;

type DuplicateHandling = "skip" | "update" | "overwrite";

interface ImportOptions {
  content: string; // Base64 encoded CSV content
  fileName: string;
  duplicateHandling?: DuplicateHandling;
}

type AdminCheckResult =
  | { error: string; status: number }
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
 * POST /api/admin/import/execute
 * Execute import with Server-Sent Events for progress updates
 */
export async function POST(request: NextRequest) {
  const adminCheck = await checkAdmin();
  if ("error" in adminCheck) {
    return new Response(
      JSON.stringify({ error: adminCheck.error }),
      {
        status: adminCheck.status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { user } = adminCheck;

  let options: ImportOptions;
  try {
    options = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!options.content) {
    return new Response(
      JSON.stringify({ error: "No content provided" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const duplicateHandling = options.duplicateHandling || "update";

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
        // Decode content
        const csvContent = Buffer.from(options.content, "base64").toString(
          "utf-8"
        );

        // Parse CSV
        sendEvent("status", { message: "Parsing CSV data..." });
        const rows = parseCSV<RawClinicCSVRow>(csvContent);
        const totalRows = rows.length;

        sendEvent("status", {
          message: `Found ${totalRows} rows to process`,
          totalRows,
        });

        // Create import batch
        const batchResult = await db
          .insert(schema.importBatches)
          .values({
            fileName: options.fileName || "Uploaded file",
            status: "processing",
            totalRecords: totalRows,
            successCount: 0,
            errorCount: 0,
            skipCount: 0,
            errors: [],
            importedBy: user.id,
          })
          .returning();

        const batch = batchResult[0];
        if (!batch) {
          sendEvent("error", { message: "Failed to create import batch" });
          controller.close();
          return;
        }

        sendEvent("batch", { batchId: batch.id });

        // Transform rows
        sendEvent("status", { message: "Transforming clinic data..." });
        const { clinics: transformed, skipped } = transformClinicRows(rows);

        const errors: Array<{ row?: number; error: string }> = [];
        let successCount = 0;
        let skipCount = skipped.length;
        let errorCount = 0;

        // Log skipped rows
        for (const rowIndex of skipped) {
          errors.push({
            row: rowIndex + 2,
            error:
              "Missing required fields (title, city, state, postal code, or coordinates)",
          });
        }

        sendEvent("status", {
          message: `Transformed ${transformed.length} valid clinics, ${skipped.length} skipped`,
          validClinics: transformed.length,
          skippedRows: skipped.length,
        });

        // Process in batches
        const totalBatches = Math.ceil(transformed.length / BATCH_SIZE);

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          const start = batchIndex * BATCH_SIZE;
          const end = Math.min(start + BATCH_SIZE, transformed.length);
          const batchClinics = transformed.slice(start, end);

          sendEvent("progress", {
            currentBatch: batchIndex + 1,
            totalBatches,
            processed: start,
            total: transformed.length,
            percentage: Math.round((start / transformed.length) * 100),
          });

          for (let i = 0; i < batchClinics.length; i++) {
            const clinic = batchClinics[i];
            if (!clinic) continue;

            try {
              const result = await insertOrUpdateClinic(
                clinic,
                batch.id,
                duplicateHandling
              );

              if (result === "inserted" || result === "updated") {
                successCount++;
              } else if (result === "skipped") {
                skipCount++;
              }
            } catch (err) {
              errorCount++;
              errors.push({
                row: start + i + 2,
                error: `Failed to insert clinic "${clinic.title}": ${
                  err instanceof Error ? err.message : "Unknown error"
                }`,
              });
            }
          }

          // Progress update
          sendEvent("progress", {
            currentBatch: batchIndex + 1,
            totalBatches,
            processed: end,
            total: transformed.length,
            percentage: Math.round((end / transformed.length) * 100),
            successCount,
            errorCount,
            skipCount,
          });
        }

        // Update batch record
        const finalStatus =
          errorCount > 0 && successCount === 0 ? "failed" : "completed";

        await db
          .update(schema.importBatches)
          .set({
            status: finalStatus,
            successCount,
            errorCount,
            skipCount,
            errors: errors.length > 0 ? errors : null,
            completedAt: new Date(),
          })
          .where(eq(schema.importBatches.id, batch.id));

        // Final completion event
        sendEvent("complete", {
          batchId: batch.id,
          status: finalStatus,
          totalRecords: totalRows,
          successCount,
          errorCount,
          skipCount,
          errors: errors.slice(0, 50), // Limit errors in response
        });
      } catch (err) {
        sendEvent("error", {
          message:
            err instanceof Error ? err.message : "Import failed unexpectedly",
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

/**
 * Insert or update a clinic record based on duplicate handling strategy
 */
async function insertOrUpdateClinic(
  clinic: TransformedClinic,
  batchId: string,
  duplicateHandling: DuplicateHandling
): Promise<"inserted" | "updated" | "skipped"> {
  // Check for existing clinic by Place ID or permalink
  let existing = null;

  if (clinic.placeId) {
    existing = await db.query.clinics.findFirst({
      where: eq(schema.clinics.placeId, clinic.placeId),
    });
  }

  if (!existing && clinic.permalink) {
    existing = await db.query.clinics.findFirst({
      where: eq(schema.clinics.permalink, clinic.permalink),
    });
  }

  if (existing) {
    switch (duplicateHandling) {
      case "skip":
        return "skipped";

      case "update": {
        // Update only non-null fields
        const updateData: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(clinic)) {
          if (value !== null && value !== undefined) {
            updateData[key] = value;
          }
        }
        await db
          .update(schema.clinics)
          .set({ ...updateData, importBatchId: batchId, updatedAt: new Date() })
          .where(eq(schema.clinics.id, existing.id));
        return "updated";
      }

      case "overwrite":
        // Overwrite entire record
        await db
          .update(schema.clinics)
          .set({ ...clinic, importBatchId: batchId, updatedAt: new Date() })
          .where(eq(schema.clinics.id, existing.id));
        return "updated";

      default:
        return "skipped";
    }
  }

  // Insert new record
  await db.insert(schema.clinics).values({
    ...clinic,
    importBatchId: batchId,
  });

  return "inserted";
}
