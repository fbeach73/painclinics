"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, Save, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { TiptapEditor } from "@/components/admin/blog/tiptap-editor";
import { AutoSaveIndicator, type SaveStatus } from "@/components/admin/blog/auto-save-indicator";
import { RecipientSelector } from "./recipient-selector";
import { AttachmentUploader, type Attachment } from "./attachment-uploader";
import { BroadcastPreview, BroadcastPreviewCard } from "./broadcast-preview";
import { SendConfirmation } from "./send-confirmation";
import type { TargetAudience, TargetFilters, Broadcast } from "@/lib/broadcast/broadcast-queries";

interface BroadcastFormState {
  name: string;
  subject: string;
  previewText: string;
  htmlContent: string;
  targetAudience: TargetAudience;
  targetFilters: TargetFilters;
  attachments: Attachment[];
}

const defaultFormState: BroadcastFormState = {
  name: "",
  subject: "",
  previewText: "",
  htmlContent: "",
  targetAudience: "all_with_email",
  targetFilters: { excludeUnsubscribed: true },
  attachments: [],
};

interface BroadcastFormProps {
  broadcast?: Broadcast;
}

export function BroadcastForm({ broadcast }: BroadcastFormProps) {
  const router = useRouter();
  const isNewBroadcast = !broadcast;

  // Form state
  const [formData, setFormData] = useState<BroadcastFormState>(() => {
    if (broadcast) {
      return {
        name: broadcast.name,
        subject: broadcast.subject,
        previewText: broadcast.previewText || "",
        htmlContent: broadcast.htmlContent,
        targetAudience: (broadcast.targetAudience || "all_with_email") as TargetAudience,
        targetFilters: (broadcast.targetFilters as TargetFilters) || { excludeUnsubscribed: true },
        attachments: (broadcast.attachments as Attachment[]) || [],
      };
    }
    return defaultFormState;
  });

  // UI state
  const [activeTab, setActiveTab] = useState<"compose" | "recipients" | "preview">("compose");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number>(0);

  // Update form data helper
  const updateFormData = useCallback(<K extends keyof BroadcastFormState>(
    key: K,
    value: BroadcastFormState[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  // Auto-save for existing broadcasts
  useEffect(() => {
    if (!broadcast?.id || !hasChanges) return;

    setSaveStatus("unsaved");
    const timer = setTimeout(async () => {
      try {
        setSaveStatus("saving");
        const response = await fetch(`/api/admin/broadcasts/${broadcast.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            subject: formData.subject,
            previewText: formData.previewText || null,
            htmlContent: formData.htmlContent,
            targetAudience: formData.targetAudience,
            targetFilters: formData.targetFilters,
            attachments: formData.attachments,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save");
        }

        setSaveStatus("saved");
        setLastSaved(new Date());
        setHasChanges(false);
      } catch (error) {
        console.error("Auto-save failed:", error);
        setSaveStatus("error");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [broadcast?.id, formData, hasChanges]);

  // Fetch recipient count when targeting changes
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const params = new URLSearchParams({ audience: formData.targetAudience });
        if (formData.targetFilters.states?.length) {
          params.set("states", formData.targetFilters.states.join(","));
        }
        if (formData.targetFilters.tiers?.length) {
          params.set("tiers", formData.targetFilters.tiers.join(","));
        }
        if (formData.targetFilters.excludeUnsubscribed) {
          params.set("excludeUnsubscribed", "true");
        }

        const res = await fetch(`/api/admin/broadcasts/preview-count?${params}`);
        const data = await res.json();
        setRecipientCount(data.count || 0);
      } catch (error) {
        console.error("Failed to fetch recipient count:", error);
      }
    };

    const timer = setTimeout(fetchCount, 300);
    return () => clearTimeout(timer);
  }, [formData.targetAudience, formData.targetFilters]);

  // Image upload handler for Tiptap
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    const response = await fetch("/api/admin/blog/upload", {
      method: "POST",
      body: formDataUpload,
    });

    if (!response.ok) {
      throw new Error("Failed to upload image");
    }

    const data = await response.json();
    return data.url;
  }, []);

  // Save broadcast (create or update)
  const handleSave = useCallback(async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!formData.subject.trim()) {
      toast.error("Subject is required");
      return;
    }

    if (!formData.htmlContent.trim()) {
      toast.error("Email content is required");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: formData.name,
        subject: formData.subject,
        previewText: formData.previewText || null,
        htmlContent: formData.htmlContent,
        targetAudience: formData.targetAudience,
        targetFilters: formData.targetFilters,
        attachments: formData.attachments,
      };

      if (isNewBroadcast) {
        const response = await fetch("/api/admin/broadcasts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create broadcast");
        }

        const newBroadcast = await response.json();
        toast.success("Broadcast created");
        router.push(`/admin/broadcasts/${newBroadcast.id}/edit`);
      } else {
        const response = await fetch(`/api/admin/broadcasts/${broadcast.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update broadcast");
        }

        setSaveStatus("saved");
        setLastSaved(new Date());
        setHasChanges(false);
        toast.success("Broadcast saved");
        router.refresh();
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save broadcast");
    } finally {
      setIsSaving(false);
    }
  }, [formData, isNewBroadcast, broadcast?.id, router]);

  // Delete broadcast
  const handleDelete = useCallback(async () => {
    if (!broadcast?.id) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/broadcasts/${broadcast.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete broadcast");
      }

      toast.success("Broadcast deleted");
      router.push("/admin/broadcasts");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete broadcast");
      setIsDeleting(false);
    }
  }, [broadcast?.id, router]);

  // Test send handler
  const handleTestSend = useCallback(
    async (testEmail: string) => {
      if (!broadcast?.id) {
        throw new Error("Save the broadcast first before sending a test");
      }

      const response = await fetch(`/api/admin/broadcasts/${broadcast.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send test email");
      }

      toast.success(`Test email sent to ${testEmail}`);
    },
    [broadcast?.id]
  );

  // Send broadcast handler
  const handleSend = useCallback(async () => {
    if (!broadcast?.id) {
      throw new Error("Save the broadcast first before sending");
    }

    const response = await fetch(`/api/admin/broadcasts/${broadcast.id}/send`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to send broadcast");
    }

    toast.success("Broadcast sent successfully!");
    router.push(`/admin/broadcasts/${broadcast.id}`);
  }, [broadcast?.id, router]);

  // Check if can send (has saved ID and valid content)
  const canSend = useMemo(() => {
    return (
      broadcast?.id &&
      formData.name.trim() &&
      formData.subject.trim() &&
      formData.htmlContent.trim() &&
      recipientCount > 0 &&
      !hasChanges
    );
  }, [broadcast?.id, formData, recipientCount, hasChanges]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/broadcasts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isNewBroadcast ? "New Broadcast" : "Edit Broadcast"}
            </h1>
            {!isNewBroadcast && (
              <div className="mt-1">
                <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNewBroadcast && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete broadcast?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this draft broadcast.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <BroadcastPreview
            subject={formData.subject}
            previewText={formData.previewText}
            htmlContent={formData.htmlContent}
            recipientCount={recipientCount}
            trigger={
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            }
          />

          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </>
            )}
          </Button>

          {!isNewBroadcast && broadcast && (
            <SendConfirmation
              broadcastName={formData.name}
              subject={formData.subject}
              recipientCount={recipientCount}
              onSend={handleSend}
              onTestSend={handleTestSend}
              disabled={!canSend}
            />
          )}
        </div>
      </div>

      {/* Main content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="recipients">
            Recipients
            {recipientCount > 0 && (
              <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                {recipientCount.toLocaleString()}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Broadcast name */}
              <div className="space-y-2">
                <Label htmlFor="name">Broadcast Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="e.g., January Newsletter, Holiday Promotion"
                />
                <p className="text-xs text-muted-foreground">
                  Internal name to identify this broadcast
                </p>
              </div>

              {/* Subject line */}
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => updateFormData("subject", e.target.value)}
                  placeholder="Enter email subject line"
                  className="text-lg"
                />
              </div>

              {/* Preview text */}
              <div className="space-y-2">
                <Label htmlFor="previewText">Preview Text (optional)</Label>
                <Textarea
                  id="previewText"
                  value={formData.previewText}
                  onChange={(e) => updateFormData("previewText", e.target.value)}
                  placeholder="Brief text shown in inbox preview..."
                  rows={2}
                  maxLength={150}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.previewText.length}/150 characters
                </p>
              </div>

              {/* Email content editor */}
              <div className="space-y-2">
                <Label>Email Content</Label>
                <TiptapEditor
                  content={formData.htmlContent}
                  onChange={(html) => updateFormData("htmlContent", html)}
                  onImageUpload={handleImageUpload}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Attachments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <AttachmentUploader
                    attachments={formData.attachments}
                    onChange={(attachments) => updateFormData("attachments", attachments)}
                  />
                </CardContent>
              </Card>

              {/* Quick preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Preview</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <BroadcastPreviewCard
                    subject={formData.subject}
                    previewText={formData.previewText}
                    htmlContent={formData.htmlContent}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recipients" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Recipients</CardTitle>
            </CardHeader>
            <CardContent>
              <RecipientSelector
                audience={formData.targetAudience}
                filters={formData.targetFilters}
                onAudienceChange={(audience) => updateFormData("targetAudience", audience)}
                onFiltersChange={(filters) => updateFormData("targetFilters", filters)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-2xl mx-auto">
                <BroadcastPreviewCard
                  subject={formData.subject}
                  previewText={formData.previewText}
                  htmlContent={formData.htmlContent}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
