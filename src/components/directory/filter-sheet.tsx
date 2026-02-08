"use client";

import { SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FilterSidebarContent } from "./filter-sidebar";
import { countActiveFilters, parseFilters } from "@/lib/directory/filters";

/**
 * Mobile filter sheet - triggered by a sticky "Filter & Sort" button.
 * Wraps the same FilterSidebarContent used on desktop.
 */
export function FilterSheet() {
  const searchParams = useSearchParams();
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  const filters = parseFilters(params);
  const activeCount = countActiveFilters(filters);

  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="relative"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filter & Sort
            {activeCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FilterSidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
