import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { upload, deleteFile } from "@/lib/storage";

/**
 * Photo limits based on subscription tier
 */
const PHOTO_LIMITS: Record<string, number> = {
  none: 0,
  basic: 5,
  premium: 50, // "unlimited" but with reasonable cap
};

/**
 * Get the photo limit for a clinic based on its subscription tier
 */
function getPhotoLimit(featuredTier: string | null): number {
  return PHOTO_LIMITS[featuredTier || "none"] || 0;
}

type VerifyResult =
  | { error: string; status: number }
  | { clinic: NonNullable<Awaited<ReturnType<typeof db.query.clinics.findFirst>>>; user: NonNullable<Awaited<ReturnType<typeof db.query.user.findFirst>>> };

/**
 * Verify clinic ownership and get clinic data
 */
async function verifyOwnershipAndGetClinic(clinicId: string, userId: string): Promise<VerifyResult> {
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, userId),
  });

  if (!user || !["admin", "clinic_owner"].includes(user.role)) {
    return { error: "You must be a clinic owner to access this resource", status: 403 };
  }

  // Get clinic
  let clinic;
  if (user.role === "admin") {
    clinic = await db.query.clinics.findFirst({
      where: eq(schema.clinics.id, clinicId),
    });
  } else {
    clinic = await db.query.clinics.findFirst({
      where: and(
        eq(schema.clinics.id, clinicId),
        eq(schema.clinics.ownerUserId, userId)
      ),
    });
  }

  if (!clinic) {
    return { error: "Clinic not found or you do not have permission", status: 404 };
  }

  return { clinic, user };
}

/**
 * POST /api/owner/clinics/[clinicId]/photos - Upload a photo
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await verifyOwnershipAndGetClinic(clinicId, session.user.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { clinic } = result;

    // Check tier limits
    const photoLimit = getPhotoLimit(clinic.featuredTier);
    if (photoLimit === 0) {
      return NextResponse.json(
        { error: "Photo uploads require a Featured subscription" },
        { status: 403 }
      );
    }

    const currentPhotos = clinic.clinicImageUrls || [];
    if (currentPhotos.length >= photoLimit) {
      return NextResponse.json(
        {
          error: `Photo limit reached. ${clinic.featuredTier === "basic" ? "Upgrade to Premium for more photos" : "Maximum photos reached"}`,
          limit: photoLimit,
          current: currentPhotos.length,
        },
        { status: 400 }
      );
    }

    // Get the file from form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    // Upload to storage
    const uploadResult = await upload(buffer, filename, `clinics/${clinicId}`);

    // Update clinic with new image URL
    const updatedPhotos = [...currentPhotos, uploadResult.url];
    await db
      .update(schema.clinics)
      .set({
        clinicImageUrls: updatedPhotos,
        updatedAt: new Date(),
      })
      .where(eq(schema.clinics.id, clinicId));

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      photos: updatedPhotos,
      remaining: photoLimit - updatedPhotos.length,
    });
  } catch (error) {
    console.error("Error uploading photo:", error);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/owner/clinics/[clinicId]/photos - Delete a photo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await verifyOwnershipAndGetClinic(clinicId, session.user.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { clinic } = result;

    // Get the URL to delete from query params
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    const currentPhotos = clinic.clinicImageUrls || [];

    // Check if the image exists in the clinic's photos
    if (!currentPhotos.includes(imageUrl)) {
      return NextResponse.json(
        { error: "Image not found in clinic photos" },
        { status: 404 }
      );
    }

    // Try to delete from storage (only for blob URLs we control)
    if (imageUrl.includes("blob.vercel-storage.com") || imageUrl.startsWith("/uploads/")) {
      try {
        await deleteFile(imageUrl);
      } catch (err) {
        console.warn("Failed to delete file from storage:", err);
        // Continue anyway - we'll still remove from database
      }
    }

    // Update clinic to remove the image URL
    const updatedPhotos = currentPhotos.filter((url) => url !== imageUrl);
    await db
      .update(schema.clinics)
      .set({
        clinicImageUrls: updatedPhotos,
        updatedAt: new Date(),
      })
      .where(eq(schema.clinics.id, clinicId));

    const photoLimit = getPhotoLimit(clinic.featuredTier);

    return NextResponse.json({
      success: true,
      photos: updatedPhotos,
      remaining: photoLimit - updatedPhotos.length,
    });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/owner/clinics/[clinicId]/photos - Get photos and limits
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const { clinicId } = await params;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await verifyOwnershipAndGetClinic(clinicId, session.user.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { clinic } = result;
    const photoLimit = getPhotoLimit(clinic.featuredTier);
    const currentPhotos = clinic.clinicImageUrls || [];

    return NextResponse.json({
      photos: currentPhotos,
      limit: photoLimit,
      used: currentPhotos.length,
      remaining: photoLimit - currentPhotos.length,
      tier: clinic.featuredTier || "none",
      canUpload: photoLimit > 0 && currentPhotos.length < photoLimit,
    });
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}
