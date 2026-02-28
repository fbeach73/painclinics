import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPlacementsWithCampaignDetails } from "@/lib/ad-stats-queries";
import { PLACEMENT_SPECS, getAdsenseSlotId } from "@/lib/ad-placement-specs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function CheatSheetPage() {
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
          <h1 className="text-2xl font-bold tracking-tight">Placement Cheat Sheet</h1>
          <p className="text-muted-foreground">
            All placement specs and assignments at a glance
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {placements.map((p) => {
          const spec = PLACEMENT_SPECS[p.name];
          const activeCampaigns = p.campaigns.filter((c) => c.campaignStatus === "active");
          const hasFill = activeCampaigns.length > 0;

          return (
            <Card key={p.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-mono leading-tight">
                      {p.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">{p.label}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="capitalize text-xs">
                      {p.pageType}
                    </Badge>
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${
                        p.isActive
                          ? "bg-green-500"
                          : "bg-gray-400 dark:bg-gray-600"
                      }`}
                      title={p.isActive ? "Active" : "Inactive"}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {/* Allowed Types */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Types</p>
                  <div className="flex flex-wrap gap-1">
                    {spec?.allowedTypes ? (
                      spec.allowedTypes.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs capitalize">
                          {t.replace("_", " ")}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary" className="text-xs">All</Badge>
                    )}
                  </div>
                </div>

                {/* Allowed Ratios */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Ratios</p>
                  <div className="flex flex-wrap gap-1">
                    {spec?.allowedRatios ? (
                      spec.allowedRatios.map((r) => (
                        <Badge key={r} variant="secondary" className="text-xs">
                          {r}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary" className="text-xs">All</Badge>
                    )}
                  </div>
                </div>

                {/* AdSense / Hosted */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Fallback</p>
                  {spec?.hostedOnly ? (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-0 text-xs">
                      Hosted Only
                    </Badge>
                  ) : (
                    <code className="text-xs font-mono text-muted-foreground">
                      AdSense {getAdsenseSlotId(p.name)}
                    </code>
                  )}
                </div>

                {/* Campaigns */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Campaigns</p>
                  {p.campaigns.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">None assigned</p>
                  ) : (
                    <div className="space-y-1">
                      {p.campaigns.map((c) => (
                        <div
                          key={c.campaignId}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${
                                c.campaignStatus === "active"
                                  ? "bg-green-500"
                                  : c.campaignStatus === "paused"
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                            />
                            <span className="truncate">{c.advertiserName}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                            <span>w:{c.weight}</span>
                            <span>{c.activeCreativeCount} cr</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fill status */}
                <div className="pt-1 border-t">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        hasFill ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {hasFill
                        ? `Hosted — ${activeCampaigns.length} active campaign${activeCampaigns.length !== 1 ? "s" : ""}`
                        : "AdSense — no active campaigns"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
