import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { adCreatives } from "@/lib/schema";

const VALID_CREATIVE_TYPES = ["image_banner", "html", "text", "native"] as const;
type CreativeType = (typeof VALID_CREATIVE_TYPES)[number];

const VALID_ASPECT_RATIOS = ["1:1", "16:9", "4:3", "3:2", "auto"] as const;
type AspectRatio = (typeof VALID_ASPECT_RATIOS)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { id } = await params;

  const existing = await db.query.adCreatives.findFirst({
    where: eq(adCreatives.id, id),
  });

  if (!existing) {
    return NextResponse.json({ error: "Creative not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updateData: Partial<typeof adCreatives.$inferInsert> = {};

  if (typeof body.name === "string" && body.name.trim() !== "") {
    updateData.name = body.name.trim();
  }
  if (body.creativeType && VALID_CREATIVE_TYPES.includes(body.creativeType as CreativeType)) {
    updateData.creativeType = body.creativeType as CreativeType;
  }
  if (typeof body.destinationUrl === "string") {
    updateData.destinationUrl = body.destinationUrl;
  }
  if ("imageUrl" in body) {
    updateData.imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : undefined;
  }
  if ("imageAlt" in body) {
    updateData.imageAlt = typeof body.imageAlt === "string" ? body.imageAlt : undefined;
  }
  if ("htmlContent" in body) {
    updateData.htmlContent =
      typeof body.htmlContent === "string" ? body.htmlContent : undefined;
  }
  if ("headline" in body) {
    updateData.headline = typeof body.headline === "string" ? body.headline : undefined;
  }
  if ("bodyText" in body) {
    updateData.bodyText = typeof body.bodyText === "string" ? body.bodyText : undefined;
  }
  if ("ctaText" in body) {
    updateData.ctaText = typeof body.ctaText === "string" ? body.ctaText : undefined;
  }
  if (typeof body.aspectRatio === "string" && VALID_ASPECT_RATIOS.includes(body.aspectRatio as AspectRatio)) {
    updateData.aspectRatio = body.aspectRatio as AspectRatio;
  }
  if (typeof body.weight === "number") {
    updateData.weight = body.weight;
  }
  if (typeof body.isActive === "boolean") {
    updateData.isActive = body.isActive;
  }

  const [creative] = await db
    .update(adCreatives)
    .set(updateData)
    .where(eq(adCreatives.id, id))
    .returning();

  return NextResponse.json({ creative });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  const { id } = await params;

  const existing = await db.query.adCreatives.findFirst({
    where: eq(adCreatives.id, id),
  });

  if (!existing) {
    return NextResponse.json({ error: "Creative not found" }, { status: 404 });
  }

  await db.delete(adCreatives).where(eq(adCreatives.id, id));

  return NextResponse.json({ success: true });
}
