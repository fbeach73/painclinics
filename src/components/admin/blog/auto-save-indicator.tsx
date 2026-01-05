"use client";

import { CheckCircle, Loader2, AlertCircle, Cloud, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error" | "offline";

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSaved?: Date | null;
  className?: string;
}

export function AutoSaveIndicator({
  status,
  lastSaved,
  className,
}: AutoSaveIndicatorProps) {
  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) {
      return "just now";
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case "saved":
        return {
          icon: CheckCircle,
          text: lastSaved
            ? `Saved ${formatLastSaved(lastSaved)}`
            : "All changes saved",
          color: "text-green-600 dark:text-green-400",
          animate: false,
        };
      case "saving":
        return {
          icon: Loader2,
          text: "Saving...",
          color: "text-muted-foreground",
          animate: true,
        };
      case "unsaved":
        return {
          icon: Cloud,
          text: "Unsaved changes",
          color: "text-featured-foreground",
          animate: false,
        };
      case "error":
        return {
          icon: AlertCircle,
          text: "Failed to save",
          color: "text-destructive",
          animate: false,
        };
      case "offline":
        return {
          icon: CloudOff,
          text: "Offline",
          color: "text-muted-foreground",
          animate: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={cn("flex items-center gap-1.5 text-xs", config.color, className)}
    >
      <Icon className={cn("h-3.5 w-3.5", config.animate && "animate-spin")} />
      <span>{config.text}</span>
    </div>
  );
}
