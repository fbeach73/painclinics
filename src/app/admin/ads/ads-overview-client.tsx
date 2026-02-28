"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye,
  MousePointerClick,
  TrendingUp,
  DollarSign,
  Target,
  BarChart3,
  RefreshCw,
  Megaphone,
  MapPin,
  LineChart,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { OverviewStats, StatsOverTimeRow, CreativeStats, DateRange } from "@/lib/ad-stats-queries";

type StatsResponse = {
  overview: OverviewStats;
  overTime: StatsOverTimeRow[];
  topCreatives: CreativeStats[];
};

const chartConfig = {
  impressions: { label: "Impressions", color: "hsl(215, 70%, 55%)" },
  clicks: { label: "Clicks", color: "hsl(150, 60%, 45%)" },
  conversions: { label: "Conversions", color: "hsl(35, 90%, 55%)" },
} satisfies ChartConfig;

export function AdsOverviewClient() {
  const [range, setRange] = useState<DateRange>("7d");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);


  async function fetchStats() {
    setStatsLoading(true);
    setStatsError(false);
    try {
      const r = await fetch(`/api/admin/ads/stats?range=${range}`);
      if (!r.ok) {
        throw new Error(`Stats API returned ${r.status}`);
      }
      const data = (await r.json()) as StatsResponse;
      setStats(data);
      setStatsLoading(false);
    } catch {
      setStatsError(true);
      setStatsLoading(false);
    }
  }


  useEffect(() => {
    void fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const overview = stats?.overview ?? {
    impressions: 0,
    clicks: 0,
    ctr: 0,
    conversions: 0,
    revenue: 0,
    ecpm: 0,
  };

  const statCards = [
    {
      title: "Impressions",
      value: overview.impressions.toLocaleString(),
      icon: Eye,
      description: "Total ad impressions served",
    },
    {
      title: "Clicks",
      value: overview.clicks.toLocaleString(),
      icon: MousePointerClick,
      description: "Total clicks on ads",
    },
    {
      title: "CTR",
      value: `${overview.ctr.toFixed(2)}%`,
      icon: TrendingUp,
      description: "Click-through rate",
    },
    {
      title: "Conversions",
      value: overview.conversions.toLocaleString(),
      icon: Target,
      description: "Total conversions tracked",
    },
    {
      title: "Revenue",
      value: `$${overview.revenue.toFixed(2)}`,
      icon: DollarSign,
      description: "Total payout revenue",
    },
    {
      title: "eCPM",
      value: `$${overview.ecpm.toFixed(2)}`,
      icon: BarChart3,
      description: "Effective cost per mille",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Date range + refresh */}
      <div className="flex items-center justify-between">
        <Tabs value={range} onValueChange={(v) => setRange(v as DateRange)}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchStats()}
          disabled={statsLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${statsLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Navigation links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/admin/ads/campaigns">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Manage advertisers and campaign settings
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/ads/placements">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Placements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Configure ad slots and page positions
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/ads/conversions">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Conversions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                View conversion log and payout history
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats grid */}
      {statsError ? (
        <p className="text-destructive text-sm">
          Failed to load stats. Try refreshing.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      card.value
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Performance chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            Performance Over Time
          </CardTitle>
          <CardDescription>Daily impressions, clicks, and conversions</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
              Loading chart…
            </div>
          ) : !stats?.overTime?.length ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm border border-dashed rounded-md">
              No data for this period
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={stats.overTime} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(v: string) => {
                    const d = new Date(v + "T00:00:00");
                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(v: string) => {
                        const d = new Date(v + "T00:00:00");
                        return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                      }}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="impressions" fill="var(--color-impressions)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicks" fill="var(--color-clicks)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conversions" fill="var(--color-conversions)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Ad serving info */}
      <Card>
        <CardHeader>
          <CardTitle>Ad Serving</CardTitle>
          <CardDescription>
            Each placement independently checks for an active hosted campaign.
            If one exists, it serves the hosted ad. Otherwise, AdSense fills the slot.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To serve hosted ads on a placement, create a campaign, upload creatives,
            and assign it to the desired placement. All unassigned placements
            automatically show AdSense.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
