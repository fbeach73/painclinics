"use client";

import { useState } from "react";
import {
  Eye,
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import useSWR from "swr";
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
import { getReferrerLabel } from "@/lib/analytics/referrer-utils";

interface AnalyticsDashboardProps {
  clinicId: string;
  clinicName: string;
}

type DateRangeOption = "7" | "30" | "90";

const chartConfig = {
  views: {
    label: "Page Views",
    color: "hsl(210 100% 60%)",
  },
  uniqueVisitors: {
    label: "Unique Visitors",
    color: "hsl(150 80% 50%)",
  },
} satisfies ChartConfig;

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export function AnalyticsDashboard({
  clinicId,
  clinicName,
}: AnalyticsDashboardProps) {
  const [days, setDays] = useState<DateRangeOption>("30");

  const { data, error, isLoading, mutate } = useSWR(
    `/api/owner/analytics/detailed?clinicId=${clinicId}&days=${days}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive mb-4">Failed to load analytics data</p>
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const {
    totalViews = 0,
    uniqueVisitors = 0,
    viewsByDay = [],
    topReferrers = [],
    previousPeriodViews = 0,
    percentChange = 0,
  } = data || {};

  const isPositiveChange = percentChange >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">{clinicName}</p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs
            value={days}
            onValueChange={(v) => setDays(v as DateRangeOption)}
            className="w-auto"
          >
            <TabsList>
              <TabsTrigger value="7">7 Days</TabsTrigger>
              <TabsTrigger value="30">30 Days</TabsTrigger>
              <TabsTrigger value="90">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {isPositiveChange ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={isPositiveChange ? "text-green-600" : "text-red-600"}>
                {percentChange > 0 ? "+" : ""}
                {percentChange}%
              </span>
              <span>vs previous {days} days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {uniqueVisitors.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Distinct visitors based on session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trend</CardTitle>
            {isPositiveChange ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {previousPeriodViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Views in previous {days} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Views Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Over Time</CardTitle>
          <CardDescription>
            Daily page views and unique visitors for the last {days} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewsByDay.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No data available for the selected period
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart
                data={viewsByDay}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-views)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-views)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-uniqueVisitors)"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-uniqueVisitors)"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  className="text-xs"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis className="text-xs" tickLine={false} axisLine={false} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => formatDate(value as string)}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="var(--color-views)"
                  fill="url(#fillViews)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="uniqueVisitors"
                  stroke="var(--color-uniqueVisitors)"
                  fill="url(#fillVisitors)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Top Referrers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Traffic Sources
          </CardTitle>
          <CardDescription>
            Where your visitors are coming from
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topReferrers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No referrer data available yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topReferrers.map(
                  (referrer: { source: string; count: number }) => {
                    const share =
                      totalViews > 0
                        ? Math.round((referrer.count / totalViews) * 100)
                        : 0;
                    return (
                      <TableRow key={referrer.source}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                REFERRER_COLORS[referrer.source] || "bg-gray-400"
                              }`}
                            />
                            <span>{getReferrerLabel(referrer.source)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">
                            {referrer.count.toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {share}%
                        </TableCell>
                      </TableRow>
                    );
                  }
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
