"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  RefreshCw,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  MousePointerClick,
  Clock,
  ArrowUpDown,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface EmailStats {
  total: number;
  delivered: number;
  bounced: number;
  complained: number;
  failed: number;
  opened: number;
  clicked: number;
  queued: number;
}

interface StatsResponse {
  stats: EmailStats;
  rates: {
    delivery: string;
    bounce: string;
    complaint: string;
    open: string;
    click: string;
  };
  byTemplate: Array<{
    templateName: string;
    total: number;
    delivered: number;
    bounced: number;
    failed: number;
    opened: number;
    clicked: number;
  }>;
}

interface EmailLog {
  id: string;
  userId: string | null;
  recipientEmail: string;
  templateName: string;
  subject: string;
  mailgunMessageId: string | null;
  status: string;
  metadata: Record<string, string> | null;
  errorMessage: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  bouncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LogsResponse {
  logs: EmailLog[];
  total: number;
  limit: number;
  offset: number;
  templates: string[];
  statuses: string[];
}

interface StatusConfig {
  label: string;
  color: string;
  icon: React.ReactNode;
}

const defaultConfig: StatusConfig = { label: "Queued", color: "bg-gray-500", icon: <Clock className="h-3 w-3" /> };

const statusConfig: Record<string, StatusConfig> = {
  queued: defaultConfig,
  delivered: { label: "Delivered", color: "bg-green-500", icon: <CheckCircle2 className="h-3 w-3" /> },
  bounced: { label: "Bounced", color: "bg-red-500", icon: <XCircle className="h-3 w-3" /> },
  complained: { label: "Complained", color: "bg-orange-500", icon: <AlertTriangle className="h-3 w-3" /> },
  failed: { label: "Failed", color: "bg-red-600", icon: <XCircle className="h-3 w-3" /> },
  opened: { label: "Opened", color: "bg-blue-500", icon: <Eye className="h-3 w-3" /> },
  clicked: { label: "Clicked", color: "bg-purple-500", icon: <MousePointerClick className="h-3 w-3" /> },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTemplateName(name: string): string {
  return name
    .replace(/-/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export function EmailsClient() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [templateFilter, setTemplateFilter] = useState<string>("all");
  const [recipientFilter, setRecipientFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/emails/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("limit", pageSize.toString());
      params.set("offset", (page * pageSize).toString());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (templateFilter !== "all") params.set("template", templateFilter);
      if (recipientFilter) params.set("recipient", recipientFilter);

      const response = await fetch(`/api/admin/emails?${params}`);
      if (!response.ok) throw new Error("Failed to fetch logs");
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, templateFilter, recipientFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleRefresh = () => {
    fetchStats();
    fetchLogs();
  };

  const totalPages = logs ? Math.ceil(logs.total / pageSize) : 0;

  if (loading && !logs) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
          <Button onClick={handleRefresh} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {stats.stats.total.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Delivered</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-green-600">
                {stats.rates.delivery}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs text-muted-foreground">Bounced</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-red-600">
                {stats.rates.bounce}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-xs text-muted-foreground">Complaints</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-orange-600">
                {stats.rates.complaint}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Open Rate</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-blue-600">
                {stats.rates.open}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Click Rate</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-purple-600">
                {stats.rates.click}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-muted-foreground">Queued</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {stats.stats.queued.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-xs text-muted-foreground">Failed</span>
              </div>
              <div className="text-2xl font-bold mt-1 text-red-700">
                {stats.stats.failed.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats by Template */}
      {stats && stats.byTemplate.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Stats by Template</CardTitle>
            <CardDescription>Breakdown of email performance by template type</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Delivered</TableHead>
                  <TableHead className="text-right">Opened</TableHead>
                  <TableHead className="text-right">Clicked</TableHead>
                  <TableHead className="text-right">Bounced</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.byTemplate.map((t) => (
                  <TableRow key={t.templateName}>
                    <TableCell className="font-medium">
                      {formatTemplateName(t.templateName)}
                    </TableCell>
                    <TableCell className="text-right">{t.total}</TableCell>
                    <TableCell className="text-right text-green-600">{t.delivered}</TableCell>
                    <TableCell className="text-right text-blue-600">{t.opened}</TableCell>
                    <TableCell className="text-right text-purple-600">{t.clicked}</TableCell>
                    <TableCell className="text-right text-red-600">{t.bounced}</TableCell>
                    <TableCell className="text-right text-red-700">{t.failed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Status:</label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {logs?.statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusConfig[s]?.label || s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Template:</label>
              <Select value={templateFilter} onValueChange={(v) => { setTemplateFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Templates</SelectItem>
                  {logs?.templates.map((t) => (
                    <SelectItem key={t} value={t}>
                      {formatTemplateName(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Recipient:</label>
              <Input
                placeholder="Email address..."
                value={recipientFilter}
                onChange={(e) => setRecipientFilter(e.target.value)}
                className="w-[200px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(0);
                    fetchLogs();
                  }
                }}
              />
            </div>

            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email Logs</CardTitle>
            </div>
            {logs && (
              <span className="text-sm text-muted-foreground">
                {logs.total.toLocaleString()} total emails
              </span>
            )}
          </div>
          <CardDescription>
            Recent email activity and delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!logs || logs.logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No email logs found</p>
              <p className="text-sm">
                {statusFilter !== "all" || templateFilter !== "all" || recipientFilter
                  ? "Try adjusting your filters"
                  : "Emails will appear here once they are sent"}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">
                      <div className="flex items-center gap-1">
                        Sent
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.logs.map((log) => {
                    const config = statusConfig[log.status] ?? defaultConfig;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(log.sentAt)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.recipientEmail}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {formatTemplateName(log.templateName)}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">
                          {log.subject}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${config.color} hover:${config.color}`}>
                            {config.icon}
                            <span className="ml-1">{config.label}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-sm text-red-600">
                          {log.errorMessage || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
