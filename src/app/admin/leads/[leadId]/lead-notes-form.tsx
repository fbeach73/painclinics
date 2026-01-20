"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface LeadNotesFormProps {
  leadId: string;
  currentNotes: string;
  updatedAt: Date;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function LeadNotesForm({
  leadId,
  currentNotes,
  updatedAt,
}: LeadNotesFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState(currentNotes);
  const [savedNotes, setSavedNotes] = useState(currentNotes);

  const hasChanges = notes !== savedNotes;

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notes }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save notes");
      }

      setSavedNotes(notes);
      toast.success("Notes saved");
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error("Failed to save notes", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [leadId, notes, hasChanges, router]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="admin-notes">Admin Notes</Label>
        {savedNotes && (
          <span className="text-xs text-muted-foreground">
            Last updated: {formatDate(updatedAt)}
          </span>
        )}
      </div>
      <Textarea
        id="admin-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes about this lead..."
        rows={4}
        disabled={isLoading}
      />
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isLoading || !hasChanges}
          size="sm"
          variant={hasChanges ? "default" : "outline"}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Notes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
