import Link from 'next/link';
import { MapPin, Phone, Star, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getStateName } from '@/lib/us-states';
import type { SearchClinicResult } from '@/lib/clinic-queries';

interface SearchResultsGroupedProps {
  results: SearchClinicResult[];
  query: string;
}

export function SearchResultsGrouped({ results, query }: SearchResultsGroupedProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">No results found</h2>
        <p className="text-muted-foreground mb-6">
          No clinics matched &ldquo;{query}&rdquo;. Try a different search or browse by state.
        </p>
        <Button asChild>
          <Link href="/pain-management">Browse All States</Link>
        </Button>
      </div>
    );
  }

  // Group results by state
  const grouped = new Map<string, SearchClinicResult[]>();
  for (const clinic of results) {
    const state = clinic.stateAbbreviation ?? 'Unknown';
    const existing = grouped.get(state);
    if (existing) {
      existing.push(clinic);
    } else {
      grouped.set(state, [clinic]);
    }
  }

  // Sort states by result count (most results first)
  const sortedStates = [...grouped.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <div>
      {/* Results header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <h2 className="text-2xl font-bold">
          {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
        </h2>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/pain-management">Clear Search</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pain-management#states">Browse All States</Link>
          </Button>
        </div>
      </div>

      {/* Grouped results */}
      <div className="space-y-10">
        {sortedStates.map(([stateAbbrev, clinics]) => (
          <section key={stateAbbrev}>
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-xl font-semibold">
                <Link
                  href={`/pain-management/${stateAbbrev.toLowerCase()}`}
                  className="hover:text-primary transition-colors"
                >
                  {getStateName(stateAbbrev)}
                </Link>
              </h3>
              <Badge variant="secondary">
                {clinics.length} clinic{clinics.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clinics.map((clinic) => (
                <Link key={clinic.id} href={`/${clinic.permalink}/`} className="block">
                  <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold leading-tight line-clamp-2">
                          {clinic.title}
                        </h4>
                        {clinic.isFeatured && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            Featured
                          </Badge>
                        )}
                      </div>

                      {clinic.rating !== null && clinic.reviewCount !== null && clinic.rating > 0 && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{clinic.rating.toFixed(1)}</span>
                          <span className="text-muted-foreground">({clinic.reviewCount})</span>
                        </div>
                      )}

                      <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">
                          {clinic.streetAddress ? `${clinic.streetAddress}, ` : ''}
                          {clinic.city}, {clinic.stateAbbreviation} {clinic.postalCode}
                        </span>
                      </div>

                      {clinic.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>{clinic.phone}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
