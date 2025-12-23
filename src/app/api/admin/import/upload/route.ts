import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi } from "@/lib/admin-auth";
import { type RawClinicCSVRow } from "@/lib/clinic-transformer";
import { previewCSV, validateCSVHeaders } from "@/lib/csv-parser";

/**
 * Required CSV headers for clinic data
 * Supports WordPress format OR Outscraper/Google Places format
 */
const WORDPRESS_HEADERS = [
  "Title",
  "City",
  "State",
  "Postal Code",
  "Map Latitude",
  "Map Longitude",
];

const OUTSCRAPER_HEADERS = [
  "name",
  "coordinates",
  "detailed_address",
];

/**
 * POST /api/admin/import/upload
 * Upload a CSV file, validate headers, and return preview
 */
export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
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

    // Check file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
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

    // Validate headers - accept either WordPress OR Outscraper format
    const wpValidation = validateCSVHeaders(content, WORDPRESS_HEADERS);
    const outsValidation = validateCSVHeaders(content, OUTSCRAPER_HEADERS);

    const validationErrors: string[] = [];
    const isWordPressFormat = wpValidation.valid;
    const isOutscraperFormat = outsValidation.valid;

    if (!isWordPressFormat && !isOutscraperFormat) {
      validationErrors.push(
        `CSV must have either WordPress headers (${WORDPRESS_HEADERS.join(", ")}) ` +
        `OR Outscraper headers (${OUTSCRAPER_HEADERS.join(", ")})`
      );
    }

    // Get preview data
    const { preview, totalRows, headers: allHeaders } = previewCSV<RawClinicCSVRow>(
      content,
      10
    );

    // Validate preview rows for data quality based on detected format
    const dataWarnings: string[] = [];
    let missingCoordinatesCount = 0;
    let missingTitleCount = 0;
    let missingAddressCount = 0;

    for (const row of preview) {
      if (isOutscraperFormat) {
        // Outscraper format validation
        if (!row.coordinates) {
          missingCoordinatesCount++;
        }
        if (!row.name) {
          missingTitleCount++;
        }
        if (!row.detailed_address && !row.address) {
          missingAddressCount++;
        }
      } else {
        // WordPress format validation
        if (!row["Map Latitude"] || !row["Map Longitude"]) {
          missingCoordinatesCount++;
        }
        if (!row.Title) {
          missingTitleCount++;
        }
        if (!row.City || !row.State) {
          missingAddressCount++;
        }
      }
    }

    if (missingCoordinatesCount > 0) {
      dataWarnings.push(
        `${missingCoordinatesCount} rows in preview missing coordinates`
      );
    }
    if (missingTitleCount > 0) {
      dataWarnings.push(`${missingTitleCount} rows in preview missing name/title`);
    }
    if (missingAddressCount > 0) {
      dataWarnings.push(
        `${missingAddressCount} rows in preview missing address info`
      );
    }

    // Add format detection info
    const formatInfo = isOutscraperFormat ? "Outscraper/Google Places" : "WordPress";

    // Store the file content temporarily using a hash or session
    // For simplicity, we'll return the content back encoded
    // In production, you might want to store this in a temp file or cache

    return NextResponse.json({
      fileName: file.name,
      fileSize: file.size,
      totalRows,
      headers: allHeaders,
      format: formatInfo,
      // Return raw preview data with original column names for display
      preview: preview.map((row) => {
        const rawRow: Record<string, string> = {};
        for (const header of allHeaders) {
          rawRow[header] = row[header as keyof typeof row] as string || "";
        }
        return rawRow;
      }),
      validation: {
        valid: (isWordPressFormat || isOutscraperFormat) && validationErrors.length === 0,
        errors: validationErrors,
        warnings: dataWarnings,
        missingHeaders: isWordPressFormat ? [] : (isOutscraperFormat ? [] : [...wpValidation.missing, ...outsValidation.missing]),
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
