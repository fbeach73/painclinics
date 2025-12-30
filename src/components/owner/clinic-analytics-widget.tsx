"use client";

import { Eye, Users, TrendingUp, RefreshCw } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { REFERRER_BADGE_COLORS } from "@/lib/analytics/constants";
import { useClinicAnalytics } from "@/lib/analytics/hooks";
import { getReferrerLabel } from "@/lib/analytics/referrer-utils";

interface ClinicAnalyticsWidgetProps {
  clinicId: string;
}

export function ClinicAnalyticsWidget({ clinicId }: ClinicAnalyticsWidgetProps) {
  const { data, isLoading, isError } = useClinicAnalytics(clinicId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analytics
          </CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analytics
          </CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            No analytics data available yet
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasChartData = data.viewsOverTime.length > 0;
  const hasReferrers = data.referrers.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Analytics
        </CardTitle>
        <CardDescription>Last 30 days performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.totalViews.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Views</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data.uniqueVisitors.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Unique Visitors</p>
            </div>
          </div>
        </div>

        {/* Sparkline Chart */}
        {hasChartData && (
          <div className="h-12 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.viewsOverTime}>
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Referrer Badges */}
        {hasReferrers && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Top Traffic Sources</p>
            <div className="flex flex-wrap gap-2">
              {data.referrers.slice(0, 5).map((referrer) => (
                <Badge
                  key={referrer.source}
                  className={REFERRER_BADGE_COLORS[referrer.source] || "bg-gray-400 text-white"}
                >
                  <span className="capitalize">
                    {getReferrerLabel(referrer.source)}
                  </span>
                  <span className="ml-1 opacity-75">({referrer.count})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {!hasChartData && !hasReferrers && data.totalViews === 0 && (
          <p className="text-muted-foreground text-sm text-center">
            No visits recorded yet. Analytics will appear once visitors find your listing.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
