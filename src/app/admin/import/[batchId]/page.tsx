"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle2, XCircle, Clock, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BatchDetails {
  batch: {
    id: string;
    fileName: string | null;
    status: string | null;
    totalRecords: number | null;
    successCount: number | null;
    errorCount: number | null;
    skipCount: number | null;
    errors: Array<{ row?: number; file?: string; error: string }> | null;
    createdAt: string;
    completedAt: string | null;
  };
  stats: {
    clinicsInDatabase: number;
    uniqueStates: number;
    averageRating: number | null;
    totalReviews: number;
  };
  clinicsByState: Array<{ state: string; count: number }>;
}

export default function BatchDetailsPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = use(params);
  const [details, setDetails] = useState<BatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/import/${batchId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch batch details");
      }
      const data = await res.json();
      setDetails(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch details");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleRollback = async () => {
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

      fetchDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rollback failed");
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "processing":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "rolled_back":
        return <RefreshCw className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "processing":
        return <Badge variant="secondary">Processing</Badge>;
      case "rolled_back":
        return <Badge variant="outline">Rolled Back</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/import">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Import Details</h1>
        </div>
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

  if (error || !details) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/import">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Import Details</h1>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Batch not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { batch, stats, clinicsByState } = details;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/import">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            {getStatusIcon(batch.status)}
            <div>
              <h1 className="text-2xl font-bold">{batch.fileName || "Import Batch"}</h1>
              <p className="text-sm text-muted-foreground">ID: {batch.id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(batch.status)}
          {batch.status === "completed" && (
            <Button variant="destructive" size="sm" onClick={handleRollback}>
              <Trash2 className="h-4 w-4 mr-2" />
              Rollback
            </Button>
          )}
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{batch.totalRecords?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Imported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{batch.successCount?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{batch.errorCount?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Skipped
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">{batch.skipCount?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Time info */}
      <Card>
        <CardHeader>
          <CardTitle>Import Timeline</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Started</p>
            <p className="font-medium">{new Date(batch.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="font-medium">
              {batch.completedAt ? new Date(batch.completedAt).toLocaleString() : "-"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Database stats */}
      {stats.clinicsInDatabase > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Statistics</CardTitle>
              <CardDescription>Data from this import batch</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Clinics in Database</p>
                  <p className="text-xl font-bold">{stats.clinicsInDatabase.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unique States</p>
                  <p className="text-xl font-bold">{stats.uniqueStates}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                  <p className="text-xl font-bold">{stats.averageRating?.toFixed(1) || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Reviews</p>
                  <p className="text-xl font-bold">{stats.totalReviews.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clinics by State</CardTitle>
              <CardDescription>Top states in this batch</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>State</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clinicsByState.slice(0, 15).map((item) => (
                      <TableRow key={item.state}>
                        <TableCell>{item.state}</TableCell>
                        <TableCell className="text-right">{item.count.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Errors */}
      {batch.errors && batch.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Errors ({batch.errors.length})</CardTitle>
            <CardDescription>Issues encountered during import</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Row</TableHead>
                    {batch.errors.some((e) => e.file) && <TableHead className="w-32">File</TableHead>}
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batch.errors.map((err, index) => (
                    <TableRow key={index}>
                      <TableCell>{err.row || "-"}</TableCell>
                      {batch.errors?.some((e) => e.file) && (
                        <TableCell className="max-w-32 truncate">{err.file || "-"}</TableCell>
                      )}
                      <TableCell className="text-destructive text-sm">{err.error}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
