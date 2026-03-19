"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MatchStatus = "matched" | "contacted" | "booked" | "converted";

const STATUS_LABELS: Record<MatchStatus, string> = {
  matched: "Matched",
  contacted: "Contacted",
  booked: "Booked",
  converted: "Converted",
};

interface Props {
  matchId: string;
  initialStatus: MatchStatus;
}

export function MatchStatusSelect({ matchId, initialStatus }: Props) {
  const [status, setStatus] = useState<MatchStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    const next = value as MatchStatus;
    startTransition(async () => {
      setStatus(next);
      await fetch(`/api/admin/consult-leads/${matchId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
    });
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="h-7 w-[110px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(STATUS_LABELS) as MatchStatus[]).map((s) => (
          <SelectItem key={s} value={s} className="text-xs">
            {STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
