"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";

export function PlacementToggleClient({
  id,
  isActive: initialIsActive,
}: {
  id: string;
  isActive: boolean;
}) {
  const [isActive, setIsActive] = useState(initialIsActive);
  const [loading, setLoading] = useState(false);

  async function handleToggle(checked: boolean) {
    setLoading(true);
    setIsActive(checked);
    try {
      await fetch("/api/admin/ads/placements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: checked }),
      });
    } catch {
      // Revert on error
      setIsActive(!checked);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Switch
      checked={isActive}
      onCheckedChange={handleToggle}
      disabled={loading}
    />
  );
}
