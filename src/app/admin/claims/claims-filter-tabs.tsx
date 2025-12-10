"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface ClaimsFilterTabsProps {
  currentStatus: string;
  counts: {
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
    total: number;
  };
}

const tabs = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "all", label: "All" },
];

export function ClaimsFilterTabs({ currentStatus, counts }: ClaimsFilterTabsProps) {
  return (
    <div className="flex gap-1 border-b">
      {tabs.map((tab) => {
        const count = tab.value === "all" ? counts.total : counts[tab.value as keyof typeof counts];
        const isActive = currentStatus === tab.value;

        return (
          <Link
            key={tab.value}
            href={`/admin/claims?status=${tab.value}`}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
            )}
          >
            {tab.label}
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full",
              isActive
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}>
              {count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
