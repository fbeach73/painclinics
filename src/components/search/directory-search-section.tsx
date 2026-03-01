"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchResultsGrouped } from "./search-results-grouped";
import { DirectorySearchInput } from "./directory-search-input";
import type { SearchClinicResult } from "@/lib/clinic-queries";
import { Skeleton } from "@/components/ui/skeleton";

const RESULTS_PER_PAGE = 24;

interface SearchState {
  query: string;
  results: SearchClinicResult[];
  totalResults: number;
  totalPages: number;
  currentPage: number;
}

function SearchSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-40" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DirectorySearchSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchState, setSearchState] = useState<SearchState | null>(null);
  const initialQuery = searchParams.get("q")?.trim();

  async function fetchResults(query: string, page = 1) {
    const params = new URLSearchParams({ q: query, page: String(page) });
    const res = await fetch(`/api/clinics/search?${params}`);
    if (!res.ok) throw new Error("Search failed");
    return res.json();
  }

  // Auto-fetch on mount when navigated with ?q= (from header search, "See all results", etc.)
  useEffect(() => {
    if (!initialQuery || initialQuery.length < 2) return;
    handleSearch(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  function handleSearch(query: string) {
    startTransition(async () => {
      try {
        const data = await fetchResults(query);

        if (data.redirect) {
          router.push(data.redirect);
          return;
        }

        setSearchState({
          query,
          results: data.results,
          totalResults: data.totalResults,
          totalPages: data.totalPages,
          currentPage: data.currentPage,
        });
      } catch (error) {
        console.error("Search error:", error);
      }
    });
  }

  function handleClear() {
    setSearchState(null);
    // Remove ?q= from URL without full navigation
    window.history.replaceState(null, "", "/pain-management");
  }

  function handlePageChange(page: number) {
    if (!searchState) return;
    startTransition(async () => {
      try {
        const data = await fetchResults(searchState.query, page);
        setSearchState({
          query: searchState.query,
          results: data.results,
          totalResults: data.totalResults,
          totalPages: data.totalPages,
          currentPage: data.currentPage,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        console.error("Pagination error:", error);
      }
    });
  }

  return (
    <>
      <DirectorySearchInput
        initialQuery={initialQuery ?? undefined}
        onSearch={handleSearch}
        onClear={handleClear}
        isSearching={searchState !== null}
      />

      {isPending && <SearchSkeleton />}

      {!isPending && searchState && (
        <section className="container mx-auto px-4 py-12 md:py-16">
          <SearchResultsGrouped
            results={searchState.results}
            query={searchState.query}
            totalResults={searchState.totalResults}
            currentPage={searchState.currentPage}
            totalPages={searchState.totalPages}
            resultsPerPage={RESULTS_PER_PAGE}
            onPageChange={handlePageChange}
            onClear={handleClear}
          />
        </section>
      )}
    </>
  );
}
