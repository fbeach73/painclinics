"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function getPageUrl(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const qs = params.toString();
    return `${pathname}${qs ? `?${qs}` : ""}`;
  }

  // Generate page numbers to show
  const pages: (number | "ellipsis")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("ellipsis");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className={cn(currentPage <= 1 && "pointer-events-none opacity-50")}
      >
        <Link href={getPageUrl(currentPage - 1)}>
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Link>
      </Button>

      {pages.map((page, i) =>
        page === "ellipsis" ? (
          <span key={`e-${i}`} className="px-2 text-muted-foreground">
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "ghost"}
            size="sm"
            asChild
            className="min-w-[32px]"
          >
            <Link href={getPageUrl(page)}>{page}</Link>
          </Button>
        )
      )}

      <Button
        variant="ghost"
        size="sm"
        asChild
        className={cn(
          currentPage >= totalPages && "pointer-events-none opacity-50"
        )}
      >
        <Link href={getPageUrl(currentPage + 1)}>
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </nav>
  );
}
