import { NextRequest, NextResponse } from "next/server";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { upload } from "@/lib/storage";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
]);

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/admin/ads/upload
 * Upload an image for ad creatives. Returns the public URL.
 * Accepts multipart/form-data with a single "file" field.
 */
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
      { error: `File type "${file.type}" not allowed. Use JPEG, PNG, GIF, WebP, AVIF, or SVG.` },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 5MB." },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await upload(buffer, file.name, "ads", {
      maxSize: MAX_SIZE,
      allowedTypes: Array.from(ALLOWED_TYPES),
    });

    return NextResponse.json({ url: result.url });
  } catch (err) {
    console.error("Ad image upload failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
