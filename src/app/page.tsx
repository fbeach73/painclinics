import Link from 'next/link';
import { MapPin, Phone, Search, Shield, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getAllStatesWithClinics, getClinicCountsByState } from '@/lib/clinic-queries';
import {
  generateWebSiteSchema,
  generateOrganizationSchema,
} from '@/lib/structured-data';
import { getStateName } from '@/lib/us-states';

// ISR: Revalidate every hour
export const revalidate = 3600;

export default async function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";
  const states = await getAllStatesWithClinics();
  const stateCounts = await getClinicCountsByState();

  // Create a map for quick count lookup
  const countMap = new Map(
    stateCounts.map((s) => [s.stateAbbreviation, s.count])
  );

  // Sort states by clinic count (most clinics first)
  const sortedStates = states
    .map((abbrev) => ({
      abbrev,
      name: getStateName(abbrev),
      count: countMap.get(abbrev) || 0,
    }))
    .sort((a, b) => b.count - a.count);

  const totalClinics = stateCounts.reduce((sum, s) => sum + s.count, 0);

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
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Find Pain Management Clinics Near You
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Browse {totalClinics.toLocaleString()} verified pain management clinics across {states.length} states.
              Find the right care for your chronic pain needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link href="#browse-states">
                  <Search className="h-5 w-5" />
                  Browse by State
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="border-y bg-muted/30 py-8">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-2">
              <div className="flex justify-center">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <p className="text-2xl font-bold">{totalClinics.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Verified Clinics</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <p className="text-2xl font-bold">{states.length}</p>
              <p className="text-sm text-muted-foreground">States Covered</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-center">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <p className="text-2xl font-bold">4.5+</p>
              <p className="text-sm text-muted-foreground">Avg. Rating</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <p className="text-2xl font-bold">100%</p>
              <p className="text-sm text-muted-foreground">Verified Listings</p>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by State Section */}
      <section id="browse-states" className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Browse Clinics by State
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select your state to find pain management clinics near you.
            Each listing includes ratings, reviews, and contact information.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedStates.map(({ abbrev, name, count }) => (
            <Link
              key={abbrev}
              href={`/pain-management/${abbrev.toLowerCase()}/`}
              className="block"
            >
              <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{name}</p>
                    <p className="text-sm text-muted-foreground">
                      {count.toLocaleString()} clinic{count !== 1 ? 's' : ''}
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

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">
            Need Help Finding the Right Clinic?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Our directory makes it easy to find qualified pain management specialists
            in your area. Browse by location, read patient reviews, and find the care you need.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg" asChild className="gap-2">
              <Link href="#browse-states">
                <Search className="h-5 w-5" />
                Find a Clinic
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="gap-2 bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10">
              <a href="tel:+1-800-555-0123">
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
