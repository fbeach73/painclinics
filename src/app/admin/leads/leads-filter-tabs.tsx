"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadsFilterTabsProps {
  currentStatus: string;
  counts: {
    all: number;
    new: number;
    contacted: number;
    qualified: number;
    closed: number;
    needs_followup: number;
  };
}

const tabs = [
  { value: "all", label: "All" },
  { value: "needs_followup", label: "Needs Follow-up", warning: true },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "closed", label: "Closed" },
];

export function LeadsFilterTabs({
  currentStatus,
  counts,
}: LeadsFilterTabsProps) {
  return (
    <div className="flex gap-1 border-b overflow-x-auto">
      {tabs.map((tab) => {
        const count = counts[tab.value as keyof typeof counts];
        const isActive = currentStatus === tab.value;
        const showWarning = tab.warning && count > 0;

        return (
          <Link
            key={tab.value}
            href={`/admin/leads?status=${tab.value}`}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
            )}
          >
            {showWarning && (
              <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
            )}
            {tab.label}
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                isActive
                  ? "bg-primary/10 text-primary"
                  : showWarning
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
