import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { checkAdminApi } from "@/lib/admin-auth";

/**
 * POST /api/admin/import/upload-token
 * Generate a client upload token for Vercel Blob
 * This allows the client to upload directly to Blob storage
 */
export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return NextResponse.json(
      { error: adminCheck.error },
      { status: adminCheck.status }
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Validate it's a CSV file
        if (!pathname.endsWith(".csv")) {
          throw new Error("Only CSV files are allowed");
        }

        return {
          allowedContentTypes: ["text/csv", "application/csv", "text/plain"],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB
          tokenPayload: JSON.stringify({
            uploadedBy: adminCheck.user.id,
          }),
        };
      },
      onUploadCompleted: async () => {
        // Upload completed - no action needed here
        // The blob URL is returned to the client directly
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Blob upload token error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
