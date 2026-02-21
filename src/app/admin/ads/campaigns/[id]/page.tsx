import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  adCampaigns,
  adCreatives,
  adPlacements,
  adCampaignPlacements,
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

  const [creatives, placements, allPlacements] = await Promise.all([
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
  ]);

  return { campaign, creatives, placements, allPlacements };
}

export default async function CampaignDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getCampaignData(id);

  if (!data) notFound();

  const { campaign, creatives, placements, allPlacements } = data;

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
      />
    </div>
  );
}
