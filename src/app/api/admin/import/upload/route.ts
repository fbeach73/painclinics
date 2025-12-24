import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi } from "@/lib/admin-auth";
import { type RawClinicCSVRow } from "@/lib/clinic-transformer";
import { previewCSV, validateCSVHeaders } from "@/lib/csv-parser";

/**
 * Required CSV headers for clinic data
 * Supports WordPress format, Outscraper/Google Places format, OR Scraper format
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

// Scraper format: has name, place_id, main_category, address (coordinates now available too)
const SCRAPER_HEADERS = [
  "name",
  "place_id",
  "main_category",
  "address",
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

    // Validate headers - accept WordPress, Outscraper, OR Scraper format
    const wpValidation = validateCSVHeaders(content, WORDPRESS_HEADERS);
    const outsValidation = validateCSVHeaders(content, OUTSCRAPER_HEADERS);
    const scraperValidation = validateCSVHeaders(content, SCRAPER_HEADERS);

    const validationErrors: string[] = [];
    const isWordPressFormat = wpValidation.valid;
    // Scraper format: check FIRST because it has unique identifiers (place_id, main_category)
    // Scraper format may also have coordinates, so check for unique identifiers first
    const isScraperFormat = scraperValidation.valid;
    // Outscraper format: has coordinates but NOT scraper identifiers
    const isOutscraperFormat = outsValidation.valid && !isScraperFormat;

    if (!isWordPressFormat && !isOutscraperFormat && !isScraperFormat) {
      validationErrors.push(
        `CSV must have WordPress headers (${WORDPRESS_HEADERS.join(", ")}), ` +
        `Outscraper headers (${OUTSCRAPER_HEADERS.join(", ")}), ` +
        `OR Scraper headers (${SCRAPER_HEADERS.join(", ")})`
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
      if (isScraperFormat) {
        // Scraper format validation - coordinates are parsed from address, not a separate field
        if (!row.name) {
          missingTitleCount++;
        }
        if (!row.address) {
          missingAddressCount++;
        }
        // No coordinates field in scraper format - this is expected
      } else if (isOutscraperFormat) {
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

    // Only warn about missing coordinates for formats that require them
    if (missingCoordinatesCount > 0 && !isScraperFormat) {
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
    const formatInfo = isScraperFormat
      ? "Scraper"
      : isOutscraperFormat
        ? "Outscraper/Google Places"
        : "WordPress";

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
        valid: (isWordPressFormat || isOutscraperFormat || isScraperFormat) && validationErrors.length === 0,
        errors: validationErrors,
        warnings: dataWarnings,
        missingHeaders: isWordPressFormat || isOutscraperFormat || isScraperFormat
          ? []
          : [...wpValidation.missing, ...outsValidation.missing, ...scraperValidation.missing],
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
