"use client";

import Link from "next/link";

import type { CustomerCounts } from "@/lib/admin-customer-queries";
import { cn } from "@/lib/utils";

interface CustomerFilterTabsProps {
  currentStatus: string;
  counts: CustomerCounts;
}

const tabs = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "canceled", label: "Canceled" },
  { value: "past_due", label: "Past Due" },
  { value: "expired", label: "Expired" },
];

export function CustomerFilterTabs({ currentStatus, counts }: CustomerFilterTabsProps) {
  return (
    <div className="flex gap-1 border-b">
      {tabs.map((tab) => {
        const count = counts[tab.value as keyof CustomerCounts];
        const isActive = currentStatus === tab.value;

        return (
          <Link
            key={tab.value}
            href={`/admin/customers?status=${tab.value}`}
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
