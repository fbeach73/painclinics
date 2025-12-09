import { NextResponse } from "next/server";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { eq, sql } from "drizzle-orm";
import { checkAdminApi } from "@/lib/admin-auth";
import {
  transformClinicRows,
  type RawClinicCSVRow,
  type TransformedClinic,
} from "@/lib/clinic-transformer";
import { parseCSV } from "@/lib/csv-parser";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

const DATA_DIR = "specs/pain-clinic-directory/data/clinics";
const BATCH_SIZE = 100;

/**
 * GET /api/admin/import/batch
 * Get batch import status and available files
 */
export async function GET() {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  try {
    // Get available CSV files
    const files = await readdir(join(process.cwd(), DATA_DIR));
    const csvFiles = files.filter((f) => f.endsWith(".csv")).sort();

    // Get recent import batches
    const batches = await db.query.importBatches.findMany({
      orderBy: (batches, { desc }) => [desc(batches.createdAt)],
      limit: 10,
    });

    // Get clinic count
    const clinicCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.clinics);
    const clinicCount = clinicCountResult[0]?.count || 0;

    return NextResponse.json({
      files: csvFiles,
      fileCount: csvFiles.length,
      dataDirectory: DATA_DIR,
      recentBatches: batches,
      totalClinics: clinicCount,
    });
  } catch (error) {
    console.error("Error getting batch status:", error);
    return NextResponse.json(
      { error: "Failed to get batch status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/import/batch
 * Start batch import of all CSV files in the data directory
 */
export async function POST() {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  const { user } = adminCheck;

  try {
    // Get all CSV files
    const files = await readdir(join(process.cwd(), DATA_DIR));
    const csvFiles = files.filter((f) => f.endsWith(".csv")).sort();

    if (csvFiles.length === 0) {
      return NextResponse.json(
        { error: "No CSV files found in data directory" },
        { status: 400 }
      );
    }

    // Create import batch record
    const batchResult = await db
      .insert(schema.importBatches)
      .values({
        fileName: `Batch import: ${csvFiles.length} files`,
        status: "processing",
        totalRecords: 0,
        successCount: 0,
        errorCount: 0,
        skipCount: 0,
        errors: [],
        importedBy: user.id,
      })
      .returning();

    const batch = batchResult[0];
    if (!batch) {
      return NextResponse.json(
        { error: "Failed to create import batch" },
        { status: 500 }
      );
    }

    const errors: Array<{ file: string; row?: number; error: string }> = [];
    let totalRecords = 0;
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Process each file
    for (const fileName of csvFiles) {
      try {
        const filePath = join(process.cwd(), DATA_DIR, fileName);
        const content = await readFile(filePath, "utf-8");
        const rows = parseCSV<RawClinicCSVRow>(content);

        totalRecords += rows.length;

        // Transform rows
        const { clinics: transformed, skipped } = transformClinicRows(rows);
        skipCount += skipped.length;

        // Log skipped rows
        for (const rowIndex of skipped) {
          errors.push({
            file: fileName,
            row: rowIndex + 2, // +2 for header row and 0-indexing
            error: "Missing required fields (title, city, state, postal code, or coordinates)",
          });
        }

        // Insert in batches
        for (let i = 0; i < transformed.length; i += BATCH_SIZE) {
          const batchClinics = transformed.slice(i, i + BATCH_SIZE);

          for (const clinic of batchClinics) {
            try {
              await insertOrUpdateClinic(clinic, batch.id);
              successCount++;
            } catch (err) {
              errorCount++;
              errors.push({
                file: fileName,
                error: `Failed to insert clinic "${clinic.title}": ${err instanceof Error ? err.message : "Unknown error"}`,
              });
            }
          }
        }
      } catch (err) {
        errorCount++;
        errors.push({
          file: fileName,
          error: `Failed to process file: ${err instanceof Error ? err.message : "Unknown error"}`,
        });
      }
    }

    // Update batch with final counts
    await db
      .update(schema.importBatches)
      .set({
        status: errorCount > 0 && successCount === 0 ? "failed" : "completed",
        totalRecords,
        successCount,
        errorCount,
        skipCount,
        errors: errors.length > 0 ? errors : null,
        completedAt: new Date(),
      })
      .where(eq(schema.importBatches.id, batch.id));

    return NextResponse.json({
      batchId: batch.id,
      status: errorCount > 0 && successCount === 0 ? "failed" : "completed",
      totalRecords,
      successCount,
      errorCount,
      skipCount,
      errors: errors.slice(0, 100), // Limit errors in response
    });
  } catch (error) {
    console.error("Batch import error:", error);
    return NextResponse.json(
      { error: "Batch import failed" },
      { status: 500 }
    );
  }
}

/**
 * Insert or update a clinic record
 * Uses Place ID for duplicate detection
 */
async function insertOrUpdateClinic(
  clinic: TransformedClinic,
  batchId: string
): Promise<void> {
  // Check for existing clinic by Place ID (if available) or permalink
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

  const clinicData = {
    ...clinic,
    importBatchId: batchId,
    updatedAt: new Date(),
  };

  if (existing) {
    // Update existing record
    await db
      .update(schema.clinics)
      .set(clinicData)
      .where(eq(schema.clinics.id, existing.id));
  } else {
    // Insert new record
    await db.insert(schema.clinics).values(clinicData);
  }
}
