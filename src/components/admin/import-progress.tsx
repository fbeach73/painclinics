"use client";

import { RefreshCw, FileText, Database, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ImportProgressProps {
  inProgress?: boolean;
  currentFile?: string;
  currentRecord?: number;
  totalRecords?: number;
  currentBatch?: number;
  totalBatches?: number;
  successCount?: number;
  errorCount?: number;
  skipCount?: number;
  message?: string;
}

export function ImportProgress({
  inProgress = false,
  currentFile,
  currentRecord = 0,
  totalRecords = 0,
  currentBatch = 0,
  totalBatches = 0,
  successCount = 0,
  errorCount = 0,
  skipCount = 0,
  message,
}: ImportProgressProps) {
  const percentage = totalRecords > 0 ? Math.round((currentRecord / totalRecords) * 100) : 0;
  const batchPercentage = totalBatches > 0 ? Math.round((currentBatch / totalBatches) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className={`h-5 w-5 ${inProgress ? "animate-spin" : ""}`} />
          Import in Progress
        </CardTitle>
        <CardDescription>
          {message || "Processing clinic data..."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current file */}
        {currentFile && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>Processing: {currentFile}</span>
          </div>
        )}

        {/* Batch progress */}
        {totalBatches > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Batch Progress</span>
              <span>{currentBatch} / {totalBatches} batches</span>
            </div>
            <Progress value={batchPercentage} className="h-2" />
          </div>
        )}

        {/* Record progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{currentRecord.toLocaleString()} / {totalRecords.toLocaleString()} records ({percentage}%)</span>
          </div>
          <Progress value={percentage} className="h-3" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-semibold">{successCount.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground">Imported</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-destructive mb-1">
              <Database className="h-4 w-4" />
              <span className="font-semibold">{errorCount.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground">Errors</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <span className="font-semibold">{skipCount.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground">Skipped</p>
          </div>
        </div>

        {/* Loading indicator */}
        {inProgress && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground animate-pulse">
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
