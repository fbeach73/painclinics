import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { eq, sql, count } from "drizzle-orm";
import {
  adCampaigns,
  adCreatives,
  adPlacements,
  adCampaignPlacements,
  adImpressions,
  adClicks,
  adConversions,
} from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { CampaignDetailClient } from "./campaign-detail-client";

type Props = {
  params: Promise<{ id: string }>;
};

async function getCampaignData(id: string) {
  const campaign = await db.query.adCampaigns.findFirst({
    where: eq(adCampaigns.id, id),
  });
  if (!campaign) return null;

  const [creatives, placements, allPlacements, impressionStats, clickStats, conversionStats] = await Promise.all([
    db.select().from(adCreatives).where(eq(adCreatives.campaignId, id)),
    db
      .select({
        id: adPlacements.id,
        name: adPlacements.name,
        label: adPlacements.label,
        pageType: adPlacements.pageType,
        assignmentId: adCampaignPlacements.id,
        assignmentWeight: adCampaignPlacements.weight,
      })
      .from(adCampaignPlacements)
      .innerJoin(
        adPlacements,
        eq(adCampaignPlacements.placementId, adPlacements.id)
      )
      .where(eq(adCampaignPlacements.campaignId, id)),
    db
      .select({
        id: adPlacements.id,
        name: adPlacements.name,
        label: adPlacements.label,
        pageType: adPlacements.pageType,
      })
      .from(adPlacements)
      .orderBy(adPlacements.name),
    // Impressions per creative
    db
      .select({
        creativeId: adImpressions.creativeId,
        impressions: count().as("impressions"),
      })
      .from(adImpressions)
      .where(eq(adImpressions.campaignId, id))
      .groupBy(adImpressions.creativeId),
    // Clicks per creative (join through impressions)
    db
      .select({
        creativeId: adImpressions.creativeId,
        clicks: count().as("clicks"),
      })
      .from(adClicks)
      .innerJoin(adImpressions, eq(adClicks.clickId, adImpressions.clickId))
      .where(sql`${adImpressions.campaignId} = ${id} AND ${adClicks.isBot} = false`)
      .groupBy(adImpressions.creativeId),
    // Conversions per creative (join through clicks -> impressions)
    db
      .select({
        creativeId: adImpressions.creativeId,
        conversions: count().as("conversions"),
      })
      .from(adConversions)
      .innerJoin(adClicks, eq(adConversions.clickId, adClicks.clickId))
      .innerJoin(adImpressions, eq(adClicks.clickId, adImpressions.clickId))
      .where(eq(adImpressions.campaignId, id))
      .groupBy(adImpressions.creativeId),
  ]);

  // Build stats map: creativeId -> { impressions, clicks, conversions }
  const creativeStats: Record<string, { impressions: number; clicks: number; conversions: number }> = {};
  for (const row of impressionStats) {
    creativeStats[row.creativeId] = { impressions: row.impressions, clicks: 0, conversions: 0 };
  }
  for (const row of clickStats) {
    const existing = creativeStats[row.creativeId];
    if (!existing) {
      creativeStats[row.creativeId] = { impressions: 0, clicks: row.clicks, conversions: 0 };
    } else {
      existing.clicks = row.clicks;
    }
  }
  for (const row of conversionStats) {
    const existing = creativeStats[row.creativeId];
    if (!existing) {
      creativeStats[row.creativeId] = { impressions: 0, clicks: 0, conversions: row.conversions };
    } else {
      existing.conversions = row.conversions;
    }
  }

  return { campaign, creatives, placements, allPlacements, creativeStats };
}

export default async function CampaignDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getCampaignData(id);

  if (!data) notFound();

  const { campaign, creatives, placements, allPlacements, creativeStats } = data;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/ads/campaigns">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Campaigns
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
          <p className="text-muted-foreground">{campaign.advertiserName}</p>
        </div>
      </div>

      <CampaignDetailClient
        campaign={campaign}
        creatives={creatives}
        assignedPlacements={placements}
        allPlacements={allPlacements}
        creativeStats={creativeStats}
      />
    </div>
  );
}
