"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  DollarSign,
  FileText,
  Loader2,
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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OptimizationBatch {
  id: string;
  name: string | null;
  status: string | null;
  batchSize: number | null;
  reviewFrequency: number | null;
  targetWordCount: number | null;
  totalClinics: number | null;
  processedCount: number | null;
  successCount: number | null;
  errorCount: number | null;
  skippedCount: number | null;
  pendingReviewCount: number | null;
  approvedCount: number | null;
  rejectedCount: number | null;
  totalInputTokens: number | null;
  totalOutputTokens: number | null;
  estimatedCost: number | null;
  errors: Array<{ clinicId: string; error: string }> | null;
  aiModel: string | null;
  createdAt: string;
  startedAt: string | null;
  pausedAt: string | null;
  completedAt: string | null;
}

interface VersionStats {
  pending: number;
  approved: number;
  rejected: number;
  applied: number;
  rolledBack: number;
}

interface ContentVersion {
  id: string;
  clinicId: string;
  clinicTitle: string;
  clinicCity: string;
  clinicState: string;
  status: string;
  wordCountBefore: number | null;
  wordCountAfter: number | null;
  cost: number | null;
  validationPassed: boolean | null;
  requiresManualReview: boolean | null;
  createdAt: string;
}

interface LogEntry {
  type: "status" | "progress" | "success" | "error" | "complete" | "pause";
  message: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.batchId as string;

  const [batch, setBatch] = useState<OptimizationBatch | null>(null);
  const [versionStats, setVersionStats] = useState<VersionStats | null>(null);
  const [recentVersions, setRecentVersions] = useState<ContentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [...prev.slice(-99), entry]);
  }, []);

  const fetchBatch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/optimize/${batchId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch batch details");
      }
      const data = await response.json();
      setBatch(data.batch);
      setVersionStats(data.versionStats);
      setRecentVersions(data.recentVersions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const startProcessing = async () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setIsProcessing(true);
    setLogs([]);
    addLog({
      type: "status",
      message: "Connecting to server...",
      timestamp: new Date(),
    });

    const eventSource = new EventSource(
      `/api/admin/optimize/${batchId}/execute`,
      { withCredentials: true }
    );
    eventSourceRef.current = eventSource;

    // We need to use POST for the execute endpoint
    // EventSource only supports GET, so we'll use fetch with streaming instead
    try {
      const response = await fetch(`/api/admin/optimize/${batchId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to start processing");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("event:")) {
            // Event type parsing - currently unused but kept for future SSE event handling
            continue;
          }
          if (line.startsWith("data:")) {
            try {
              const data = JSON.parse(line.replace("data:", "").trim());

              if (data.message) {
                addLog({
                  type: "status",
                  message: data.message,
                  timestamp: new Date(),
                  data,
                });
              }

              if (data.clinicTitle) {
                if (data.error) {
                  addLog({
                    type: "error",
                    message: `Error: ${data.clinicTitle} - ${data.error}`,
                    timestamp: new Date(),
                    data,
                  });
                } else if (data.wordCountAfter !== undefined) {
                  addLog({
                    type: "success",
                    message: `Optimized: ${data.clinicTitle} (${data.wordCountBefore} -> ${data.wordCountAfter} words)`,
                    timestamp: new Date(),
                    data,
                  });
                } else {
                  addLog({
                    type: "progress",
                    message: `Processing: ${data.clinicTitle} (${data.current}/${data.total})`,
                    timestamp: new Date(),
                    data,
                  });
                }
              }

              if (data.status === "completed" || data.status === "failed") {
                addLog({
                  type: "complete",
                  message: `Batch ${data.status}: ${data.successCount} success, ${data.errorCount} errors`,
                  timestamp: new Date(),
                  data,
                });
                setIsProcessing(false);
                fetchBatch();
              }

              if (data.pendingReviewCount !== undefined && data.message?.includes("Paused")) {
                addLog({
                  type: "pause",
                  message: data.message,
                  timestamp: new Date(),
                  data,
                });
                setIsProcessing(false);
                fetchBatch();
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      addLog({
        type: "error",
        message: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
        timestamp: new Date(),
      });
      setIsProcessing(false);
    }
  };

  const pauseProcessing = async () => {
    setActionLoading("pause");
    try {
      const response = await fetch(`/api/admin/optimize/${batchId}/pause`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to pause batch");
      }
      addLog({
        type: "pause",
        message: "Batch paused by user",
        timestamp: new Date(),
      });
      fetchBatch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setActionLoading(null);
    }
  };

  const rollbackBatch = async () => {
    if (
      !confirm(
        "Are you sure you want to rollback all applied content? This will restore original content for all clinics in this batch."
      )
    ) {
      return;
    }

    setActionLoading("rollback");
    try {
      const response = await fetch(`/api/admin/optimize/${batchId}/rollback`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to rollback batch");
      }
      const data = await response.json();
      addLog({
        type: "status",
        message: `Rolled back ${data.rolledBackCount} content versions`,
        timestamp: new Date(),
      });
      fetchBatch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setActionLoading(null);
    }
  };

  const cancelBatch = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel this batch? All pending content versions will be deleted."
      )
    ) {
      return;
    }

    setActionLoading("cancel");
    try {
      const response = await fetch(`/api/admin/optimize/${batchId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to cancel batch");
      }
      router.push("/admin/optimize");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-500">
            <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case "paused":
        return (
          <Badge variant="outline">
            <Pause className="mr-1 h-3 w-3" />
            Paused
          </Badge>
        );
      case "awaiting_review":
        return (
          <Badge className="bg-yellow-500">
            <AlertCircle className="mr-1 h-3 w-3" />
            Awaiting Review
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error || "Batch not found"}</p>
            <Link href="/admin/optimize">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress =
    batch.totalClinics && batch.processedCount
      ? Math.round((batch.processedCount / batch.totalClinics) * 100)
      : 0;

  const canStart = ["pending", "paused", "awaiting_review"].includes(
    batch.status || ""
  );
  const canPause = batch.status === "processing";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/optimize"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            {batch.name || `Batch ${batch.id.slice(0, 8)}`}
            {getStatusBadge(batch.status)}
          </h1>
          <p className="text-muted-foreground mt-1">
            Created {new Date(batch.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          {canStart && (
            <Button
              onClick={startProcessing}
              disabled={isProcessing || !!actionLoading}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  {batch.status === "pending" ? "Start" : "Resume"}
                </>
              )}
            </Button>
          )}
          {canPause && (
            <Button
              variant="outline"
              onClick={pauseProcessing}
              disabled={actionLoading === "pause"}
            >
              {actionLoading === "pause" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Pause className="mr-2 h-4 w-4" />
              )}
              Pause
            </Button>
          )}
          {versionStats && versionStats.applied > 0 && (
            <Button
              variant="outline"
              onClick={rollbackBatch}
              disabled={!!actionLoading}
            >
              {actionLoading === "rollback" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Rollback
            </Button>
          )}
          {["pending", "paused", "awaiting_review"].includes(batch.status || "") && (
            <Button
              variant="destructive"
              onClick={cancelBatch}
              disabled={!!actionLoading}
            >
              {actionLoading === "cancel" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {batch.processedCount || 0} / {batch.totalClinics} clinics
              </span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{batch.totalClinics || 0}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {batch.successCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Success</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">
              {batch.errorCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">Errors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">
              {batch.pendingReviewCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              <Link href="/admin/optimize/review" className="hover:underline">
                Pending Review
              </Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">
              {versionStats?.applied || 0}
            </div>
            <p className="text-xs text-muted-foreground">Applied</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold flex items-center">
              <DollarSign className="h-5 w-5" />
              {(batch.estimatedCost || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Review Alert */}
      {(batch.pendingReviewCount || 0) > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span>
                <strong>{batch.pendingReviewCount}</strong> content versions
                pending review
              </span>
            </div>
            <Link href="/admin/optimize/review">
              <Button variant="outline" size="sm">
                Review Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Processing Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Log</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full rounded border p-4">
              <div className="space-y-1 font-mono text-xs">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 ${
                      log.type === "error"
                        ? "text-red-600"
                        : log.type === "success"
                        ? "text-green-600"
                        : log.type === "complete"
                        ? "text-blue-600 font-bold"
                        : log.type === "pause"
                        ? "text-yellow-600 font-bold"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span className="opacity-50">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span>{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Recent Content Versions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Optimizations</CardTitle>
          <CardDescription>
            Content versions created in this batch
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentVersions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No optimizations yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentVersions.slice(0, 20).map((version) => (
                <Link
                  key={version.id}
                  href={`/admin/optimize/review?version=${version.id}`}
                  className="block"
                >
                  <div className="border rounded p-3 hover:bg-muted/50 transition-colors text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {version.clinicTitle}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {version.status}
                        </Badge>
                        {version.requiresManualReview && (
                          <Badge variant="destructive" className="text-xs">
                            Review
                          </Badge>
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {version.clinicCity}, {version.clinicState}
                      </span>
                    </div>
                    {version.wordCountBefore && version.wordCountAfter && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {version.wordCountBefore} → {version.wordCountAfter}{" "}
                        words (
                        {Math.round(
                          ((version.wordCountBefore - version.wordCountAfter) /
                            version.wordCountBefore) *
                            100
                        )}
                        % reduction)
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Batch Size:</span>{" "}
              <span className="font-medium">{batch.batchSize}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Review Frequency:</span>{" "}
              <span className="font-medium">{batch.reviewFrequency}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Target Words:</span>{" "}
              <span className="font-medium">{batch.targetWordCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">AI Model:</span>{" "}
              <span className="font-medium">{batch.aiModel}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
