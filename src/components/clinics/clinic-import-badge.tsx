"use client";

import { Badge } from "@/components/ui/badge";

interface ClinicImportBadgeProps {
  importedAt?: Date | string | null | undefined;
  importUpdatedAt?: Date | string | null | undefined;
  /**
   * Number of days the badge should be visible after import/update.
   * Defaults to 14 days.
   */
  expiryDays?: number;
  /**
   * Whether to show the NEW badge (for public pages).
   * Admin pages may only want to show UPDATED.
   */
  showNew?: boolean;
  /**
   * Whether to show the UPDATED badge.
   */
  showUpdated?: boolean;
  /**
   * Size variant for the badge.
   */
  size?: "sm" | "default";
}

/**
 * Displays a NEW or UPDATED badge for clinics that were recently imported or updated.
 * Badges automatically expire after the specified number of days (default 14).
 */
export function ClinicImportBadge({
  importedAt,
  importUpdatedAt,
  expiryDays = 14,
  showNew = true,
  showUpdated = true,
  size = "default",
}: ClinicImportBadgeProps) {
  const now = new Date();
  const expiryMs = expiryDays * 24 * 60 * 60 * 1000;

  // Parse dates if they're strings
  const importedDate = importedAt ? new Date(importedAt) : null;
  const updatedDate = importUpdatedAt ? new Date(importUpdatedAt) : null;

  // Check if dates are within expiry window
  const isNew = importedDate && now.getTime() - importedDate.getTime() < expiryMs;
  const isUpdated = updatedDate && now.getTime() - updatedDate.getTime() < expiryMs;

  // UPDATED takes precedence over NEW (if both are set, show UPDATED)
  if (showUpdated && isUpdated) {
    return (
      <Badge
        variant="secondary"
        className={`bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 ${
          size === "sm" ? "text-[10px] px-1.5 py-0" : ""
        }`}
      >
        UPDATED
      </Badge>
    );
  }

  if (showNew && isNew) {
    return (
      <Badge
        variant="secondary"
        className={`bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 ${
          size === "sm" ? "text-[10px] px-1.5 py-0" : ""
        }`}
      >
        NEW
      </Badge>
    );
  }

  return null;
}

/**
 * Utility function to check if a clinic should show any import badge.
 * Useful for conditional rendering when you need to check before rendering.
 */
export function hasImportBadge(
  importedAt?: Date | string | null,
  importUpdatedAt?: Date | string | null,
  expiryDays = 14
): { isNew: boolean; isUpdated: boolean } {
  const now = new Date();
  const expiryMs = expiryDays * 24 * 60 * 60 * 1000;

  const importedDate = importedAt ? new Date(importedAt) : null;
  const updatedDate = importUpdatedAt ? new Date(importUpdatedAt) : null;

  return {
    isNew: !!(importedDate && now.getTime() - importedDate.getTime() < expiryMs),
    isUpdated: !!(updatedDate && now.getTime() - updatedDate.getTime() < expiryMs),
  };
}
