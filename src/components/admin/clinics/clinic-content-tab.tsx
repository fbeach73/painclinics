"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface ContentStatus {
  clinicId: string;
  title: string;
  hasOriginalContent: boolean;
  hasEnhancedContent: boolean;
  originalContent: string | null;
  enhancedContent: string | null;
  originalWordCount: number;
  enhancedWordCount: number;
}

interface EnhanceResponse {
  success: boolean;
  content: string;
  usage: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  clinicId: string;
  model: string;
}

interface ClinicContentTabProps {
  clinicId: string;
  clinicName: string;
}

export function ClinicContentTab({ clinicId, clinicName }: ClinicContentTabProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [contentStatus, setContentStatus] = useState<ContentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchContentStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}/enhance-about`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch content status");
      }

      setContentStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch content status");
    } finally {
      setIsLoading(false);
    }
  }, [clinicId]);

  // Fetch content status on mount
  useEffect(() => {
    fetchContentStatus();
  }, [fetchContentStatus]);

  const handleEnhanceContent = async () => {
    setIsEnhancing(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}/enhance-about`, {
        method: "POST",
      });

      const data: EnhanceResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as { error?: string }).error || "Failed to enhance content");
      }

      toast.success("Content enhanced successfully", {
        description: `Used ${data.usage?.totalTokens || 0} tokens`,
      });

      // Refresh the content status
      await fetchContentStatus();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to enhance content";
      setError(message);
      toast.error("Enhancement failed", { description: message });
    } finally {
      setIsEnhancing(false);
    }
  };

  // Strip HTML tags for display
  const stripHtml = (html: string): string => {
    return html.replace(/<[^>]*>/g, "").trim();
  };

  if (isLoading && !contentStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading content status...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Status
          </CardTitle>
          <CardDescription>
            AI-enhanced About section content for {clinicName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-muted-foreground">Original Content</Label>
              <div className="flex items-center gap-2 mt-1">
                {contentStatus?.hasOriginalContent ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Available</span>
                    <Badge variant="secondary" className="ml-1">
                      {contentStatus.originalWordCount} words
                    </Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-muted-foreground">None</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Enhanced Content</Label>
              <div className="flex items-center gap-2 mt-1">
                {contentStatus?.hasEnhancedContent ? (
                  <>
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-purple-600 dark:text-purple-400">
                      Generated
                    </span>
                    <Badge variant="secondary" className="ml-1">
                      {contentStatus.enhancedWordCount} words
                    </Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Not generated</span>
                  </>
                )}
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Actions</Label>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  size="sm"
                  variant={contentStatus?.hasEnhancedContent ? "outline" : "default"}
                  onClick={handleEnhanceContent}
                  disabled={isEnhancing}
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enhancing...
                    </>
                  ) : contentStatus?.hasEnhancedContent ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Content Comparison */}
      {contentStatus && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Original Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Original Content
              </CardTitle>
              <CardDescription>
                {contentStatus.hasOriginalContent
                  ? `${contentStatus.originalWordCount} words from database`
                  : "No original content available"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contentStatus.originalContent ? (
                <Textarea
                  value={stripHtml(contentStatus.originalContent)}
                  readOnly
                  className="min-h-[200px] font-mono text-sm resize-none bg-muted/50"
                />
              ) : (
                <div className="flex items-center justify-center min-h-[200px] border rounded-md bg-muted/20 text-muted-foreground">
                  No content to display
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Content */}
          <Card className={contentStatus.hasEnhancedContent ? "border-purple-200 dark:border-purple-800" : ""}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Enhanced Content
              </CardTitle>
              <CardDescription>
                {contentStatus.hasEnhancedContent
                  ? `${contentStatus.enhancedWordCount} words - AI generated`
                  : "Click 'Generate' to create enhanced content"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contentStatus.enhancedContent ? (
                <Textarea
                  value={contentStatus.enhancedContent}
                  readOnly
                  className="min-h-[200px] font-mono text-sm resize-none bg-purple-50/50 dark:bg-purple-950/20"
                />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[200px] border rounded-md bg-muted/20 text-muted-foreground gap-3">
                  <Wand2 className="h-8 w-8" />
                  <p className="text-sm">No enhanced content yet</p>
                  <Button
                    size="sm"
                    onClick={handleEnhanceContent}
                    disabled={isEnhancing}
                  >
                    {isEnhancing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate Now
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Section */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">About AI Content Enhancement</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>AI Enhancement</strong> uses OpenRouter to generate clean, SEO-friendly
            About section content based on the clinic&apos;s existing data.
          </p>
          <Separator className="my-3" />
          <p>The AI will:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Remove addresses, phone numbers, and emails (shown elsewhere)</li>
            <li>Fix formatting and grammar issues</li>
            <li>Incorporate services and amenities naturally</li>
            <li>Include positive themes from review keywords</li>
            <li>Keep content between 150-250 words</li>
          </ul>
          <Separator className="my-3" />
          <p>
            <strong>Note:</strong> Enhanced content is stored in the <code className="px-1 py-0.5 bg-muted rounded text-xs">newPostContent</code> field
            and will be displayed on the public clinic page when available.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
