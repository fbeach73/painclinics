"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  Users,
  Building2,
  RefreshCw,
  Globe,
  FileText,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type DateRange = "today" | "7d" | "30d" | "all";

interface OverviewStats {
  totalPageviews: number;
  uniqueVisitors: number;
  clinicViews: number;
}

interface ReferrerStats {
  source: string;
  count: number;
}

interface PageStats {
  path: string;
  views: number;
  uniqueVisitors: number;
}

interface TimeSeriesData {
  date: string;
  views: number;
  uniqueVisitors: number;
}

interface AnalyticsData {
  overview: OverviewStats;
  referrers: ReferrerStats[];
  topPages: PageStats[];
  viewsOverTime: TimeSeriesData[];
}

const chartConfig = {
  views: {
    label: "Page Views",
    color: "hsl(var(--chart-1))",
  },
  uniqueVisitors: {
    label: "Unique Visitors",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

const REFERRER_COLORS: Record<string, string> = {
  google: "bg-blue-500",
  direct: "bg-gray-500",
  bing: "bg-teal-500",
  facebook: "bg-indigo-500",
  twitter: "bg-sky-500",
  linkedin: "bg-blue-700",
  instagram: "bg-pink-500",
  pinterest: "bg-red-500",
  reddit: "bg-orange-500",
  tiktok: "bg-black",
  youtube: "bg-red-600",
  internal: "bg-green-500",
  referral: "bg-purple-500",
};

export function TrafficAnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>("30d");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?range=${range}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatPath = (path: string) => {
    if (path.length > 50) {
      return path.slice(0, 47) + "...";
    }
    return path;
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const overview = data?.overview || {
    totalPageviews: 0,
    uniqueVisitors: 0,
    clinicViews: 0,
  };
  const referrers = data?.referrers || [];
  const topPages = data?.topPages || [];
  const viewsOverTime = data?.viewsOverTime || [];

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <Tabs
          value={range}
          onValueChange={(v) => setRange(v as DateRange)}
          className="w-auto"
        >
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
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.totalPageviews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All page views in selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.uniqueVisitors.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Distinct visitors based on session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clinic Views</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.clinicViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Individual clinic page views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Views Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Over Time</CardTitle>
          <CardDescription>
            Daily page views and unique visitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewsOverTime.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No data available for the selected period
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart
                data={viewsOverTime}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => formatDate(value as string)}
                    />
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="var(--color-views)"
                  strokeWidth={2}
                  dot={false}
                  name="Page Views"
                />
                <Line
                  type="monotone"
                  dataKey="uniqueVisitors"
                  stroke="var(--color-uniqueVisitors)"
                  strokeWidth={2}
                  dot={false}
                  name="Unique Visitors"
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Two column layout for tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top Referrers
            </CardTitle>
            <CardDescription>
              Traffic sources for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referrers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No referrer data available
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Visits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrers.map((referrer) => (
                    <TableRow key={referrer.source}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              REFERRER_COLORS[referrer.source] || "bg-gray-400"
                            }`}
                          />
                          <span className="capitalize">
                            {referrer.source === "direct"
                              ? "Direct / None"
                              : referrer.source}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">
                          {referrer.count.toLocaleString()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Top Pages
            </CardTitle>
            <CardDescription>
              Most viewed pages in the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topPages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No page data available
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Visitors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPages.map((page) => (
                    <TableRow key={page.path}>
                      <TableCell
                        className="font-mono text-sm max-w-[200px]"
                        title={page.path}
                      >
                        {formatPath(page.path)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">
                          {page.views.toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {page.uniqueVisitors.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
