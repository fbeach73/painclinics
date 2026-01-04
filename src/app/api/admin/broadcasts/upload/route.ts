import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { upload } from "@/lib/storage";

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types for broadcast attachments
const ALLOWED_TYPES = [
  // Documents
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// Map MIME types to extensions
const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

/**
 * POST /api/admin/broadcasts/upload
 * Upload an attachment for broadcast emails
 *
 * FormData: { file: File }
 * Returns: { url: string, filename: string, size: number }
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
          error: `Invalid file type "${file.type}". Allowed: PDF, images, Word docs, CSV, TXT`,
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

    // Generate a unique filename with proper extension
    const ext = MIME_TO_EXT[file.type] || "";
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    // Sanitize original filename for use in the final name
    const originalName = file.name
      .replace(/\.[^/.]+$/, "") // Remove extension
      .replace(/[^a-zA-Z0-9-_]/g, "-") // Replace special chars
      .substring(0, 50); // Limit length

    const filename = `${timestamp}-${random}-${originalName}${ext}`;

    // Upload to storage in the "broadcasts" folder
    const result = await upload(buffer, filename, "broadcasts", {
      maxSize: MAX_FILE_SIZE,
    });

    return NextResponse.json({
      url: result.url,
      filename: file.name, // Return original filename for display
      size: file.size,
    });
  } catch (error) {
    console.error("Error uploading broadcast attachment:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload file" },
      { status: 500 }
    );
  }
}
