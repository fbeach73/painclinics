"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2,
  RefreshCw,
  Save,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClinicWysiwygEditor } from "./clinic-wysiwyg-editor";

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

// Count words in HTML content
function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").trim();
  return text.split(/\s+/).filter(Boolean).length;
}

export function ClinicContentTab({ clinicId, clinicName }: ClinicContentTabProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [contentStatus, setContentStatus] = useState<ContentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editable content states
  const [originalContent, setOriginalContent] = useState("");
  const [enhancedContent, setEnhancedContent] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
      setOriginalContent(data.originalContent || "");
      setEnhancedContent(data.enhancedContent || "");
      setHasUnsavedChanges(false);
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

  const handleOriginalContentChange = (html: string) => {
    setOriginalContent(html);
    setHasUnsavedChanges(true);
  };

  const handleEnhancedContentChange = (html: string) => {
    setEnhancedContent(html);
    setHasUnsavedChanges(true);
  };

  const handleSaveContent = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: originalContent || null,
          newPostContent: enhancedContent || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save content");
      }

      toast.success("Content saved successfully");
      setHasUnsavedChanges(false);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save content";
      setError(message);
      toast.error("Save failed", { description: message });
    } finally {
      setIsSaving(false);
    }
  };

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

      // Update the enhanced content with the new AI-generated content
      setEnhancedContent(data.content);
      setHasUnsavedChanges(true);

      // Refresh to update word counts
      await fetchContentStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to enhance content";
      setError(message);
      toast.error("Enhancement failed", { description: message });
    } finally {
      setIsEnhancing(false);
    }
  };

  if (isLoading && !contentStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading content...</span>
        </CardContent>
      </Card>
    );
  }

  const originalWordCount = countWords(originalContent);
  const enhancedWordCount = countWords(enhancedContent);

  return (
    <div className="space-y-6">
      {/* Status Bar with Save Button */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content Editor
              </CardTitle>
              <CardDescription>
                Edit clinic description content for {clinicName}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                  Unsaved changes
                </Badge>
              )}
              <Button
                onClick={handleSaveContent}
                disabled={isSaving || !hasUnsavedChanges}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-muted-foreground">Original Content</Label>
              <div className="flex items-center gap-2 mt-1">
                {originalContent ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Available</span>
                    <Badge variant="secondary" className="ml-1">
                      {originalWordCount} words
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
                {enhancedContent ? (
                  <>
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-purple-600 dark:text-purple-400">
                      Available
                    </span>
                    <Badge variant="secondary" className="ml-1">
                      {enhancedWordCount} words
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
              <Label className="text-muted-foreground">AI Enhancement</Label>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  size="sm"
                  variant={enhancedContent ? "outline" : "default"}
                  onClick={handleEnhanceContent}
                  disabled={isEnhancing}
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enhancing...
                    </>
                  ) : enhancedContent ? (
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

      {/* Content Editors */}
      <Tabs defaultValue="original" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="original" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Original Content
            {originalWordCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {originalWordCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="enhanced" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Enhanced Content
            {enhancedWordCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {enhancedWordCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="original" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Original Clinic Description</CardTitle>
              <CardDescription>
                The base content for this clinic. This is typically imported from
                external sources or entered manually.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClinicWysiwygEditor
                content={originalContent}
                onChange={handleOriginalContentChange}
                placeholder="Enter the original clinic description..."
                minHeight="300px"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enhanced" className="mt-4">
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                AI-Enhanced Content
              </CardTitle>
              <CardDescription>
                This content is displayed on the public clinic page. You can edit
                it manually or regenerate it using AI.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClinicWysiwygEditor
                content={enhancedContent}
                onChange={handleEnhancedContentChange}
                placeholder="Enter or generate enhanced clinic description..."
                minHeight="300px"
                className="border-purple-200 dark:border-purple-800"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Section */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">About Content Management</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Original Content:</strong> The base description text for this clinic.
            Can be edited manually or imported from external sources.
          </p>
          <Separator className="my-3" />
          <p>
            <strong>Enhanced Content:</strong> The AI-improved version that appears on the
            public clinic page. When available, this takes priority over original content.
          </p>
          <Separator className="my-3" />
          <p>The AI enhancement will:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Remove duplicate contact information (shown elsewhere on page)</li>
            <li>Fix formatting and grammar issues</li>
            <li>Incorporate services and amenities naturally</li>
            <li>Include positive themes from review keywords</li>
            <li>Keep content between 150-250 words</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
