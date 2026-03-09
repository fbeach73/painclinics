import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { list } from "@vercel/blob";
import { upload, deleteFile } from "@/lib/storage";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
]);

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// GET - List all media files from Vercel Blob
export async function GET(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get("cursor") ?? undefined;
    const prefix = searchParams.get("prefix") ?? "media/";

    const listOptions: Parameters<typeof list>[0] = {
      prefix,
      limit: 100,
    };
    if (cursor) listOptions.cursor = cursor;

    const result = await list(listOptions);

    return NextResponse.json({
      blobs: result.blobs.map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      })),
      hasMore: result.hasMore,
      cursor: result.cursor,
    });
  } catch (error) {
    console.error("Failed to list media:", error);
    return NextResponse.json(
      { error: "Failed to list media files" },
      { status: 500 }
    );
  }
}

// POST - Upload a new media file
export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error: `File type "${file.type}" not allowed. Use JPEG, PNG, GIF, WebP, AVIF, or SVG.`,
      },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10MB." },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await upload(buffer, file.name, "media", {
      maxSize: MAX_SIZE,
      allowedTypes: Array.from(ALLOWED_TYPES),
    });

    return NextResponse.json({
      url: result.url,
      pathname: result.pathname,
    });
  } catch (err) {
    console.error("Media upload failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a media file
export async function DELETE(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  try {
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    await deleteFile(url);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Media delete failed:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
