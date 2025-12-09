"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  FileText,
  RefreshCw,
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

interface OptimizationBatch {
  id: string;
  name: string | null;
  status: string | null;
  totalClinics: number | null;
  processedCount: number | null;
  successCount: number | null;
  errorCount: number | null;
  pendingReviewCount: number | null;
  approvedCount: number | null;
  estimatedCost: number | null;
  createdAt: string;
  completedAt: string | null;
}

interface Stats {
  totalClinics: number;
  clinicsWithContent: number;
  optimizedClinics: number;
  remainingToOptimize: number;
  pendingReviews: number;
  totalCostSpent: number;
}

export default function OptimizeDashboardPage() {
  const [batches, setBatches] = useState<OptimizationBatch[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/optimize");
      if (!response.ok) {
        throw new Error("Failed to fetch optimization data");
      }
      const data = await response.json();
      setBatches(data.batches);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
            <Clock className="mr-1 h-3 w-3" />
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
      case "cancelled":
        return (
          <Badge variant="secondary">
            <XCircle className="mr-1 h-3 w-3" />
            Cancelled
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

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchData} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Content Optimization
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered clinic content optimization with review workflow
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Link href="/admin/optimize/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Batch
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.totalClinics}</div>
              <p className="text-xs text-muted-foreground">Total Clinics</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.clinicsWithContent}</div>
              <p className="text-xs text-muted-foreground">With Content</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">
                {stats.optimizedClinics}
              </div>
              <p className="text-xs text-muted-foreground">Optimized</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">
                {stats.remainingToOptimize}
              </div>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pendingReviews}
              </div>
              <p className="text-xs text-muted-foreground">
                <Link
                  href="/admin/optimize/review"
                  className="hover:underline"
                >
                  Pending Reviews
                </Link>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold flex items-center">
                <DollarSign className="h-5 w-5" />
                {stats.totalCostSpent.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Total Cost</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Reviews Alert */}
      {stats && stats.pendingReviews > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span>
                You have <strong>{stats.pendingReviews}</strong> content
                versions pending review
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

      {/* Batches List */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Batches</CardTitle>
          <CardDescription>
            Recent batch processing jobs and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {batches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No optimization batches yet</p>
              <p className="text-sm">Create a new batch to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {batches.map((batch) => (
                <Link
                  key={batch.id}
                  href={`/admin/optimize/${batch.id}`}
                  className="block"
                >
                  <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {batch.name || `Batch ${batch.id.slice(0, 8)}`}
                        </span>
                        {getStatusBadge(batch.status)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(batch.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total:</span>{" "}
                        <span className="font-medium">{batch.totalClinics}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Processed:</span>{" "}
                        <span className="font-medium">{batch.processedCount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Success:</span>{" "}
                        <span className="font-medium text-green-600">
                          {batch.successCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pending:</span>{" "}
                        <span className="font-medium text-yellow-600">
                          {batch.pendingReviewCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cost:</span>{" "}
                        <span className="font-medium">
                          ${(batch.estimatedCost || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {batch.processedCount !== null && batch.totalClinics !== null && batch.totalClinics > 0 && (
                      <div className="mt-3">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.round(
                                ((batch.processedCount || 0) / batch.totalClinics) * 100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(
                            ((batch.processedCount || 0) / batch.totalClinics) * 100
                          )}
                          % complete
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
