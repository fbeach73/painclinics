"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PLACEMENT_SPECS } from "@/lib/ad-placement-specs";
import type { PlacementWithDetails } from "@/lib/ad-stats-queries";

type PageType = "clinic" | "directory" | "blog" | "homepage";

const PAGE_TYPES: { value: PageType; label: string }[] = [
  { value: "clinic", label: "Clinic Page" },
  { value: "directory", label: "Directory" },
  { value: "blog", label: "Blog Post" },
  { value: "homepage", label: "Homepage" },
];

// Layout definitions for each page type
// Each content region or placement has a position in the grid
type LayoutItem = {
  type: "content" | "placement";
  label: string;
  placementName?: string;
  gridArea: string;
  minHeight: string;
};

const PAGE_LAYOUTS: Record<PageType, { columns: string; rows: string; items: LayoutItem[] }> = {
  clinic: {
    columns: "1fr 300px",
    rows: "auto auto auto 1fr auto",
    items: [
      { type: "placement", label: "Top Leaderboard", placementName: "clinic-top-leaderboard", gridArea: "1 / 1 / 2 / 3", minHeight: "60px" },
      { type: "content", label: "Hero / Header", gridArea: "2 / 1 / 3 / 3", minHeight: "120px" },
      { type: "placement", label: "Below Header", placementName: "clinic-below-header", gridArea: "3 / 1 / 4 / 3", minHeight: "80px" },
      { type: "content", label: "Main Content", gridArea: "4 / 1 / 5 / 2", minHeight: "300px" },
      { type: "placement", label: "Above Fold (Sidebar)", placementName: "clinic-above-fold", gridArea: "4 / 2 / 5 / 3", minHeight: "250px" },
      { type: "placement", label: "Above Image", placementName: "clinic-above-image", gridArea: "5 / 1 / 6 / 3", minHeight: "50px" },
      { type: "placement", label: "Mid Content", placementName: "clinic-mid-content", gridArea: "6 / 1 / 7 / 3", minHeight: "100px" },
    ],
  },
  directory: {
    columns: "1fr",
    rows: "auto auto 1fr",
    items: [
      { type: "content", label: "Header / Filters", gridArea: "1 / 1 / 2 / 2", minHeight: "100px" },
      { type: "content", label: "Clinic Card 1-3", gridArea: "2 / 1 / 3 / 2", minHeight: "180px" },
      { type: "placement", label: "In-List Ad", placementName: "directory-in-list", gridArea: "3 / 1 / 4 / 2", minHeight: "100px" },
      { type: "content", label: "Clinic Cards 4+", gridArea: "4 / 1 / 5 / 2", minHeight: "200px" },
    ],
  },
  blog: {
    columns: "1fr",
    rows: "auto auto 1fr auto",
    items: [
      { type: "content", label: "Blog Header / Title", gridArea: "1 / 1 / 2 / 2", minHeight: "120px" },
      { type: "content", label: "Article Content (top)", gridArea: "2 / 1 / 3 / 2", minHeight: "200px" },
      { type: "placement", label: "Mid-Content", placementName: "blog-mid-content", gridArea: "3 / 1 / 4 / 2", minHeight: "100px" },
      { type: "content", label: "Article Content (bottom)", gridArea: "4 / 1 / 5 / 2", minHeight: "200px" },
    ],
  },
  homepage: {
    columns: "1fr",
    rows: "auto auto auto auto",
    items: [
      { type: "content", label: "Hero Section", gridArea: "1 / 1 / 2 / 2", minHeight: "180px" },
      { type: "content", label: "Browse Section", gridArea: "2 / 1 / 3 / 2", minHeight: "150px" },
      { type: "placement", label: "Mid Section", placementName: "homepage-mid", gridArea: "3 / 1 / 4 / 2", minHeight: "100px" },
      { type: "content", label: "Featured / Blog", gridArea: "4 / 1 / 5 / 2", minHeight: "200px" },
    ],
  },
};

type Props = {
  placements: PlacementWithDetails[];
};

function PlacementBox({
  item,
  placement,
}: {
  item: LayoutItem;
  placement: PlacementWithDetails | undefined;
}) {
  const activeCampaigns = placement?.campaigns.filter((c) => c.campaignStatus === "active") ?? [];
  const hasFill = activeCampaigns.length > 0;
  const spec = item.placementName ? PLACEMENT_SPECS[item.placementName] : undefined;

  return (
    <div
      className={`rounded-md border-2 border-dashed p-3 flex flex-col justify-between ${
        hasFill
          ? "border-green-500/60 bg-green-500/5 dark:bg-green-500/10"
          : "border-red-500/60 bg-red-500/5 dark:bg-red-500/10"
      }`}
      style={{ gridArea: item.gridArea, minHeight: item.minHeight }}
    >
      <div>
        <p className={`text-xs font-semibold ${hasFill ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
          {item.label}
        </p>
        {item.placementName && (
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
            {item.placementName}
          </p>
        )}
      </div>
      <div className="mt-2 space-y-1">
        {spec && (
          <div className="flex flex-wrap gap-1">
            {(spec.allowedTypes ?? ["all"]).map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px] px-1 py-0 capitalize">
                {t === "all" ? "All types" : t.replace("_", " ")}
              </Badge>
            ))}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">
          {hasFill
            ? `${activeCampaigns.length} active campaign${activeCampaigns.length !== 1 ? "s" : ""}`
            : "Empty — AdSense fallback"}
        </p>
      </div>
    </div>
  );
}

function ContentBox({ item }: { item: LayoutItem }) {
  return (
    <div
      className="rounded-md border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-3 flex items-center justify-center"
      style={{ gridArea: item.gridArea, minHeight: item.minHeight }}
    >
      <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
    </div>
  );
}

export function PreviewClient({ placements }: Props) {
  const [activeTab, setActiveTab] = useState<PageType>("clinic");
  const layout = PAGE_LAYOUTS[activeTab];

  const placementMap = new Map(placements.map((p) => [p.name, p]));

  const globalPlacements = placements.filter((p) => p.pageType === "global");

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {PAGE_TYPES.map((pt) => (
          <button
            key={pt.value}
            onClick={() => setActiveTab(pt.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === pt.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {pt.label}
          </button>
        ))}
      </div>

      {/* Wireframe */}
      <Card>
        <CardContent className="p-6">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: layout.columns,
              gridTemplateRows: layout.rows,
            }}
          >
            {layout.items.map((item, i) =>
              item.type === "placement" ? (
                <PlacementBox
                  key={i}
                  item={item}
                  placement={item.placementName ? placementMap.get(item.placementName) : undefined}
                />
              ) : (
                <ContentBox key={i} item={item} />
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Global Placements */}
      {globalPlacements.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-semibold mb-3">
              Global Placements (all public pages)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {globalPlacements.map((p) => {
                const activeCampaigns = p.campaigns.filter((c) => c.campaignStatus === "active");
                const hasFill = activeCampaigns.length > 0;
                const spec = PLACEMENT_SPECS[p.name];
                return (
                  <div
                    key={p.id}
                    className={`rounded-md border-2 border-dashed p-3 ${
                      hasFill
                        ? "border-green-500/60 bg-green-500/5 dark:bg-green-500/10"
                        : "border-red-500/60 bg-red-500/5 dark:bg-red-500/10"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`text-xs font-semibold ${hasFill ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                          {p.label}
                        </p>
                        <p className="text-[10px] font-mono text-muted-foreground">{p.name}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(spec?.allowedTypes ?? ["all"]).map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px] px-1 py-0 capitalize">
                            {t === "all" ? "All types" : t.replace("_", " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {hasFill
                        ? `${activeCampaigns.length} active campaign${activeCampaigns.length !== 1 ? "s" : ""}`
                        : spec?.hostedOnly
                          ? "Empty — no fallback (hosted only)"
                          : "Empty — AdSense fallback"}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-6 rounded border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50" />
          Content region
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-6 rounded border-2 border-dashed border-green-500/60 bg-green-500/5" />
          Filled placement
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-6 rounded border-2 border-dashed border-red-500/60 bg-red-500/5" />
          Empty placement
        </div>
      </div>
    </div>
  );
}
