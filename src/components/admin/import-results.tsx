"use client";

import { CheckCircle2, XCircle, AlertTriangle, Download, Eye, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ImportResultsProps {
  results: {
    batchId: string;
    status: string;
    totalRecords: number;
    successCount: number;
    errorCount: number;
    skipCount: number;
    errors: Array<{ row?: number; file?: string; error: string }>;
  };
  onClose: () => void;
  onViewDetails?: () => void;
}

export function ImportResults({ results, onClose, onViewDetails }: ImportResultsProps) {
  const { status, totalRecords, successCount, errorCount, skipCount, errors } = results;

  const successPercentage = totalRecords > 0 ? Math.round((successCount / totalRecords) * 100) : 0;
  const errorPercentage = totalRecords > 0 ? Math.round((errorCount / totalRecords) * 100) : 0;
  const skipPercentage = totalRecords > 0 ? Math.round((skipCount / totalRecords) * 100) : 0;

  const isSuccess = status === "completed" && errorCount === 0;
  const isPartialSuccess = status === "completed" && errorCount > 0;
  const isFailed = status === "failed";

  const handleDownloadErrors = () => {
    if (errors.length === 0) return;

    const csvContent = [
      ["Row", "File", "Error"].join(","),
      ...errors.map((e) => [e.row || "-", e.file || "-", `"${e.error.replace(/"/g, '""')}"`].join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-errors-${results.batchId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSuccess && <CheckCircle2 className="h-6 w-6 text-green-500" />}
            {isPartialSuccess && <AlertTriangle className="h-6 w-6 text-yellow-500" />}
            {isFailed && <XCircle className="h-6 w-6 text-destructive" />}
            <div>
              <CardTitle>
                {isSuccess && "Import Completed Successfully"}
                {isPartialSuccess && "Import Completed with Errors"}
                {isFailed && "Import Failed"}
              </CardTitle>
              <CardDescription>
                Batch ID: {results.batchId}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Success message */}
        {isSuccess && (
          <Alert className="border-green-500 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              All {successCount.toLocaleString()} records were imported successfully.
            </AlertDescription>
          </Alert>
        )}

        {/* Partial success message */}
        {isPartialSuccess && (
          <Alert variant="default" className="border-yellow-500 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertTitle>Completed with issues</AlertTitle>
            <AlertDescription>
              {successCount.toLocaleString()} records imported, {errorCount.toLocaleString()} errors, {skipCount.toLocaleString()} skipped.
            </AlertDescription>
          </Alert>
        )}

        {/* Failed message */}
        {isFailed && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Import Failed</AlertTitle>
            <AlertDescription>
              No records were imported. Please check the errors below and try again.
            </AlertDescription>
          </Alert>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-3xl font-bold">{totalRecords.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Records</p>
          </div>
          <div className="text-center p-4 bg-green-500/10 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{successCount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Imported</p>
            <Badge variant="secondary" className="mt-1">{successPercentage}%</Badge>
          </div>
          <div className="text-center p-4 bg-destructive/10 rounded-lg">
            <p className="text-3xl font-bold text-destructive">{errorCount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Errors</p>
            <Badge variant="destructive" className="mt-1">{errorPercentage}%</Badge>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-3xl font-bold text-muted-foreground">{skipCount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Skipped</p>
            <Badge variant="outline" className="mt-1">{skipPercentage}%</Badge>
          </div>
        </div>

        {/* Progress visualization */}
        <div className="space-y-2">
          <div className="flex h-4 rounded-full overflow-hidden">
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${successPercentage}%` }}
            />
            <div
              className="bg-destructive transition-all"
              style={{ width: `${errorPercentage}%` }}
            />
            <div
              className="bg-muted-foreground/30 transition-all"
              style={{ width: `${skipPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" /> Imported
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-destructive rounded-full" /> Errors
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-muted-foreground/30 rounded-full" /> Skipped
            </span>
          </div>
        </div>

        {/* Error list */}
        {errors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Errors ({errors.length})</h4>
              <Button variant="outline" size="sm" onClick={handleDownloadErrors}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>
            <ScrollArea className="h-48 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Row</TableHead>
                    {errors.some((e) => e.file) && <TableHead className="w-32">File</TableHead>}
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.slice(0, 50).map((error, index) => (
                    <TableRow key={index}>
                      <TableCell>{error.row || "-"}</TableCell>
                      {errors.some((e) => e.file) && (
                        <TableCell className="max-w-32 truncate">{error.file || "-"}</TableCell>
                      )}
                      <TableCell className="text-destructive text-sm">{error.error}</TableCell>
                    </TableRow>
                  ))}
                  {errors.length > 50 && (
                    <TableRow>
                      <TableCell colSpan={errors.some((e) => e.file) ? 3 : 2} className="text-center text-muted-foreground">
                        ...and {errors.length - 50} more errors. Download CSV for full list.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {onViewDetails && (
          <Button onClick={onViewDetails}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
