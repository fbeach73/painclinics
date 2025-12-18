import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
}

export function BlogPagination({
  currentPage,
  totalPages,
  basePath = "/blog",
}: BlogPaginationProps) {
  if (totalPages <= 1) return null;

  const getPageHref = (page: number) => {
    if (page === 1) return basePath;
    return `${basePath}?page=${page}`;
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const showPages = 5; // Maximum pages to show

    if (totalPages <= showPages) {
      // Show all pages if total is less than or equal to showPages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
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

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className="flex items-center justify-center gap-1"
      aria-label="Blog pagination"
    >
      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage === 1}
        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
      >
        <Link href={getPageHref(currentPage - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>

      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) =>
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
              size="icon"
              asChild={currentPage !== page}
              className="w-9"
            >
              {currentPage === page ? (
                <span>{page}</span>
              ) : (
                <Link href={getPageHref(page)} aria-label={`Go to page ${page}`}>
                  {page}
                </Link>
              )}
            </Button>
          )
        )}
      </div>

      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage === totalPages}
        className={
          currentPage === totalPages ? "pointer-events-none opacity-50" : ""
        }
      >
        <Link href={getPageHref(currentPage + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </nav>
  );
}
