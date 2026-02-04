import Link from 'next/link';
import { MapPin, Phone, Search, Shield, Star, Users } from 'lucide-react';
import { InPageAd, AdPlacement } from '@/components/ads';
import { LazyHomepageFeaturedSection } from '@/components/featured';
import {
  FindClinicSection,
  type PopularState,
} from '@/components/home/find-clinic-section';
import { STATE_NAMES } from '@/components/home/state-combobox';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  generateWebSiteSchema,
  generateOrganizationSchema,
} from '@/lib/structured-data';

// ISR: Revalidate every hour
export const revalidate = 86400;

export default async function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com";

  // Fetch states and counts with fallback for CI builds
  let states: string[] = [];
  let totalClinics = 0;
  let popularStates: PopularState[] = [];

  try {
    const { getAllStatesWithClinics, getClinicCountsByState } = await import('@/lib/clinic-queries');
    states = await getAllStatesWithClinics();
    const stateCounts = await getClinicCountsByState();
    totalClinics = stateCounts.reduce((sum, s) => sum + s.count, 0);

    // Prepare top 6 states by clinic count for the FindClinicSection
    popularStates = stateCounts
      .filter((s) => s.stateAbbreviation !== null)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((s) => ({
        abbrev: s.stateAbbreviation!,
        name: STATE_NAMES[s.stateAbbreviation!] || s.stateAbbreviation!,
        slug: s.stateAbbreviation!.toLowerCase(),
        count: s.count,
      }));
  } catch (error) {
    console.warn("Homepage: Database unavailable, using empty data:", error);
  }

  // Generate structured data schemas
  const websiteSchema = generateWebSiteSchema(baseUrl);
  const organizationSchema = generateOrganizationSchema(baseUrl);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <main className="flex-1">
        {/* Hero Section with Title */}
        <section className="bg-gradient-to-b from-primary/10 via-primary/5 to-background dark:from-primary/20 dark:via-primary/10 pt-16 pb-10 md:pt-24 md:pb-12 border-b border-border/50">
          <div className="container mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-balance mb-4">
                Find Pain Management Clinics Near You
              </h1>
              <p className="text-lg text-muted-foreground mb-6">
                Browse {totalClinics.toLocaleString()} verified pain management clinics across {states.length} states.
                Enable location to see clinics near you or browse by state below.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Clinics Section - Lazy loaded for PageSpeed */}
        <LazyHomepageFeaturedSection />

        {/* Single In-Page Ad */}
        <section className="container mx-auto py-6">
          <AdPlacement>
            <InPageAd />
          </AdPlacement>
        </section>

        {/* Find Clinic Section - State selector and popular states */}
        <FindClinicSection popularStates={popularStates} />

        {/* Trust Indicators */}
        <section className="border-y bg-muted/50 py-16">
          <div className="container mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-3">
                <div className="flex justify-center">
                  <MapPin className="h-10 w-10 text-primary" />
                </div>
                <p className="text-3xl md:text-4xl font-bold">{totalClinics.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Verified Clinics</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-center">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <p className="text-3xl md:text-4xl font-bold">{states.length}</p>
                <p className="text-sm text-muted-foreground">States Covered</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-center">
                  <Star className="h-10 w-10 text-primary" />
                </div>
                <p className="text-3xl md:text-4xl font-bold">4.5+</p>
                <p className="text-sm text-muted-foreground">Avg. Rating</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-center">
                  <Shield className="h-10 w-10 text-primary" />
                </div>
                <p className="text-3xl md:text-4xl font-bold">100%</p>
                <p className="text-sm text-muted-foreground">Verified Listings</p>
              </div>
            </div>
          </div>
        </section>

        {/* Browse by State CTA */}
        <section id="browse-states" className="container mx-auto py-16 md:py-20">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8 md:p-12 text-center">
              <MapPin className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold tracking-tight text-balance mb-4">
                Browse Clinics by State
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                Find pain management clinics in all {states.length} states. Each listing includes
                ratings, patient reviews, and contact information to help you find the right care.
              </p>
              <Button size="lg" asChild className="gap-2 font-semibold">
                <Link href="/pain-management">
                  <Search className="h-5 w-5" />
                  View All {states.length} States
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="bg-primary text-primary-foreground py-16 md:py-20">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tight text-balance mb-4">
              Need Help Finding the Right Clinic?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Our directory makes it easy to find qualified pain management specialists
              in your area. Browse by location, read patient reviews, and find the care you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" asChild className="gap-2 font-semibold">
                <Link href="#browse-states">
                  <Search className="h-5 w-5" />
                  Find a Clinic
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="gap-2 font-semibold bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10">
                <a href="tel:+1-800-662-4357">
                  <Phone className="h-5 w-5" />
                  Call for Help
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
