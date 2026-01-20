"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FollowUpFormProps {
  leadId: string;
  clinicName: string;
  clinicEmail: string | null;
  patientName: string;
}

const DEFAULT_MESSAGE_TEMPLATE = `Hello,

We're following up on a patient inquiry submitted through PainClinics.com. We want to ensure you received the patient's contact information and are able to reach out to them.

If you did not receive the original inquiry or if this email address is incorrect, please let us know so we can update our records.

Thank you for being part of the PainClinics.com directory!`;

export function FollowUpForm({
  leadId,
  clinicName,
  clinicEmail,
  patientName,
}: FollowUpFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(DEFAULT_MESSAGE_TEMPLATE);

  if (!clinicEmail) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This clinic has no email address on file. Cannot send follow-up email.
        </AlertDescription>
      </Alert>
    );
  }

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Message required", {
        description: "Please enter a message to send.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send follow-up email");
      }

      toast.success("Follow-up email sent", {
        description: `Email sent to ${clinicEmail}`,
      });
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error("Failed to send follow-up email", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-md p-3 text-sm">
        <p className="text-muted-foreground">
          This email will be sent to <strong>{clinicEmail}</strong> regarding
          the inquiry from <strong>{patientName}</strong>.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="follow-up-message">Message</Label>
        <Textarea
          id="follow-up-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your follow-up message..."
          rows={8}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          The email will include the patient&apos;s name and original submission
          date in the template header.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={isLoading || !message.trim()}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send Follow-up Email to {clinicName}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
