"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Neon Launch plan pricing (as of 2026)
const PRICING = {
  compute_per_hour: 0.16, // per CU-hour
  storage_per_gb_month: 0.35,
  transfer_per_gb: 0.09,
};

interface DayMetrics {
  date: string;
  compute_seconds: number;
  storage_bytes: number;
  transfer_bytes: number;
  compute_cost: number;
  storage_cost: number;
  transfer_cost: number;
  total_cost: number;
}

interface NeonConsumption {
  timeframe_start: string;
  timeframe_end: string;
  metrics: Array<{ metric_name: string; value: number }>;
}

interface NeonProject {
  project_id: string;
  periods: Array<{
    period_id: string;
    period_plan: string;
    consumption: NeonConsumption[];
  }>;
}

interface NeonResponse {
  projects: NeonProject[];
}

function parseMetrics(consumption: NeonConsumption[]): DayMetrics[] {
  return consumption.map((c) => {
    const metricsMap: Record<string, number> = {};
    for (const m of c.metrics) {
      metricsMap[m.metric_name] = m.value;
    }

    const computeSeconds = metricsMap["compute_unit_seconds"] || 0;
    const storageBytes =
      (metricsMap["root_branch_bytes_month"] || 0) +
      (metricsMap["child_branch_bytes_month"] || 0) +
      (metricsMap["instant_restore_bytes_month"] || 0);
    const transferBytes =
      metricsMap["public_network_transfer_bytes"] || 0;

    // Convert to costs
    const computeHours = computeSeconds / 3600;
    const storageGb = storageBytes / (1024 * 1024 * 1024);
    const transferGb = transferBytes / (1024 * 1024 * 1024);

    const computeCost = computeHours * PRICING.compute_per_hour;
    // Storage is billed per GB-month, daily value is already prorated by Neon
    const storageCost = storageGb * PRICING.storage_per_gb_month;
    const transferCost = transferGb * PRICING.transfer_per_gb;

    return {
      date: c.timeframe_start ?? "",
      compute_seconds: computeSeconds,
      storage_bytes: storageBytes,
      transfer_bytes: transferBytes,
      compute_cost: computeCost,
      storage_cost: storageCost,
      transfer_cost: transferCost,
      total_cost: computeCost + storageCost + transferCost,
    };
  });
}

function formatCost(cents: number): string {
  if (cents < 0.01) return "<$0.01";
  return `$${cents.toFixed(2)}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(1)} ${units[i]}`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
  return `${(seconds / 3600).toFixed(2)}h`;
}

export function BillingClient() {
  const [data, setData] = useState<DayMetrics[] | null>(null);
  const [plan, setPlan] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("30");

  useEffect(() => {
    async function fetchBilling() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (days === "today") {
          params.set("days", "1");
          params.set("granularity", "hourly");
        } else if (days === "yesterday") {
          params.set("days", "2");
          params.set("granularity", "hourly");
        } else if (days === "mtd") {
          const now = new Date();
          const dayOfMonth = now.getUTCDate();
          params.set("days", String(dayOfMonth));
        } else {
          params.set("days", days);
        }
        const res = await fetch(`/api/admin/billing?${params.toString()}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const json: NeonResponse = await res.json();

        if (!json.projects || json.projects.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        const project = json.projects?.[0];
        if (!project) {
          setData([]);
          setLoading(false);
          return;
        }
        setProjectId(project.project_id);

        if (project.periods && project.periods.length > 0) {
          setPlan(project.periods[0]?.period_plan ?? "");
          const allConsumption = project.periods.flatMap((p) => p.consumption);
          let metrics = parseMetrics(allConsumption);
          // Filter for "today" or "yesterday" when using hourly
          if (days === "today") {
            const todayStr = new Date().toISOString().split("T")[0] ?? "";
            metrics = metrics.filter((m) => m.date.startsWith(todayStr));
          } else if (days === "yesterday") {
            const y = new Date();
            y.setDate(y.getDate() - 1);
            const yesterdayStr = y.toISOString().split("T")[0] ?? "";
            metrics = metrics.filter((m) => m.date.startsWith(yesterdayStr));
          }
          // Sort newest first
          metrics.sort((a, b) => b.date.localeCompare(a.date));
          setData(metrics);
        } else {
          setData([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, [days]);

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Make sure <code>NEON_API_KEY</code> is set in your environment
            variables. You can generate one at{" "}
            <a
              href="https://console.neon.tech/app/settings/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Neon Console → API Keys
            </a>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totals = data?.reduce(
    (acc, d) => ({
      compute_cost: acc.compute_cost + d.compute_cost,
      storage_cost: acc.storage_cost + d.storage_cost,
      transfer_cost: acc.transfer_cost + d.transfer_cost,
      total_cost: acc.total_cost + d.total_cost,
      compute_seconds: acc.compute_seconds + d.compute_seconds,
      transfer_bytes: acc.transfer_bytes + d.transfer_bytes,
    }),
    {
      compute_cost: 0,
      storage_cost: 0,
      transfer_cost: 0,
      total_cost: 0,
      compute_seconds: 0,
      transfer_bytes: 0,
    }
  );

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-4">
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="mtd">Month to date</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="60">Last 60 days</SelectItem>
          </SelectContent>
        </Select>
        {plan && (
          <Badge variant="secondary" className="capitalize">
            {plan} plan
          </Badge>
        )}
        {projectId && (
          <span className="text-xs text-muted-foreground font-mono">
            {projectId}
          </span>
        )}
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : totals ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>
                Total (
                {days === "today"
                  ? "today"
                  : days === "yesterday"
                    ? "yesterday"
                    : days === "mtd"
                      ? "month to date"
                      : `${days}d`}
                )
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">
                {formatCost(totals.total_cost)}
              </CardTitle>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Compute</CardDescription>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">
                {formatCost(totals.compute_cost)}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDuration(totals.compute_seconds)} total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Storage</CardDescription>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">
                {formatCost(totals.storage_cost)}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Latest:{" "}
                {data?.[0]
                  ? formatBytes(data[0].storage_bytes)
                  : "—"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Data Transfer</CardDescription>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl">
                {formatCost(totals.transfer_cost)}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {formatBytes(totals.transfer_bytes)} total
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Daily Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Breakdown</CardTitle>
          <CardDescription>
            Estimated costs based on Neon published rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : data && data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Compute</TableHead>
                  <TableHead className="text-right">Storage</TableHead>
                  <TableHead className="text-right">Transfer</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <TableRow key={d.date}>
                    <TableCell className="font-mono text-sm">
                      {d.date.includes("T")
                        ? d.date.replace("T", " ").replace(/:\d{2}Z$/, "").slice(0, 16)
                        : d.date}
                    </TableCell>
                    <TableCell className="text-right">
                      <span>{formatCost(d.compute_cost)}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({formatDuration(d.compute_seconds)})
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span>{formatCost(d.storage_cost)}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({formatBytes(d.storage_bytes)})
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span>{formatCost(d.transfer_cost)}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({formatBytes(d.transfer_bytes)})
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCost(d.total_cost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">
              No consumption data available for this period.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
