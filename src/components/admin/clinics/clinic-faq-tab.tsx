"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  GripVertical,
  HelpCircle,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQStatus {
  clinicId: string;
  title: string;
  hasFAQs: boolean;
  faqCount: number;
  faqs: FAQItem[];
}

interface GenerateResponse {
  success: boolean;
  faqs: FAQItem[];
  faqCount: number;
  usage: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  clinicId: string;
  model: string;
}

interface ClinicFAQTabProps {
  clinicId: string;
  clinicName: string;
}

export function ClinicFAQTab({ clinicId, clinicName }: ClinicFAQTabProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [faqStatus, setFaqStatus] = useState<FAQStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Editing state
  const [localFaqs, setLocalFaqs] = useState<FAQItem[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Add new FAQ state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  const fetchFAQStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}/faq`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch FAQ status");
      }

      setFaqStatus(data);
      setLocalFaqs(data.faqs || []);
      setHasUnsavedChanges(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch FAQ status"
      );
    } finally {
      setIsLoading(false);
    }
  }, [clinicId]);

  // Fetch FAQ status on mount
  useEffect(() => {
    fetchFAQStatus();
  }, [fetchFAQStatus]);

  const handleGenerateFAQs = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/clinics/${clinicId}/generate-faq`,
        {
          method: "POST",
        }
      );

      const data: GenerateResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          (data as unknown as { error?: string }).error ||
            "Failed to generate FAQs"
        );
      }

      toast.success("FAQs generated successfully", {
        description: `Generated ${data.faqCount} FAQs using ${data.usage?.totalTokens || 0} tokens`,
      });

      // Refresh the FAQ status
      await fetchFAQStatus();
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate FAQs";
      setError(message);
      toast.error("Generation failed", { description: message });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveFAQs = async (faqs: FAQItem[]) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/clinics/${clinicId}/faq`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faqs }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save FAQs");
      }

      setLocalFaqs(data.faqs);
      setFaqStatus((prev) =>
        prev
          ? {
              ...prev,
              faqs: data.faqs,
              faqCount: data.faqCount,
              hasFAQs: data.faqCount > 0,
            }
          : null
      );
      setHasUnsavedChanges(false);
      toast.success("FAQs saved successfully");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save FAQs";
      setError(message);
      toast.error("Save failed", { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  // Edit handlers
  const startEditing = (index: number) => {
    const faq = localFaqs[index];
    if (!faq) return;
    setEditingIndex(index);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditQuestion("");
    setEditAnswer("");
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    if (!editQuestion.trim() || !editAnswer.trim()) {
      toast.error("Question and answer are required");
      return;
    }

    const updated = [...localFaqs];
    updated[editingIndex] = {
      question: editQuestion.trim(),
      answer: editAnswer.trim(),
    };
    setLocalFaqs(updated);
    setHasUnsavedChanges(true);
    cancelEditing();
  };

  // Delete handler
  const deleteFaq = (index: number) => {
    const updated = localFaqs.filter((_, i) => i !== index);
    setLocalFaqs(updated);
    setHasUnsavedChanges(true);
    if (editingIndex === index) {
      cancelEditing();
    }
  };

  // Reorder handlers
  const moveFaq = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === localFaqs.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...localFaqs];
    const temp = updated[index];
    const swapItem = updated[newIndex];
    if (temp && swapItem) {
      updated[index] = swapItem;
      updated[newIndex] = temp;
      setLocalFaqs(updated);
      setHasUnsavedChanges(true);
    }
  };

  // Add new FAQ handler
  const addNewFaq = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error("Question and answer are required");
      return;
    }

    const newFaq: FAQItem = {
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
    };
    setLocalFaqs([...localFaqs, newFaq]);
    setHasUnsavedChanges(true);
    setNewQuestion("");
    setNewAnswer("");
    setShowAddForm(false);
    toast.success("FAQ added - remember to save your changes");
  };

  if (isLoading && !faqStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">
            Loading FAQ status...
          </span>
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
            <HelpCircle className="h-5 w-5" />
            FAQ Management
          </CardTitle>
          <CardDescription>
            Manage Frequently Asked Questions for {clinicName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label className="text-muted-foreground">Current FAQs</Label>
              <div className="flex items-center gap-2 mt-1">
                {localFaqs.length > 0 ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Available</span>
                    <Badge variant="secondary" className="ml-1">
                      {localFaqs.length} questions
                    </Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-muted-foreground">
                      No FAQs yet
                    </span>
                  </>
                )}
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="flex items-center gap-2 mt-1">
                {hasUnsavedChanges ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-orange-600 dark:text-orange-400">
                      Unsaved changes
                    </span>
                  </>
                ) : localFaqs.length > 0 ? (
                  <>
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-purple-600 dark:text-purple-400">
                      Saved
                    </span>
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
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Button
                  size="sm"
                  variant={localFaqs.length > 0 ? "outline" : "default"}
                  onClick={handleGenerateFAQs}
                  disabled={isGenerating || isSaving}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : localFaqs.length > 0 ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate FAQs
                    </>
                  )}
                </Button>
                {hasUnsavedChanges && (
                  <Button
                    size="sm"
                    onClick={() => saveFAQs(localFaqs)}
                    disabled={isSaving}
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
                )}
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

      {/* FAQ List with Edit/Delete/Reorder */}
      {localFaqs.length > 0 && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                FAQs ({localFaqs.length})
              </CardTitle>
              <CardDescription>
                Click edit to modify, use arrows to reorder, or delete to remove
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddForm(true)}
              disabled={showAddForm || editingIndex !== null}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add FAQ
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {localFaqs.map((faq, i) => (
              <div
                key={i}
                className="border rounded-lg p-4 bg-background hover:bg-muted/30 transition-colors"
              >
                {editingIndex === i ? (
                  // Edit mode
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`edit-q-${i}`} className="text-sm mb-1.5 block">
                        Question
                      </Label>
                      <Input
                        id={`edit-q-${i}`}
                        value={editQuestion}
                        onChange={(e) => setEditQuestion(e.target.value)}
                        placeholder="Enter question"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-a-${i}`} className="text-sm mb-1.5 block">
                        Answer
                      </Label>
                      <Textarea
                        id={`edit-a-${i}`}
                        value={editAnswer}
                        onChange={(e) => setEditAnswer(e.target.value)}
                        placeholder="Enter answer"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveEdit}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditing}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="flex gap-3">
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => moveFaq(i, "up")}
                        disabled={i === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <GripVertical className="h-4 w-4 text-muted-foreground mx-auto" />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => moveFaq(i, "down")}
                        disabled={i === localFaqs.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <h4 className="font-medium text-sm">{faq.question}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 pl-6 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => startEditing(i)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteFaq(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Add New FAQ Form */}
      {showAddForm && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-green-500" />
              Add New FAQ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new-question" className="text-sm mb-1.5 block">
                Question
              </Label>
              <Input
                id="new-question"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="e.g., What insurance plans do you accept?"
              />
            </div>
            <div>
              <Label htmlFor="new-answer" className="text-sm mb-1.5 block">
                Answer
              </Label>
              <Textarea
                id="new-answer"
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="e.g., We accept most major insurance plans including..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addNewFaq}>
                <Plus className="mr-2 h-4 w-4" />
                Add FAQ
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setNewQuestion("");
                  setNewAnswer("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {localFaqs.length === 0 && !showAddForm && (
        <Card className="bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No FAQs Yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Generate AI-powered FAQs based on this clinic&apos;s data, or add
              your own custom FAQs manually.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleGenerateFAQs} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate FAQs
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Manually
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">About FAQ Management</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>AI Generation</strong> uses OpenRouter to create relevant
            FAQs based on the clinic&apos;s services, reviews, contact info, and
            more.
          </p>
          <Separator className="my-3" />
          <p>
            <strong>Manual Editing:</strong> You can edit, reorder, delete, or
            add FAQs manually. Remember to save your changes.
          </p>
          <Separator className="my-3" />
          <p>
            <strong>SEO Benefit:</strong> FAQs include structured data (Schema)
            that can appear in Google search results as rich snippets.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
