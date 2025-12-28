"use client";

import { useState } from "react";
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
import { REFERRER_COLORS } from "@/lib/analytics/constants";
import { useTrafficAnalytics } from "@/lib/analytics/hooks";
import { getReferrerLabel } from "@/lib/analytics/referrer-utils";
import type { DateRange } from "@/types/analytics";

const chartConfig = {
  views: {
    label: "Page Views",
    color: "hsl(210 100% 60%)", // Bright blue - visible on both light/dark
  },
  uniqueVisitors: {
    label: "Unique Visitors",
    color: "hsl(150 80% 50%)", // Bright green - visible on both light/dark
  },
} satisfies ChartConfig;

export function TrafficAnalyticsClient() {
  const [range, setRange] = useState<DateRange>("30d");
  const { data, isLoading, isError, refresh } = useTrafficAnalytics(range);

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

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive mb-4">Failed to load analytics data</p>
        <Button variant="outline" size="sm" onClick={() => refresh()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
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

  // Debug: Log what we received
  if (process.env.NODE_ENV === "development") {
    console.log("Analytics data:", { overview, referrersCount: referrers.length, topPagesCount: topPages.length, viewsOverTimeCount: viewsOverTime.length, viewsOverTime });
  }

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
          onClick={() => refresh()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
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
                  strokeWidth={3}
                  dot={{ fill: "var(--color-views)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  name="Page Views"
                />
                <Line
                  type="monotone"
                  dataKey="uniqueVisitors"
                  stroke="var(--color-uniqueVisitors)"
                  strokeWidth={3}
                  dot={{ fill: "var(--color-uniqueVisitors)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
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
                            {getReferrerLabel(referrer.source)}
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
