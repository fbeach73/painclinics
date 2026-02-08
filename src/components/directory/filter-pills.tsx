"use client";

import { X } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { parseFilters, getActiveFilterPills } from "@/lib/directory/filters";

/**
 * Removable filter pills showing active filters above results.
 * Clicking X on a pill removes that filter from the URL.
 */
export function FilterPills() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  const filters = parseFilters(params);
  const pills = getActiveFilterPills(filters);

  function removePill(paramKey: string, paramValue: string) {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete("page");

    if (paramValue === "") {
      newParams.delete(paramKey);
    } else {
      const current = newParams.get(paramKey)?.split(",").filter(Boolean) ?? [];
      const next = current.filter((v) => v !== paramValue);
      if (next.length === 0) {
        newParams.delete(paramKey);
      } else {
        newParams.set(paramKey, next.join(","));
      }
    }

    const qs = newParams.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  function clearAll() {
    const newParams = new URLSearchParams();
    const sort = searchParams.get("sort");
    if (sort) newParams.set("sort", sort);
    const qs = newParams.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  if (pills.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pills.map((pill) => (
        <Badge
          key={pill.key}
          variant="secondary"
          className="gap-1 pr-1 cursor-pointer hover:bg-destructive/10"
          onClick={() => removePill(pill.paramKey, pill.paramValue)}
        >
          {pill.label}
          <X className="h-3 w-3" />
        </Badge>
      ))}
      {pills.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-muted-foreground"
          onClick={clearAll}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
