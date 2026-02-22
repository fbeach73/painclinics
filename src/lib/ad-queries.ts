import { db } from "@/lib/db";
import {
  adPlacements,
  adCampaignPlacements,
  adCampaigns,
  adCreatives,
  adImpressions,
} from "@/lib/schema";
import { and, eq, lte, gte, isNull, or, sql } from "drizzle-orm";
import { weightedRandomSelect, weightedRandomSelectMultiple, buildClickUrl } from "@/lib/ad-utils";

export type AdCreativeResult = {
  id: string;
  campaignId: string;
  name: string;
  creativeType: "image_banner" | "html" | "text" | "native";
  aspectRatio: AspectRatio;
  imageUrl: string | null;
  imageAlt: string | null;
  htmlContent: string | null;
  headline: string | null;
  bodyText: string | null;
  ctaText: string | null;
  destinationUrl: string;
};

export type AdForPlacement = {
  creative: AdCreativeResult;
  clickId: string;
  clickUrl: string;
  placementId: string;
};

export type CreativeType = "image_banner" | "html" | "text" | "native";
export type AspectRatio = "1:1" | "16:9" | "21:9" | "4:3" | "3:2" | "auto";

/**
 * Fetch the eligible weighted creative pool for a placement.
 * Optionally filter by allowed creative types and/or aspect ratios.
 * Shared by single and multi-select functions.
 */
async function getEligibleCreatives(
  placementName: string,
  allowedTypes?: CreativeType[],
  allowedAspectRatios?: AspectRatio[],
) {
  const placement = await db
    .select({ id: adPlacements.id })
    .from(adPlacements)
    .where(
      and(eq(adPlacements.name, placementName), eq(adPlacements.isActive, true))
    )
    .limit(1);

  if (placement.length === 0) return null;
  const placementId = placement[0]!.id;

  const now = new Date();
  const eligibleAssignments = await db
    .select({
      campaignId: adCampaignPlacements.campaignId,
      placementWeight: adCampaignPlacements.weight,
    })
    .from(adCampaignPlacements)
    .innerJoin(
      adCampaigns,
      eq(adCampaignPlacements.campaignId, adCampaigns.id)
    )
    .where(
      and(
        eq(adCampaignPlacements.placementId, placementId),
        eq(adCampaigns.status, "active"),
        or(isNull(adCampaigns.startDate), lte(adCampaigns.startDate, now)),
        or(isNull(adCampaigns.endDate), gte(adCampaigns.endDate, now))
      )
    );

  if (eligibleAssignments.length === 0) return null;

  const campaignIds = eligibleAssignments.map((a) => a.campaignId);
  const creativeConditions = [
    sql`${adCreatives.campaignId} IN ${campaignIds}`,
    eq(adCreatives.isActive, true),
  ];

  // Filter by allowed creative types if specified
  if (allowedTypes && allowedTypes.length > 0) {
    creativeConditions.push(
      sql`${adCreatives.creativeType} IN ${allowedTypes}`
    );
  }

  // Filter by allowed aspect ratios if specified
  // "auto" creatives are always eligible (they fit any slot)
  if (allowedAspectRatios && allowedAspectRatios.length > 0) {
    const ratiosWithAuto = [...new Set([...allowedAspectRatios, "auto" as AspectRatio])];
    creativeConditions.push(
      sql`${adCreatives.aspectRatio} IN ${ratiosWithAuto}`
    );
  }

  const creatives = await db
    .select({
      id: adCreatives.id,
      campaignId: adCreatives.campaignId,
      name: adCreatives.name,
      creativeType: adCreatives.creativeType,
      aspectRatio: adCreatives.aspectRatio,
      imageUrl: adCreatives.imageUrl,
      imageAlt: adCreatives.imageAlt,
      htmlContent: adCreatives.htmlContent,
      headline: adCreatives.headline,
      bodyText: adCreatives.bodyText,
      ctaText: adCreatives.ctaText,
      destinationUrl: adCreatives.destinationUrl,
      weight: adCreatives.weight,
    })
    .from(adCreatives)
    .where(and(...creativeConditions));

  if (creatives.length === 0) return null;

  const placementWeightMap = new Map(
    eligibleAssignments.map((a) => [a.campaignId, a.placementWeight])
  );

  const weightedCreatives = creatives.map((c) => ({
    ...c,
    weight: c.weight * (placementWeightMap.get(c.campaignId) ?? 1),
  }));

  return { placementId, weightedCreatives };
}

/**
 * Select multiple ads for a placement (e.g. native ad panel).
 * Returns an array of ads, empty if none eligible.
 */
export async function getAdsForPlacement(
  placementName: string,
  pagePath: string,
  count: number,
  allowedTypes?: CreativeType[],
  allowedAspectRatios?: AspectRatio[],
): Promise<AdForPlacement[]> {
  const pool = await getEligibleCreatives(placementName, allowedTypes, allowedAspectRatios);
  if (!pool) return [];

  const selected = weightedRandomSelectMultiple(pool.weightedCreatives, count);
  if (selected.length === 0) return [];

  const results: AdForPlacement[] = [];

  for (const creative of selected) {
    const clickId = crypto.randomUUID();

    // Fire-and-forget impression
    db.insert(adImpressions)
      .values({
        creativeId: creative.id,
        placementId: pool.placementId,
        campaignId: creative.campaignId,
        clickId,
        pagePath,
        destinationUrl: creative.destinationUrl,
      })
      .catch((err) => console.error("Failed to record ad impression:", err));

    results.push({
      creative: {
        id: creative.id,
        campaignId: creative.campaignId,
        name: creative.name,
        creativeType: creative.creativeType,
        aspectRatio: creative.aspectRatio,
        imageUrl: creative.imageUrl,
        imageAlt: creative.imageAlt,
        htmlContent: creative.htmlContent,
        headline: creative.headline,
        bodyText: creative.bodyText,
        ctaText: creative.ctaText,
        destinationUrl: creative.destinationUrl,
      },
      clickId,
      clickUrl: buildClickUrl(clickId, creative.destinationUrl),
      placementId: pool.placementId,
    });
  }

  return results;
}

/**
 * Select and serve an ad for a given placement.
 * Returns null if no eligible creatives exist (caller should fall back to AdSense).
 */
export async function getAdForPlacement(
  placementName: string,
  pagePath: string,
  allowedTypes?: CreativeType[],
  allowedAspectRatios?: AspectRatio[],
): Promise<AdForPlacement | null> {
  const pool = await getEligibleCreatives(placementName, allowedTypes, allowedAspectRatios);
  if (!pool) return null;

  const selected = weightedRandomSelect(pool.weightedCreatives);
  if (!selected) return null;

  const clickId = crypto.randomUUID();

  // Record impression (fire-and-forget)
  db.insert(adImpressions)
    .values({
      creativeId: selected.id,
      placementId: pool.placementId,
      campaignId: selected.campaignId,
      clickId,
      pagePath,
      destinationUrl: selected.destinationUrl,
    })
    .catch((err) => console.error("Failed to record ad impression:", err));

  return {
    creative: {
      id: selected.id,
      campaignId: selected.campaignId,
      name: selected.name,
      creativeType: selected.creativeType,
      aspectRatio: selected.aspectRatio,
      imageUrl: selected.imageUrl,
      imageAlt: selected.imageAlt,
      htmlContent: selected.htmlContent,
      headline: selected.headline,
      bodyText: selected.bodyText,
      ctaText: selected.ctaText,
      destinationUrl: selected.destinationUrl,
    },
    clickId,
    clickUrl: buildClickUrl(clickId, selected.destinationUrl),
    placementId: pool.placementId,
  };
}
