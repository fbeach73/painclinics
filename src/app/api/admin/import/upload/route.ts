import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { type RawClinicCSVRow } from "@/lib/clinic-transformer";
import { previewCSV, validateCSVHeaders } from "@/lib/csv-parser";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

/**
 * Required CSV headers for clinic data
 */
const REQUIRED_HEADERS = [
  "Title",
  "City",
  "State",
  "Postal Code",
  "Map Latitude",
  "Map Longitude",
];

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
 * POST /api/admin/import/upload
 * Upload a CSV file, validate headers, and return preview
 */
export async function POST(request: NextRequest) {
  const adminCheck = await checkAdmin();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must be a CSV" },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();

    if (!content.trim()) {
      return NextResponse.json(
        { error: "File is empty" },
        { status: 400 }
      );
    }

    // Validate headers
    const headerValidation = validateCSVHeaders(content, REQUIRED_HEADERS);

    const validationErrors: string[] = [];

    if (!headerValidation.valid) {
      validationErrors.push(
        `Missing required headers: ${headerValidation.missing.join(", ")}`
      );
    }

    // Get preview data
    const { preview, totalRows, headers: allHeaders } = previewCSV<RawClinicCSVRow>(
      content,
      10
    );

    // Validate preview rows for data quality
    const dataWarnings: string[] = [];
    let missingCoordinatesCount = 0;
    let missingTitleCount = 0;
    let missingCityStateCount = 0;

    for (const row of preview) {
      if (!row["Map Latitude"] || !row["Map Longitude"]) {
        missingCoordinatesCount++;
      }
      if (!row.Title) {
        missingTitleCount++;
      }
      if (!row.City || !row.State) {
        missingCityStateCount++;
      }
    }

    if (missingCoordinatesCount > 0) {
      dataWarnings.push(
        `${missingCoordinatesCount} rows in preview missing coordinates`
      );
    }
    if (missingTitleCount > 0) {
      dataWarnings.push(`${missingTitleCount} rows in preview missing title`);
    }
    if (missingCityStateCount > 0) {
      dataWarnings.push(
        `${missingCityStateCount} rows in preview missing city/state`
      );
    }

    // Store the file content temporarily using a hash or session
    // For simplicity, we'll return the content back encoded
    // In production, you might want to store this in a temp file or cache

    return NextResponse.json({
      fileName: file.name,
      fileSize: file.size,
      totalRows,
      headers: allHeaders,
      preview: preview.map((row) => ({
        title: row.Title || "(No title)",
        city: row.City || "(No city)",
        state: row.State || "(No state)",
        postalCode: row["Postal Code"] || "(No postal code)",
        latitude: row["Map Latitude"] || "(No latitude)",
        longitude: row["Map Longitude"] || "(No longitude)",
        placeId: row["Place ID"] || null,
        rating: row.Rating || null,
        reviews: row.Reviews || null,
      })),
      validation: {
        valid: headerValidation.valid && validationErrors.length === 0,
        errors: validationErrors,
        warnings: dataWarnings,
        missingHeaders: headerValidation.missing,
      },
      // Include raw content (base64 encoded) for subsequent import
      content: Buffer.from(content).toString("base64"),
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process uploaded file" },
      { status: 500 }
    );
  }
}
