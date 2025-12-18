"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Download,
  ExternalLink,
  Copy,
  RefreshCw,
  FolderOpen,
  Tag,
  FileText,
  ImageIcon,
  ArrowRight,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MigrationStats } from "./migration-progress";

interface MigrationResultsProps {
  stats: MigrationStats;
  onReset: () => void;
}

export function MigrationResults({ stats, onReset }: MigrationResultsProps) {
  const [redirectsData, setRedirectsData] = useState<{
    count: number;
    configSnippet: string;
    redirects: Array<{ source: string; destination: string; permanent: boolean }>;
  } | null>(null);
  const [loadingRedirects, setLoadingRedirects] = useState(false);
  const [copiedRedirects, setCopiedRedirects] = useState(false);

  const successRate =
    stats.postsProcessed > 0
      ? Math.round((stats.postsSuccess / stats.postsProcessed) * 100)
      : 0;

  const handleExportRedirects = async () => {
    setLoadingRedirects(true);
    try {
      const res = await fetch("/api/admin/blog/migration/redirects");
      const data = await res.json();
      setRedirectsData(data);
    } catch (err) {
      console.error("Failed to fetch redirects:", err);
    } finally {
      setLoadingRedirects(false);
    }
  };

  const handleCopyRedirects = () => {
    if (redirectsData?.configSnippet) {
      navigator.clipboard.writeText(redirectsData.configSnippet);
      setCopiedRedirects(true);
      setTimeout(() => setCopiedRedirects(false), 2000);
    }
  };

  const handleDownloadCSV = () => {
    const csvData = [
      ["Metric", "Value"],
      ["Batch ID", stats.batchId],
      ["Categories Created", stats.categoriesCreated.toString()],
      ["Tags Created", stats.tagsCreated.toString()],
      ["Posts Processed", stats.postsProcessed.toString()],
      ["Posts Imported", stats.postsSuccess.toString()],
      ["Posts Skipped", stats.postsSkipped.toString()],
      ["Posts Failed", stats.postsError.toString()],
      ["Images Processed", stats.imagesProcessed.toString()],
      ["Images Migrated", stats.imagesSuccess.toString()],
      ["Images Failed", stats.imagesError.toString()],
      ["Redirects Generated", stats.redirectsCount.toString()],
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `migration-results-${stats.batchId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-green-700 dark:text-green-400">
                Migration Completed Successfully
              </h2>
              <p className="text-sm text-green-600 dark:text-green-500">
                {stats.postsSuccess} posts imported with {successRate}% success rate
              </p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-500">
              Batch: {stats.batchId.slice(0, 8)}...
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-600">
                {stats.postsSuccess}
              </span>
              <span className="text-muted-foreground">imported</span>
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary">{stats.postsSkipped} skipped</Badge>
              {stats.postsError > 0 && (
                <Badge variant="destructive">{stats.postsError} failed</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.categoriesCreated}</p>
            <p className="text-sm text-muted-foreground mt-1">created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.tagsCreated}</p>
            <p className="text-sm text-muted-foreground mt-1">created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-600">
                {stats.imagesSuccess}
              </span>
              <span className="text-muted-foreground">migrated</span>
            </div>
            {stats.imagesError > 0 && (
              <Badge variant="destructive" className="mt-2">
                {stats.imagesError} failed
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Redirects Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            URL Redirects
          </CardTitle>
          <CardDescription>
            {stats.redirectsCount} redirects generated for old WordPress URLs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!redirectsData ? (
            <Button
              onClick={handleExportRedirects}
              disabled={loadingRedirects}
              variant="outline"
            >
              {loadingRedirects ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Load Redirect Config
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Add this to your <code className="bg-muted px-1 rounded">next.config.ts</code>:
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyRedirects}
                >
                  {copiedRedirects ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Config
                    </>
                  )}
                </Button>
              </div>
              <ScrollArea className="h-[200px] rounded-md border bg-muted/30">
                <pre className="p-4 text-xs overflow-x-auto">
                  <code>{redirectsData.configSnippet}</code>
                </pre>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" asChild>
                <a href="/blog" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Blog
                </a>
              </Button>
            </div>
            <Button onClick={onReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Start New Migration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Errors Summary */}
      {stats.errorsCount > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Errors ({stats.errorsCount})
            </CardTitle>
            <CardDescription>
              Some items encountered errors during migration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Check the batch details in the admin panel for a full error report.
              You can view the batch at:
            </p>
            <code className="block mt-2 p-2 bg-muted rounded text-sm">
              /api/admin/blog/migration/status?batchId={stats.batchId}
            </code>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
