"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  ImageIcon,
  FolderOpen,
  Tag,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface MigrationStats {
  batchId: string;
  categoriesCreated: number;
  tagsCreated: number;
  postsProcessed: number;
  postsSuccess: number;
  postsError: number;
  postsSkipped: number;
  imagesProcessed: number;
  imagesSuccess: number;
  imagesError: number;
  redirectsCount: number;
  errorsCount: number;
}

interface MigrationProgressProps {
  skipExisting: boolean;
  migrateImages: boolean;
  onComplete: (stats: MigrationStats) => void;
}

type Phase = "starting" | "categories" | "tags" | "posts" | "redirects" | "complete" | "error";

interface ProgressState {
  phase: Phase;
  current: number;
  total: number;
  item: string | undefined;
  subphase: string | undefined;
  message: string | undefined;
}

interface LogEntry {
  id: number;
  type: "status" | "progress" | "image" | "post_complete" | "post_skipped" | "post_error" | "error";
  message: string;
  timestamp: Date;
}

export function MigrationProgress({
  skipExisting,
  migrateImages,
  onComplete,
}: MigrationProgressProps) {
  const [progress, setProgress] = useState<ProgressState>({
    phase: "starting",
    current: 0,
    total: 0,
    item: undefined,
    subphase: undefined,
    message: "Starting migration...",
  });
  const [stats, setStats] = useState({
    categoriesCreated: 0,
    tagsCreated: 0,
    postsProcessed: 0,
    postsSuccess: 0,
    postsError: 0,
    postsSkipped: 0,
    imagesProcessed: 0,
    imagesSuccess: 0,
    imagesError: 0,
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const logIdRef = useRef(0);
  const hasStartedRef = useRef(false);

  const addLog = useCallback((type: LogEntry["type"], message: string) => {
    setLogs((prev) => [
      ...prev,
      {
        id: logIdRef.current++,
        type,
        message,
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const startMigration = async () => {
      try {
        const response = await fetch("/api/admin/blog/migration/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ skipExisting, migrateImages }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Migration failed to start");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response stream");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let currentEvent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                handleSSEEvent(currentEvent, data);
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Migration failed");
        setProgress((prev) => ({ ...prev, phase: "error" }));
        addLog("error", err instanceof Error ? err.message : "Unknown error");
      }
    };

    const handleSSEEvent = (event: string, data: Record<string, unknown>) => {
      switch (event) {
        case "status":
          setProgress((prev) => ({
            ...prev,
            phase: data.phase as Phase,
            message: data.message as string,
          }));
          addLog("status", data.message as string);
          break;

        case "progress":
          setProgress({
            phase: data.phase as Phase,
            current: data.current as number,
            total: data.total as number,
            item: data.item as string | undefined,
            subphase: data.subphase as string | undefined,
            message: data.message as string | undefined,
          });

          // Update stats based on phase
          const total = data.total as number;
          const current = data.current as number;
          if (data.phase === "categories" && current === total && total > 0) {
            setStats((prev) => ({ ...prev, categoriesCreated: total }));
          } else if (data.phase === "tags" && current === total && total > 0) {
            setStats((prev) => ({ ...prev, tagsCreated: total }));
          }
          break;

        case "image":
          addLog("image", `Migrating image ${data.current}/${data.total}: ${data.url}`);
          setStats((prev) => ({
            ...prev,
            imagesProcessed: prev.imagesProcessed + 1,
          }));
          break;

        case "post_complete":
          addLog("post_complete", `Imported: ${data.title} (${data.imagesCount} images)`);
          setStats((prev) => ({
            ...prev,
            postsProcessed: prev.postsProcessed + 1,
            postsSuccess: prev.postsSuccess + 1,
            imagesSuccess: prev.imagesSuccess + (data.imagesCount as number || 0),
          }));
          break;

        case "post_skipped":
          addLog("post_skipped", `Skipped: ${data.slug} - ${data.reason}`);
          setStats((prev) => ({
            ...prev,
            postsProcessed: prev.postsProcessed + 1,
            postsSkipped: prev.postsSkipped + 1,
          }));
          break;

        case "post_error":
          addLog("post_error", `Error: ${data.slug} - ${data.error}`);
          setStats((prev) => ({
            ...prev,
            postsProcessed: prev.postsProcessed + 1,
            postsError: prev.postsError + 1,
          }));
          break;

        case "complete":
          setProgress((prev) => ({ ...prev, phase: "complete" }));
          const completeStats = data.stats as MigrationStats["categoriesCreated"] extends number
            ? typeof data.stats
            : never;
          onComplete({
            batchId: data.batchId as string,
            categoriesCreated: (completeStats as { categoriesCreated: number }).categoriesCreated,
            tagsCreated: (completeStats as { tagsCreated: number }).tagsCreated,
            postsProcessed: (completeStats as { postsProcessed: number }).postsProcessed,
            postsSuccess: (completeStats as { postsSuccess: number }).postsSuccess,
            postsError: (completeStats as { postsError: number }).postsError,
            postsSkipped: (completeStats as { postsSkipped: number }).postsSkipped,
            imagesProcessed: (completeStats as { imagesProcessed: number }).imagesProcessed,
            imagesSuccess: (completeStats as { imagesSuccess: number }).imagesSuccess,
            imagesError: (completeStats as { imagesError: number }).imagesError,
            redirectsCount: data.redirectsCount as number,
            errorsCount: data.errorsCount as number,
          });
          addLog("status", "Migration completed!");
          break;

        case "error":
          setError(data.message as string);
          setProgress((prev) => ({ ...prev, phase: "error" }));
          addLog("error", data.message as string);
          break;
      }
    };

    startMigration();
  }, [skipExisting, migrateImages, onComplete, addLog]);

  const getPhaseIcon = (phase: Phase) => {
    switch (phase) {
      case "categories":
        return <FolderOpen className="h-5 w-5" />;
      case "tags":
        return <Tag className="h-5 w-5" />;
      case "posts":
        return <FileText className="h-5 w-5" />;
      case "complete":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <RefreshCw className="h-5 w-5 animate-spin" />;
    }
  };

  const percentage = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getPhaseIcon(progress.phase)}
            Migration in Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Current phase */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize">
                {progress.phase === "starting" ? "Starting..." : progress.phase}
              </span>
              <span className="text-sm text-muted-foreground">
                {progress.current} / {progress.total}
              </span>
            </div>
            <Progress value={percentage} className="h-3" />
            {progress.item && (
              <p className="text-sm text-muted-foreground truncate">
                {progress.subphase && (
                  <Badge variant="outline" className="mr-2">
                    {progress.subphase}
                  </Badge>
                )}
                {progress.item}
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                <FolderOpen className="h-4 w-4" />
                <span className="font-semibold">{stats.categoriesCreated}</span>
              </div>
              <p className="text-xs text-muted-foreground">Categories</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                <Tag className="h-4 w-4" />
                <span className="font-semibold">{stats.tagsCreated}</span>
              </div>
              <p className="text-xs text-muted-foreground">Tags</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-semibold">{stats.postsSuccess}</span>
              </div>
              <p className="text-xs text-muted-foreground">Posts Imported</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                <ImageIcon className="h-4 w-4" />
                <span className="font-semibold">{stats.imagesProcessed}</span>
              </div>
              <p className="text-xs text-muted-foreground">Images</p>
            </div>
          </div>

          {/* Secondary stats */}
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>{stats.postsSkipped} skipped</span>
            </div>
            <div className="flex items-center gap-1 text-destructive">
              <span>{stats.postsError} errors</span>
            </div>
          </div>

          {/* Loading indicator */}
          {progress.phase !== "complete" && progress.phase !== "error" && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground animate-pulse">
              <div
                className="h-2 w-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="h-2 w-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="h-2 w-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 text-sm py-1 border-b border-muted last:border-0"
                >
                  <span className="text-muted-foreground text-xs shrink-0 w-16">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <LogIcon type={log.type} />
                  <span
                    className={
                      log.type === "error" || log.type === "post_error"
                        ? "text-destructive"
                        : log.type === "post_skipped"
                          ? "text-muted-foreground"
                          : ""
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function LogIcon({ type }: { type: LogEntry["type"] }) {
  switch (type) {
    case "post_complete":
      return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
    case "post_error":
    case "error":
      return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
    case "post_skipped":
      return <span className="h-4 w-4 text-muted-foreground shrink-0">-</span>;
    case "image":
      return <ImageIcon className="h-4 w-4 text-primary shrink-0" />;
    default:
      return <RefreshCw className="h-4 w-4 text-primary shrink-0" />;
  }
}
