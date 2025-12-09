"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Eye,
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ContentVersion {
  id: string;
  clinicId: string;
  clinicTitle: string;
  clinicCity: string;
  clinicState: string;
  version: number;
  status: string;
  wordCountBefore: number | null;
  wordCountAfter: number | null;
  keywordsUsed: string[] | null;
  faqGenerated: Array<{ question: string; answer: string }> | null;
  cost: number | null;
  validationPassed: boolean | null;
  validationWarnings: string[] | null;
  validationErrors: string[] | null;
  requiresManualReview: boolean | null;
  createdAt: string;
}

interface VersionDetail {
  id: string;
  clinicId: string;
  originalContent: string | null;
  optimizedContent: string | null;
  keywordsUsed: string[] | null;
  faqGenerated: Array<{ question: string; answer: string }> | null;
  changesSummary: string | null;
  wordCountBefore: number | null;
  wordCountAfter: number | null;
  validationWarnings: string[] | null;
  validationErrors: string[] | null;
  status: string;
}

interface Clinic {
  id: string;
  title: string;
  city: string;
  state: string;
  streetAddress: string | null;
  phone: string | null;
  rating: number | null;
  reviewCount: number | null;
}

export default function ReviewQueuePage() {
  const searchParams = useSearchParams();
  const initialVersionId = searchParams.get("version");

  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Preview state
  const [selectedVersion, setSelectedVersion] = useState<VersionDetail | null>(
    null
  );
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });

  const fetchVersions = async (offset: number = 0) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/optimize/content?status=pending&limit=50&offset=${offset}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch versions");
      }
      const data = await response.json();
      setVersions(data.versions);
      setPagination(data.pagination);

      // If we have an initial version ID, load it
      if (initialVersionId && data.versions.length > 0) {
        const version = data.versions.find(
          (v: ContentVersion) => v.id === initialVersionId
        );
        if (version) {
          loadVersionDetail(version.id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const loadVersionDetail = async (versionId: string) => {
    try {
      setPreviewLoading(true);
      const response = await fetch(
        `/api/admin/optimize/content/${versionId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch version detail");
      }
      const data = await response.json();
      setSelectedVersion(data.version);
      setSelectedClinic(data.clinic);
    } catch (err) {
      console.error("Error loading version detail:", err);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(versions.map((v) => v.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleAction = async (
    action: "approve" | "reject" | "apply",
    versionId?: string
  ) => {
    const ids = versionId ? [versionId] : Array.from(selectedIds);
    if (ids.length === 0) return;

    setActionLoading(action);
    try {
      if (ids.length === 1) {
        // Single action
        const response = await fetch(
          `/api/admin/optimize/content/${ids[0]}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
          }
        );
        if (!response.ok) {
          throw new Error("Failed to perform action");
        }
      } else {
        // Bulk action
        const response = await fetch(`/api/admin/optimize/content/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, versionIds: ids }),
        });
        if (!response.ok) {
          throw new Error("Failed to perform bulk action");
        }
      }

      // Refresh data
      fetchVersions(pagination.offset);
      setSelectedIds(new Set());
      if (selectedVersion && ids.includes(selectedVersion.id)) {
        setSelectedVersion(null);
        setSelectedClinic(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/admin/optimize"
            className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Review Queue</h1>
          <p className="text-muted-foreground mt-1">
            {pagination.total} content versions pending review
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchVersions(pagination.offset)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card className="mb-4">
          <CardContent className="py-3 flex items-center justify-between">
            <span className="text-sm">
              {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction("approve")}
                disabled={!!actionLoading}
              >
                {actionLoading === "approve" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Approve All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction("reject")}
                disabled={!!actionLoading}
              >
                {actionLoading === "reject" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Reject All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="mb-4 border-destructive">
          <CardContent className="py-3">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List Panel */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Pending Reviews</CardTitle>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={
                    versions.length > 0 && selectedIds.size === versions.length
                  }
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-xs text-muted-foreground">Select all</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending reviews</p>
                <p className="text-sm">All content has been reviewed</p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        className={`border rounded p-3 cursor-pointer transition-colors ${
                          selectedVersion?.id === version.id
                            ? "bg-muted border-primary"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => loadVersionDetail(version.id)}
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={selectedIds.has(version.id)}
                            onCheckedChange={(checked) =>
                              handleSelectOne(version.id, checked as boolean)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {version.clinicTitle}
                              </span>
                              {version.requiresManualReview && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  Review
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {version.clinicCity}, {version.clinicState}
                            </p>
                            {version.wordCountBefore && version.wordCountAfter && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {version.wordCountBefore} → {version.wordCountAfter}{" "}
                                words •{" "}
                                {version.keywordsUsed?.length || 0} keywords
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              loadVersionDetail(version.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    Showing {pagination.offset + 1}-
                    {Math.min(pagination.offset + versions.length, pagination.total)}{" "}
                    of {pagination.total}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.offset === 0}
                      onClick={() =>
                        fetchVersions(
                          Math.max(0, pagination.offset - pagination.limit)
                        )
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasMore}
                      onClick={() =>
                        fetchVersions(pagination.offset + pagination.limit)
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Content Preview</CardTitle>
            {selectedClinic && (
              <CardDescription>
                {selectedClinic.title} - {selectedClinic.city},{" "}
                {selectedClinic.state}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {previewLoading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !selectedVersion ? (
              <div className="text-center py-20 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select an item to preview</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Validation Warnings/Errors */}
                {(selectedVersion.validationErrors?.length || 0) > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
                    <p className="font-medium text-red-700 dark:text-red-300 text-sm mb-1">
                      Validation Errors
                    </p>
                    <ul className="text-xs text-red-600 dark:text-red-400 list-disc list-inside">
                      {selectedVersion.validationErrors?.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(selectedVersion.validationWarnings?.length || 0) > 0 && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded">
                    <p className="font-medium text-yellow-700 dark:text-yellow-300 text-sm mb-1">
                      Validation Warnings
                    </p>
                    <ul className="text-xs text-yellow-600 dark:text-yellow-400 list-disc list-inside">
                      {selectedVersion.validationWarnings?.map((warn, i) => (
                        <li key={i}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">
                      {selectedVersion.wordCountBefore || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Original Words
                    </p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedVersion.wordCountAfter || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Optimized Words
                    </p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {selectedVersion.keywordsUsed?.length || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Keywords Used
                    </p>
                  </div>
                </div>

                {/* Keywords */}
                {selectedVersion.keywordsUsed &&
                  selectedVersion.keywordsUsed.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">
                        Integrated Keywords
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedVersion.keywordsUsed.map((kw, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Content Tabs */}
                <Tabs defaultValue="optimized">
                  <TabsList className="w-full">
                    <TabsTrigger value="optimized" className="flex-1">
                      Optimized
                    </TabsTrigger>
                    <TabsTrigger value="original" className="flex-1">
                      Original
                    </TabsTrigger>
                    <TabsTrigger value="faqs" className="flex-1">
                      FAQs ({selectedVersion.faqGenerated?.length || 0})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="optimized">
                    <ScrollArea className="h-[300px] border rounded p-4">
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{
                          __html:
                            selectedVersion.optimizedContent ||
                            "<p>No content</p>",
                        }}
                      />
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="original">
                    <ScrollArea className="h-[300px] border rounded p-4">
                      <div
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{
                          __html:
                            selectedVersion.originalContent ||
                            "<p>No content</p>",
                        }}
                      />
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="faqs">
                    <ScrollArea className="h-[300px] border rounded p-4">
                      {selectedVersion.faqGenerated &&
                      selectedVersion.faqGenerated.length > 0 ? (
                        <div className="space-y-4">
                          {selectedVersion.faqGenerated.map((faq, i) => (
                            <div key={i}>
                              <p className="font-medium text-sm">
                                Q: {faq.question}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                A: {faq.answer}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No FAQs generated</p>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>

                {/* Changes Summary */}
                {selectedVersion.changesSummary && (
                  <div className="p-3 bg-muted rounded">
                    <p className="text-sm font-medium mb-1">Changes Summary</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedVersion.changesSummary}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    className="flex-1"
                    onClick={() => handleAction("approve", selectedVersion.id)}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === "approve" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleAction("reject", selectedVersion.id)}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === "reject" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
