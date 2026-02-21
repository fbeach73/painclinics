import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { checkAdminApi, adminErrorResponse } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { adCreatives, adCampaigns } from "@/lib/schema";

const VALID_CREATIVE_TYPES = ["image_banner", "html", "text", "native"] as const;
type CreativeType = (typeof VALID_CREATIVE_TYPES)[number];

const VALID_ASPECT_RATIOS = ["1:1", "16:9", "4:3", "3:2", "auto"] as const;
type AspectRatio = (typeof VALID_ASPECT_RATIOS)[number];

export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminApi();
  if ("error" in adminCheck) {
    return adminErrorResponse(adminCheck);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { campaignId, name, creativeType, destinationUrl } = body;

  if (!campaignId || typeof campaignId !== "string") {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }
  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!creativeType || !VALID_CREATIVE_TYPES.includes(creativeType as CreativeType)) {
    return NextResponse.json(
      { error: `creativeType must be one of: ${VALID_CREATIVE_TYPES.join(", ")}` },
      { status: 400 }
    );
  }
  if (!destinationUrl || typeof destinationUrl !== "string") {
    return NextResponse.json({ error: "destinationUrl is required" }, { status: 400 });
  }

  const campaign = await db.query.adCampaigns.findFirst({
    where: eq(adCampaigns.id, campaignId),
  });
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const insertData: typeof adCreatives.$inferInsert = {
    campaignId,
    name: (name as string).trim(),
    creativeType: creativeType as CreativeType,
    destinationUrl,
    imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : undefined,
    imageAlt: typeof body.imageAlt === "string" ? body.imageAlt : undefined,
    htmlContent: typeof body.htmlContent === "string" ? body.htmlContent : undefined,
    headline: typeof body.headline === "string" ? body.headline : undefined,
    bodyText: typeof body.bodyText === "string" ? body.bodyText : undefined,
    ctaText: typeof body.ctaText === "string" ? body.ctaText : undefined,
    aspectRatio: typeof body.aspectRatio === "string" && VALID_ASPECT_RATIOS.includes(body.aspectRatio as AspectRatio)
      ? (body.aspectRatio as AspectRatio)
      : undefined,
    weight: typeof body.weight === "number" ? body.weight : undefined,
    isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
  };

  const [creative] = await db.insert(adCreatives).values(insertData).returning();

  return NextResponse.json({ creative }, { status: 201 });
}
