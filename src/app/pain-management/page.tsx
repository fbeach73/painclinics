import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, ChevronRight, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  getAllStatesWithClinics,
  getClinicCountsByState,
  searchClinicsWithRelevance,
  countSearchClinics,
  detectStateQuery,
} from "@/lib/clinic-queries";
import { getStateName } from "@/lib/us-states";
import { DirectorySearchInput } from "@/components/search/directory-search-input";
import { SearchResultsGrouped } from "@/components/search/search-results-grouped";
import type { Metadata } from "next";

export const revalidate = 2592000; // Revalidate every 30 days

const RESULTS_PER_PAGE = 24;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim();

  if (query && query.length >= 2) {
    return {
      title: `Search Results for '${query}' | Pain Clinics Directory`,
      description: `Search results for "${query}" in our directory of pain management clinics across the United States.`,
      robots: { index: false, follow: true },
    };
  }

  return {
    title: "Pain Management Clinics by State | Find a Clinic Near You",
    description:
      "Browse pain management clinics across all 50 states. Find verified pain specialists, read patient reviews, and schedule appointments at clinics near you.",
    keywords: [
      "pain management clinics",
      "pain clinics by state",
      "find pain clinic",
      "pain management near me",
      "pain specialist directory",
      "chronic pain treatment",
    ],
    openGraph: {
      title: "Pain Management Clinics by State | Find a Clinic Near You",
      description:
        "Browse pain management clinics across all 50 states. Find verified pain specialists, read patient reviews, and schedule appointments.",
      type: "website",
    },
  };
}

export default async function PainManagementDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim();

  // If query is a state name/abbreviation, redirect to state page
  if (query) {
    const stateMatch = detectStateQuery(query);
    if (stateMatch) {
      redirect(`/pain-management/${stateMatch}`);
    }
  }

  const isSearching = !!(query && query.length >= 2);
  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const offset = (currentPage - 1) * RESULTS_PER_PAGE;

  // Fetch search results or state browse data
  let searchResults: Awaited<ReturnType<typeof searchClinicsWithRelevance>> = [];
  let totalResults = 0;
  let states: string[] = [];
  let stateCounts: { stateAbbreviation: string | null; count: number }[] = [];

  try {
    if (isSearching) {
      [searchResults, totalResults] = await Promise.all([
        searchClinicsWithRelevance(query, RESULTS_PER_PAGE, offset),
        countSearchClinics(query),
      ]);
    } else {
      states = await getAllStatesWithClinics();
      stateCounts = await getClinicCountsByState();
    }
  } catch (error) {
    console.warn("Pain Management Directory: Database unavailable:", error);
  }

  const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);

  // State browse data (only used when not searching)
  const countMap = new Map(
    stateCounts.map((s) => [s.stateAbbreviation, s.count])
  );
  const sortedStates = states
    .map((abbrev) => ({
      abbrev,
      name: getStateName(abbrev),
      count: countMap.get(abbrev) || 0,
    }))
    .sort((a, b) => b.count - a.count);
  const totalClinics = stateCounts.reduce((sum, s) => sum + s.count, 0);

  // Structured data for SEO (only on browse view)
  const structuredData = !isSearching
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Pain Management Clinics Directory",
        description:
          "Browse pain management clinics across all 50 states. Find verified pain specialists near you.",
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com"}/pain-management`,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: states.length,
          itemListElement: sortedStates.slice(0, 10).map((state, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: `${state.name} Pain Management Clinics`,
            url: `${process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com"}/pain-management/${state.abbrev.toLowerCase()}`,
          })),
        },
      }
    : null;

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 pt-6">
          <nav aria-label="Breadcrumb">
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
                {isSearching ? (
                  <>
                    <Link href="/pain-management" className="hover:text-primary transition-colors">
                      Pain Management Clinics
                    </Link>
                  </>
                ) : (
                  <span aria-current="page" className="text-foreground font-medium">
                    Pain Management Clinics
                  </span>
                )}
              </li>
              {isSearching && (
                <>
                  <li>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </li>
                  <li>
                    <span aria-current="page" className="text-foreground font-medium">
                      Search Results
                    </span>
                  </li>
                </>
              )}
            </ol>
          </nav>
        </div>

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                {isSearching
                  ? `Search Results for "${query}"`
                  : "Pain Management Clinics by State"}
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                {isSearching
                  ? "Find pain management specialists matching your search."
                  : `Find trusted pain management specialists in your area. Browse ${totalClinics.toLocaleString()} verified clinics across ${states.length} states with ratings, reviews, and contact information.`}
              </p>
              <Suspense>
                <DirectorySearchInput initialQuery={query} />
              </Suspense>
            </div>
          </div>
        </section>

        {isSearching ? (
          /* Search Results */
          <section className="container mx-auto px-4 py-12 md:py-16">
            <SearchResultsGrouped
              results={searchResults}
              query={query}
              totalResults={totalResults}
              currentPage={currentPage}
              totalPages={totalPages}
              resultsPerPage={RESULTS_PER_PAGE}
            />
          </section>
        ) : (
          <>
            {/* Stats Section */}
            <section className="border-y bg-muted/30 py-8">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div className="space-y-1">
                    <div className="flex justify-center">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-2xl font-bold">{totalClinics.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Verified Clinics</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-center">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-2xl font-bold">{states.length}</p>
                    <p className="text-sm text-muted-foreground">States Covered</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-2xl font-bold">1M+</p>
                    <p className="text-sm text-muted-foreground">Patients Helped</p>
                  </div>
                </div>
              </div>
            </section>

            {/* States Grid */}
            <section id="states" className="container mx-auto px-4 py-12 md:py-16">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Select Your State</h2>
                <p className="text-muted-foreground">
                  Choose a state to view pain management clinics in your area.
                  States are sorted by number of clinics available.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedStates.map(({ abbrev, name, count }) => (
                  <Link
                    key={abbrev}
                    href={`/pain-management/${abbrev.toLowerCase()}`}
                    className="block"
                  >
                    <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{name}</p>
                          <p className="text-sm text-muted-foreground">
                            {count.toLocaleString()} clinic{count !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="text-2xl font-bold text-primary/20">
                          {abbrev}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>

            {/* SEO Content Section */}
            <section className="border-t bg-muted/20 py-12 md:py-16">
              <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto prose prose-gray dark:prose-invert">
                  <h2>About Our Pain Management Directory</h2>
                  <p>
                    Pain Clinics is the most comprehensive directory of pain
                    management specialists in the United States. We help patients
                    find qualified pain doctors, interventional pain specialists,
                    and chronic pain treatment centers in their local area.
                  </p>
                  <h3>What to Expect at a Pain Management Clinic</h3>
                  <p>
                    Pain management clinics offer a variety of treatments for acute
                    and chronic pain conditions, including:
                  </p>
                  <ul>
                    <li>Medication management and prescription therapies</li>
                    <li>Interventional procedures (injections, nerve blocks)</li>
                    <li>Physical therapy and rehabilitation</li>
                    <li>Alternative treatments (acupuncture, massage therapy)</li>
                    <li>Psychological support for chronic pain</li>
                  </ul>
                  <h3>How to Choose a Pain Clinic</h3>
                  <p>
                    When selecting a pain management clinic, consider factors such
                    as the clinic&apos;s specialization, patient reviews, insurance
                    acceptance, and location. Our directory provides all this
                    information to help you make an informed decision about your
                    pain care.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
