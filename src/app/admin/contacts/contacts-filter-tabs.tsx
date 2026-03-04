"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface ContactsFilterTabsProps {
  currentTag: string;
  counts: {
    user: number;
    lead: number;
    total: number;
  };
}

const tabs = [
  { value: "all", label: "All", countKey: "total" as const },
  { value: "user", label: "Users", countKey: "user" as const },
  { value: "lead", label: "Leads", countKey: "lead" as const },
];

export function ContactsFilterTabs({
  currentTag,
  counts,
}: ContactsFilterTabsProps) {
  return (
    <div className="flex gap-1 border-b overflow-x-auto">
      {tabs.map((tab) => {
        const count = counts[tab.countKey];
        const isActive = currentTag === tab.value;

        return (
          <Link
            key={tab.value}
            href={
              tab.value === "all"
                ? "/admin/contacts"
                : `/admin/contacts?tag=${tab.value}`
            }
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                isActive
                  ? "bg-primary/10 text-primary"
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
