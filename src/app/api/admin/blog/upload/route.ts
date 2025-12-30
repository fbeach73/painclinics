import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import {
  processImage,
  generateImageFilename,
} from "@/lib/blog/image-processing";
import { upload } from "@/lib/storage";

// Maximum file size: 10MB (before processing)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed image MIME types
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

/**
 * POST /api/admin/blog/upload
 * Upload and process an image for blog posts
 *
 * FormData: { file: File }
 * Returns: { url: string }
 */
export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
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

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process the image (resize and convert to WebP)
    // Skip processing for SVGs
    let processedBuffer: Buffer;
    let filename: string;

    if (file.type === "image/svg+xml") {
      // Don't process SVGs, keep them as-is
      processedBuffer = buffer;
      filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.svg`;
    } else {
      processedBuffer = await processImage(buffer);
      filename = generateImageFilename(file.name);
    }

    // Upload to storage
    const result = await upload(processedBuffer, filename, "blog");

    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
