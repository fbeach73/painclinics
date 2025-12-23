"use client";

import { useState, useEffect, useCallback } from "react";
import { Upload, FolderOpen, RefreshCw, AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { ImportPreview } from "@/components/admin/import-preview";
import { ImportProgress } from "@/components/admin/import-progress";
import { ImportResults } from "@/components/admin/import-results";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ImportBatch {
  id: string;
  fileName: string | null;
  status: string | null;
  totalRecords: number | null;
  successCount: number | null;
  errorCount: number | null;
  skipCount: number | null;
  createdAt: string;
  completedAt: string | null;
}

interface BatchStatus {
  files: string[];
  fileCount: number;
  dataDirectory: string;
  recentBatches: ImportBatch[];
  totalClinics: number;
}

type ImportMode = "idle" | "preview" | "progress" | "results";

export default function ImportPage() {
  const [status, setStatus] = useState<BatchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<{
    preview: Record<string, string>[];
    columns: string[];
    validationErrors: string[];
  } | null>(null);
  const [importResults, setImportResults] = useState<{
    batchId: string;
    status: string;
    totalRecords: number;
    successCount: number;
    errorCount: number;
    skipCount: number;
    errors: Array<{ row?: number; error: string }>;
  } | null>(null);
  const [batchImportInProgress, setBatchImportInProgress] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/import/batch");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch status");
      }
      const data = await res.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Please select a CSV file");
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Get preview
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/import/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to preview file");
      }

      const data = await res.json();
      // Map API response to expected shape
      setPreviewData({
        preview: data.preview || [],
        columns: data.headers || [],
        validationErrors: data.validation?.errors || [],
      });
      setImportMode("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to preview file");
      setSelectedFile(null);
    }
  };

  const handleStartBatchImport = async () => {
    setBatchImportInProgress(true);
    setError(null);
    setImportMode("progress");

    try {
      const res = await fetch("/api/admin/import/batch", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start batch import");
      }

      const data = await res.json();
      setImportResults(data);
      setImportMode("results");
      fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start batch import");
      setImportMode("idle");
    } finally {
      setBatchImportInProgress(false);
    }
  };

  const handleStartFileImport = async (duplicateHandling: "skip" | "update" | "overwrite") => {
    if (!selectedFile) return;

    setImportMode("progress");
    setError(null);

    try {
      // Read file as base64
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix and get base64
          const base64 = result.split(",")[1];
          resolve(base64 || "");
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const res = await fetch("/api/admin/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          fileName: selectedFile.name,
          duplicateHandling,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to execute import");
      }

      // Handle SSE stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.startsWith("event: complete")) {
            // Next line should be data
            continue;
          }
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.batchId && data.status) {
                setImportResults(data);
                setImportMode("results");
                fetchStatus();
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setImportMode("idle");
    }
  };

  const handleRollback = async (batchId: string) => {
    if (!confirm("Are you sure you want to rollback this import? This will delete all clinics from this batch.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/import/${batchId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to rollback");
      }

      fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rollback failed");
    }
  };

  const handleCloseResults = () => {
    setImportMode("idle");
    setImportResults(null);
    setSelectedFile(null);
    setPreviewData(null);
  };

  const getStatusIcon = (statusStr: string | null) => {
    switch (statusStr) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "rolled_back":
        return <RefreshCw className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (statusStr: string | null) => {
    switch (statusStr) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "processing":
        return <Badge variant="secondary">Processing</Badge>;
      case "rolled_back":
        return <Badge variant="outline">Rolled Back</Badge>;
      default:
        return <Badge variant="secondary">{statusStr}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Data Import</h1>
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Data Import</h1>
        <Button variant="outline" onClick={fetchStatus}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Import Preview Modal */}
      {importMode === "preview" && previewData && selectedFile && (
        <ImportPreview
          preview={previewData.preview}
          columns={previewData.columns}
          validationErrors={previewData.validationErrors}
          fileName={selectedFile.name}
          onStartImport={handleStartFileImport}
          onCancel={() => {
            setImportMode("idle");
            setSelectedFile(null);
            setPreviewData(null);
          }}
        />
      )}

      {/* Import Progress */}
      {importMode === "progress" && (
        <ImportProgress inProgress={batchImportInProgress} />
      )}

      {/* Import Results */}
      {importMode === "results" && importResults && (
        <ImportResults
          results={importResults}
          onClose={handleCloseResults}
          onViewDetails={() => {
            // Navigate to batch details page
            window.location.href = `/admin/import/${importResults.batchId}`;
          }}
        />
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clinics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{status?.totalClinics.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CSV Files Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{status?.fileCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Import Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{status?.recentBatches.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Import Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Batch Import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Batch Import
            </CardTitle>
            <CardDescription>
              Import all {status?.fileCount || 0} CSV files from {status?.dataDirectory}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status?.files && status.files.length > 0 && (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Files to import:</p>
                <ul className="list-disc list-inside space-y-1 max-h-32 overflow-y-auto">
                  {status.files.map((file) => (
                    <li key={file}>{file}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              onClick={handleStartBatchImport}
              disabled={batchImportInProgress || !status?.files?.length}
              className="w-full"
            >
              {batchImportInProgress ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Start Batch Import
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Single File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Upload a single CSV file for import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="block">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">
                  Drag and drop or click to upload
                </p>
                <p className="text-xs text-muted-foreground">CSV files only</p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </CardContent>
        </Card>
      </div>

      {/* Recent Imports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Imports</CardTitle>
          <CardDescription>
            History of recent import operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status?.recentBatches && status.recentBatches.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Success</TableHead>
                  <TableHead className="text-right">Errors</TableHead>
                  <TableHead className="text-right">Skipped</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {status.recentBatches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(batch.status)}
                        {getStatusBadge(batch.status)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-48 truncate">
                      {batch.fileName}
                    </TableCell>
                    <TableCell className="text-right">{batch.totalRecords?.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600">{batch.successCount?.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-destructive">{batch.errorCount?.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{batch.skipCount?.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(batch.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/admin/import/${batch.id}`}
                        >
                          Details
                        </Button>
                        {batch.status === "completed" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRollback(batch.id)}
                          >
                            Rollback
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No import history yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
