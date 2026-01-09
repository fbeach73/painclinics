"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface EmailPreferencesFormProps {
  userId: string;
  isUnsubscribed: boolean;
}

export function EmailPreferencesForm({ userId, isUnsubscribed }: EmailPreferencesFormProps) {
  const router = useRouter();
  const [isSubscribed, setIsSubscribed] = useState(!isUnsubscribed);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/email-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          subscribed: checked,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      setIsSubscribed(checked);
      toast.success(
        checked
          ? "You have been resubscribed to marketing emails"
          : "You have been unsubscribed from marketing emails"
      );
      router.refresh();
    } catch {
      toast.error("Failed to update email preferences");
      // Revert the switch
      setIsSubscribed(!checked);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Switch
      checked={isSubscribed}
      onCheckedChange={handleToggle}
      disabled={isLoading}
      aria-label="Marketing emails subscription"
    />
  );
}
