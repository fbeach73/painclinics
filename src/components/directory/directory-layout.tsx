import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { InPageAd, AdPlacement } from "@/components/ads";
import { Button } from "@/components/ui/button";
import type { DirectoryFilters } from "@/lib/directory/filters";
import { hasActiveFilters } from "@/lib/directory/filters";
import type { FilteredClinicsResult } from "@/lib/directory/queries";
import { getContextualContent, getDefaultContent } from "@/lib/directory/content";
import { FilterSidebar } from "./filter-sidebar";
import { FilterSheet } from "./filter-sheet";
import { FilterPills } from "./filter-pills";
import { SortDropdown } from "./sort-dropdown";
import { StatsBar } from "./stats-bar";
import { ClinicListCard } from "./clinic-list-card";
import { ContextualContent } from "./contextual-content";
import { BrowseBySection } from "./browse-by-section";
import { Pagination } from "./pagination";

interface DirectoryLayoutProps {
  // Location
  locationName: string; // "Dallas, TX" or "Texas"
  stateName: string;
  stateAbbrev: string;
  cityName?: string;
  citySlug?: string;
  // Data
  result: FilteredClinicsResult;
  filters: DirectoryFilters;
  // Browse-by data
  specialties: Array<{ name: string; slug: string; count: number }>;
  insuranceList: Array<{ name: string; slug: string; count: number }>;
  nearbyCities: Array<{ city: string; count: number; slug: string }>;
  // Breadcrumbs (rendered in parent)
  children?: React.ReactNode;
}

export function DirectoryLayout({
  locationName,
  stateName,
  stateAbbrev,
  cityName,
  citySlug,
  result,
  filters,
  specialties,
  insuranceList,
  nearbyCities,
  children,
}: DirectoryLayoutProps) {
  const isFiltered = hasActiveFilters(filters);
  const contentBlock = isFiltered
    ? getContextualContent(filters)
    : getDefaultContent(locationName, result.stats.totalCount);

  const basePath = citySlug
    ? `/pain-management/${stateAbbrev.toLowerCase()}/${citySlug}/`
    : `/pain-management/${stateAbbrev.toLowerCase()}/`;

  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
            </li>
            <li>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li>
              <Link
                href="/clinics"
                className="hover:text-primary transition-colors"
              >
                Clinics
              </Link>
            </li>
            <li>
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            {cityName ? (
              <>
                <li>
                  <Link
                    href={`/pain-management/${stateAbbrev.toLowerCase()}/`}
                    className="hover:text-primary transition-colors"
                  >
                    {stateName}
                  </Link>
                </li>
                <li>
                  <ChevronRight className="h-3.5 w-3.5" />
                </li>
                <li>
                  <span aria-current="page" className="text-foreground font-medium">
                    {cityName}
                  </span>
                </li>
              </>
            ) : (
              <li>
                <span aria-current="page" className="text-foreground font-medium">
                  {stateName}
                </span>
              </li>
            )}
          </ol>
        </nav>

        {/* H1 + subtitle */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            {isFiltered
              ? `${result.stats.filteredCount} Pain Management Clinic${result.stats.filteredCount !== 1 ? "s" : ""} in ${locationName}`
              : `Pain Management Clinics in ${locationName}`}
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            {isFiltered
              ? `Showing ${result.stats.filteredCount} of ${result.stats.totalCount} clinics matching your filters.`
              : `Find top-rated pain management clinics in ${locationName}. Browse ${result.stats.totalCount.toLocaleString()} verified clinic${result.stats.totalCount !== 1 ? "s" : ""}, read patient reviews, and schedule appointments.`}
          </p>
        </div>

        {/* Stats bar */}
        <div className="mb-4">
          <StatsBar stats={result.stats} locationName={locationName} />
        </div>

        {/* Active filter pills */}
        <div className="mb-4">
          <Suspense>
            <FilterPills />
          </Suspense>
        </div>

        {/* Main layout: sidebar + results */}
        <div className="flex gap-6">
          {/* Desktop filter sidebar */}
          <Suspense>
            <FilterSidebar />
          </Suspense>

          {/* Results column */}
          <div className="flex-1 min-w-0">
            {/* Mobile filter + sort bar */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <Suspense>
                <FilterSheet />
              </Suspense>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {result.stats.filteredCount} clinic
                  {result.stats.filteredCount !== 1 ? "s" : ""}
                </span>
                <Suspense>
                  <SortDropdown />
                </Suspense>
              </div>
            </div>

            {/* Clinic cards */}
            {result.clinics.length > 0 ? (
              <div className="space-y-3">
                {result.clinics.map((clinic, index) => (
                  <div key={clinic.id}>
                    <ClinicListCard clinic={clinic} />
                    {/* Ad after card 3 */}
                    {index === 2 && (
                      <AdPlacement className="my-3">
                        <InPageAd />
                      </AdPlacement>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 rounded-lg border bg-card">
                <p className="text-lg font-medium mb-2">
                  No clinics match your filters
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Try removing some filters or broadening your search.
                </p>
                <Button asChild variant="outline">
                  <Link href={basePath}>Clear All Filters</Link>
                </Button>
              </div>
            )}

            {/* Pagination */}
            {result.totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={result.currentPage}
                  totalPages={result.totalPages}
                />
              </div>
            )}
          </div>
        </div>

        {/* Contextual content */}
        {contentBlock && (
          <div className="mt-8">
            <ContextualContent
              title={contentBlock.title}
              body={contentBlock.body}
            />
          </div>
        )}

        {/* Browse-by sections */}
        <div className="mt-8">
          <BrowseBySection
            stateAbbrev={stateAbbrev}
            citySlug={citySlug}
            specialties={specialties}
            insuranceList={insuranceList}
            nearbyCities={nearbyCities}
          />
        </div>

        {/* Back to state link for city pages */}
        {cityName && (
          <div className="mt-8">
            <Link
              href={`/pain-management/${stateAbbrev.toLowerCase()}/`}
              className="inline-flex items-center gap-2 text-primary hover:underline text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              View all clinics in {stateName}
            </Link>
          </div>
        )}

        {/* Extra content passed from parent */}
        {children}
      </div>
    </main>
  );
}
