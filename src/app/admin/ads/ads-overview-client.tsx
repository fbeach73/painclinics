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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OverviewStats, StatsOverTimeRow, CreativeStats, DateRange } from "@/lib/ad-stats-queries";

type StatsResponse = {
  overview: OverviewStats;
  overTime: StatsOverTimeRow[];
  topCreatives: CreativeStats[];
};

type SettingsResponse = {
  adServerPercentage: number;
};

export function AdsOverviewClient() {
  const [range, setRange] = useState<DateRange>("7d");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  const [adPercentage, setAdPercentage] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  async function fetchStats() {
    setStatsLoading(true);
    setStatsError(false);
    try {
      const r = await fetch(`/api/admin/ads/stats?range=${range}`);
      const data = (await r.json()) as StatsResponse;
      setStats(data);
      setStatsLoading(false);
    } catch {
      setStatsError(true);
      setStatsLoading(false);
    }
  }

  async function fetchSettings() {
    setSettingsLoading(true);
    try {
      const r = await fetch("/api/admin/ads/settings");
      const data = (await r.json()) as SettingsResponse;
      setAdPercentage(data.adServerPercentage);
      setSliderValue(data.adServerPercentage);
      setSettingsLoading(false);
    } catch {
      setSettingsLoading(false);
    }
  }

  function saveSettings() {
    setSettingsSaving(true);
    setSettingsSaved(false);
    fetch("/api/admin/ads/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adServerPercentage: sliderValue }),
    })
      .then((r) => r.json())
      .then(() => {
        setAdPercentage(sliderValue);
        setSettingsSaving(false);
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2000);
      })
      .catch(() => setSettingsSaving(false));
  }

  useEffect(() => {
    void fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  useEffect(() => {
    void fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          onClick={fetchStats}
          disabled={statsLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${statsLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
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

      {/* Chart placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            Performance Over Time
          </CardTitle>
          <CardDescription>Daily impressions and clicks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm border border-dashed rounded-md">
            Chart coming soon
          </div>
        </CardContent>
      </Card>

      {/* Ad server percentage control */}
      <Card>
        <CardHeader>
          <CardTitle>Ad Server Traffic Split</CardTitle>
          <CardDescription>
            Percentage of page requests that are eligible to receive ads from
            the direct ad server (vs. falling back to AdSense).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settingsLoading ? (
            <p className="text-sm text-muted-foreground">Loading settings…</p>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className="flex-1 h-2 accent-primary cursor-pointer"
                />
                <Badge variant="secondary" className="min-w-[56px] justify-center text-base font-mono">
                  {sliderValue}%
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={saveSettings}
                  disabled={settingsSaving || sliderValue === adPercentage}
                  size="sm"
                >
                  {settingsSaving ? "Saving…" : "Save"}
                </Button>
                {settingsSaved && (
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Saved
                  </span>
                )}
                {sliderValue !== adPercentage && !settingsSaving && (
                  <span className="text-xs text-muted-foreground">
                    Current: {adPercentage}% → New: {sliderValue}%
                  </span>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
