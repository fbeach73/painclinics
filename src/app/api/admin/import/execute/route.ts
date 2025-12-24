import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import {
  transformClinicRows,
  type RawClinicCSVRow,
  type TransformedClinic,
} from "@/lib/clinic-transformer";
import { parseCSV } from "@/lib/csv-parser";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import type { serviceCategoryEnum } from "@/lib/schema";
import { generateSlug } from "@/lib/slug";
import { fetchFromBlob, deleteFile } from "@/lib/storage";

const BATCH_SIZE = 100;

type DuplicateHandling = "skip" | "update" | "overwrite";

interface ImportOptions {
  blobUrl: string; // Vercel Blob URL for the CSV file
  fileName: string;
  duplicateHandling?: DuplicateHandling;
}

// Type for service category enum values
type ServiceCategory = (typeof serviceCategoryEnum.enumValues)[number];

/**
 * Map a Google Places category to our service category enum
 */
function mapToServiceCategory(categoryName: string): ServiceCategory {
  const lower = categoryName.toLowerCase();

  // Injection-related
  if (lower.includes("injection") || lower.includes("block") || lower.includes("epidural")) {
    return "injection";
  }

  // Procedure-related
  if (
    lower.includes("surgeon") ||
    lower.includes("surgery") ||
    lower.includes("procedure") ||
    lower.includes("interventional")
  ) {
    return "procedure";
  }

  // Physical therapy related
  if (
    lower.includes("physical therap") ||
    lower.includes("rehabilitation") ||
    lower.includes("chiropract") ||
    lower.includes("massage") ||
    lower.includes("acupunctur")
  ) {
    return "physical";
  }

  // Diagnostic related
  if (
    lower.includes("diagnost") ||
    lower.includes("imaging") ||
    lower.includes("x-ray") ||
    lower.includes("mri") ||
    lower.includes("ct scan")
  ) {
    return "diagnostic";
  }

  // Specialized care
  if (
    lower.includes("specialist") ||
    lower.includes("neurol") ||
    lower.includes("orthoped") ||
    lower.includes("rheumatol") ||
    lower.includes("anesthes")
  ) {
    return "specialized";
  }

  // Default to management for general pain clinics
  return "management";
}

/**
 * Map a Google Places category to an icon name
 */
function mapToIconName(categoryName: string): string {
  const lower = categoryName.toLowerCase();

  if (lower.includes("pain")) return "activity";
  if (lower.includes("doctor") || lower.includes("physician")) return "stethoscope";
  if (lower.includes("chiropract")) return "bone";
  if (lower.includes("physical therap")) return "dumbbell";
  if (lower.includes("acupunctur")) return "target";
  if (lower.includes("massage")) return "hand";
  if (lower.includes("hospital") || lower.includes("clinic")) return "building-2";
  if (lower.includes("surgeon") || lower.includes("surgery")) return "scissors";
  if (lower.includes("neurol")) return "brain";
  if (lower.includes("orthoped")) return "bone";

  return "heart-pulse"; // Default icon for medical services
}

/**
 * Create or find services from category names and link them to a clinic
 */
async function linkServicesFromCategories(
  clinicId: string,
  categories: string[]
): Promise<{ created: number; linked: number }> {
  let created = 0;
  let linked = 0;

  for (const categoryName of categories) {
    const slug = generateSlug(categoryName);
    if (!slug) continue;

    try {
      // Try to find existing service
      let service = await db.query.services.findFirst({
        where: eq(schema.services.slug, slug),
      });

      // Create service if it doesn't exist
      if (!service) {
        const result = await db
          .insert(schema.services)
          .values({
            name: categoryName,
            slug,
            iconName: mapToIconName(categoryName),
            category: mapToServiceCategory(categoryName),
            description: null,
            isActive: true,
            displayOrder: 0,
          })
          .returning();
        service = result[0];
        created++;
      }

      if (service) {
        // Check if link already exists
        const existingLink = await db.query.clinicServices.findFirst({
          where: (cs, { and }) =>
            and(
              eq(cs.clinicId, clinicId),
              eq(cs.serviceId, service.id)
            ),
        });

        // Create link if it doesn't exist
        if (!existingLink) {
          await db.insert(schema.clinicServices).values({
            clinicId,
            serviceId: service.id,
            isFeatured: false,
            displayOrder: 0,
          });
          linked++;
        }
      }
    } catch (err) {
      // Log but don't fail the import for service creation errors
      console.error(`Failed to create/link service "${categoryName}":`, err);
    }
  }

  return { created, linked };
}

/**
 * POST /api/admin/import/execute
 * Execute import with Server-Sent Events for progress updates
 */
export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
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

  if (!options.blobUrl) {
    return new Response(
      JSON.stringify({ error: "No blob URL provided" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const duplicateHandling = options.duplicateHandling || "update";
  const blobUrl = options.blobUrl;

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
        // Fetch content from Vercel Blob
        sendEvent("status", { message: "Fetching CSV from storage..." });
        const csvContent = await fetchFromBlob(blobUrl);

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
        let totalServicesCreated = 0;
        let totalServicesLinked = 0;

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

              if (result.status === "inserted" || result.status === "updated") {
                successCount++;
                totalServicesCreated += result.servicesCreated;
                totalServicesLinked += result.servicesLinked;
              } else if (result.status === "skipped") {
                skipCount++;
                errors.push({
                  row: start + i + 2,
                  error: `Skipped "${clinic.title}": ${result.reason}`,
                });
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
            servicesCreated: totalServicesCreated,
            servicesLinked: totalServicesLinked,
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
          servicesCreated: totalServicesCreated,
          servicesLinked: totalServicesLinked,
          errors: errors.slice(0, 50), // Limit errors in response
        });
      } catch (err) {
        sendEvent("error", {
          message:
            err instanceof Error ? err.message : "Import failed unexpectedly",
        });
      } finally {
        // Clean up the temporary blob file
        try {
          await deleteFile(blobUrl);
        } catch (cleanupErr) {
          console.error("Failed to clean up blob:", cleanupErr);
        }
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
 * Also creates services from categories and links them to the clinic
 */
type InsertResult =
  | { status: "inserted"; clinicId: string; servicesCreated: number; servicesLinked: number }
  | { status: "updated"; clinicId: string; servicesCreated: number; servicesLinked: number }
  | { status: "skipped"; reason: string };

async function insertOrUpdateClinic(
  clinic: TransformedClinic,
  batchId: string,
  duplicateHandling: DuplicateHandling
): Promise<InsertResult> {
  // Check for existing clinic by Place ID or permalink
  let existing = null;
  let matchedBy: "placeId" | "permalink" | null = null;

  if (clinic.placeId) {
    existing = await db.query.clinics.findFirst({
      where: eq(schema.clinics.placeId, clinic.placeId),
    });
    if (existing) matchedBy = "placeId";
  }

  if (!existing && clinic.permalink) {
    existing = await db.query.clinics.findFirst({
      where: eq(schema.clinics.permalink, clinic.permalink),
    });
    if (existing) matchedBy = "permalink";
  }

  // Get categories for service linking (stored in checkboxFeatures by transformer)
  const categories = clinic.checkboxFeatures || [];

  if (existing) {
    switch (duplicateHandling) {
      case "skip":
        return {
          status: "skipped",
          reason: matchedBy === "placeId"
            ? `Duplicate place_id: ${clinic.placeId}`
            : `Duplicate permalink: ${clinic.permalink}`
        };

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

        // Link services from categories
        const serviceResult = categories.length > 0
          ? await linkServicesFromCategories(existing.id, categories)
          : { created: 0, linked: 0 };

        return {
          status: "updated",
          clinicId: existing.id,
          servicesCreated: serviceResult.created,
          servicesLinked: serviceResult.linked,
        };
      }

      case "overwrite": {
        // Overwrite entire record
        await db
          .update(schema.clinics)
          .set({ ...clinic, importBatchId: batchId, updatedAt: new Date() })
          .where(eq(schema.clinics.id, existing.id));

        // Link services from categories
        const serviceResult = categories.length > 0
          ? await linkServicesFromCategories(existing.id, categories)
          : { created: 0, linked: 0 };

        return {
          status: "updated",
          clinicId: existing.id,
          servicesCreated: serviceResult.created,
          servicesLinked: serviceResult.linked,
        };
      }

      default:
        return { status: "skipped", reason: "Unknown duplicate handling mode" };
    }
  }

  // Insert new record
  const insertResult = await db
    .insert(schema.clinics)
    .values({
      ...clinic,
      importBatchId: batchId,
    })
    .returning({ id: schema.clinics.id });

  const clinicId = insertResult[0]?.id;
  if (!clinicId) {
    throw new Error("Failed to get clinic ID after insert");
  }

  // Link services from categories
  const serviceResult = categories.length > 0
    ? await linkServicesFromCategories(clinicId, categories)
    : { created: 0, linked: 0 };

  return {
    status: "inserted",
    clinicId,
    servicesCreated: serviceResult.created,
    servicesLinked: serviceResult.linked,
  };
}
