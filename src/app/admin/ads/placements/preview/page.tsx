import { getPlacementsWithCampaignDetails } from "@/lib/ad-stats-queries";
import { PreviewClient } from "./preview-client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function PreviewPage() {
  const placements = await getPlacementsWithCampaignDetails();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/ads/placements">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Page Preview</h1>
          <p className="text-muted-foreground">
            Visual wireframes showing ad placement positions on each page type
          </p>
        </div>
      </div>
      <PreviewClient placements={placements} />
    </div>
  );
}
