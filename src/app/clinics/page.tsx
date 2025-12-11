import { Suspense } from "react";
import Link from "next/link";
import { Search, MapPin, Star, Phone, ChevronLeft } from "lucide-react";
import { SearchFeaturedSection } from "@/components/featured";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { searchClinics } from "@/lib/clinic-queries";

interface ClinicsPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ClinicsPage({ searchParams }: ClinicsPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || "";

  return (
    <main className="flex-1">
      <div className="container mx-auto py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
          </Button>

          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {query ? `Search Results for "${query}"` : "Search Clinics"}
          </h1>
          <p className="text-muted-foreground">
            {query
              ? "Browse clinics matching your search"
              : "Enter a search term to find pain management clinics"}
          </p>
        </div>

        {/* Featured Clinics Section */}
        <SearchFeaturedSection />

        {/* Results */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          }
        >
          <SearchResults query={query} />
        </Suspense>
      </div>
    </main>
  );
}

async function SearchResults({ query }: { query: string }) {
  if (!query || query.length < 2) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          Enter at least 2 characters to search for clinics
        </p>
      </div>
    );
  }

  const results = await searchClinics(query, 50);

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No results found</h2>
        <p className="text-muted-foreground mb-4">
          We couldn&apos;t find any clinics matching &ldquo;{query}&rdquo;
        </p>
        <p className="text-sm text-muted-foreground">
          Try a different search term, city name, or state abbreviation
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Found {results.length} clinic{results.length !== 1 ? "s" : ""} matching
        your search
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((clinic) => (
          <Link
            key={clinic.id}
            href={`/${clinic.permalink}/`}
            className="block group"
          >
            <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {clinic.title}
                  </h3>
                  {clinic.isFeatured && (
                    <Badge
                      variant="secondary"
                      className="shrink-0 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    >
                      Featured
                    </Badge>
                  )}
                </div>

                {clinic.rating && clinic.rating > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {clinic.rating.toFixed(1)}
                    </span>
                    {clinic.reviewCount && clinic.reviewCount > 0 && (
                      <span className="text-sm text-muted-foreground">
                        ({clinic.reviewCount} reviews)
                      </span>
                    )}
                  </div>
                )}

                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {clinic.streetAddress && `${clinic.streetAddress}, `}
                      {clinic.city}, {clinic.stateAbbreviation}{" "}
                      {clinic.postalCode}
                    </span>
                  </div>
                  {clinic.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{clinic.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
