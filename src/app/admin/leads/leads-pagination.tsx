"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LeadsPaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  pageSize: number;
  baseUrl: string;
}

function getPageUrl(baseUrl: string, page: number): string {
  const url = new URL(baseUrl, "http://localhost");
  url.searchParams.set("page", String(page));
  return `${url.pathname}${url.search}`;
}

export function LeadsPagination({
  currentPage,
  totalPages,
  total,
  pageSize,
  baseUrl,
}: LeadsPaginationProps) {
  if (totalPages <= 1) {
    return (
      <div className="text-sm text-muted-foreground text-center py-2">
        Showing {total} lead{total !== 1 ? "s" : ""}
      </div>
    );
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <div className="text-sm text-muted-foreground">
        Showing {start} - {end} of {total} leads
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={currentPage === 1}
          asChild={currentPage !== 1}
        >
          {currentPage === 1 ? (
            <span>
              <ChevronLeft className="h-4 w-4" />
            </span>
          ) : (
            <Link href={getPageUrl(baseUrl, currentPage - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          )}
        </Button>

        {getPageNumbers().map((page, index) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 text-muted-foreground"
            >
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              className={cn("h-8 w-8 p-0", currentPage === page && "pointer-events-none")}
              asChild={currentPage !== page}
            >
              {currentPage === page ? (
                <span>{page}</span>
              ) : (
                <Link href={getPageUrl(baseUrl, page)}>{page}</Link>
              )}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={currentPage === totalPages}
          asChild={currentPage !== totalPages}
        >
          {currentPage === totalPages ? (
            <span>
              <ChevronRight className="h-4 w-4" />
            </span>
          ) : (
            <Link href={getPageUrl(baseUrl, currentPage + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </Button>
      </div>
    </div>
  );
}
