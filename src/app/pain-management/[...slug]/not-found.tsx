import Link from "next/link";
import { MapPin, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NotFoundLogger } from "@/components/not-found-logger";

export default function ClinicNotFound() {
  return (
    <main className="flex-1">
      <NotFoundLogger />
      <div className="container py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Icon */}
          <div className="mb-8">
            <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center">
              <MapPin className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Clinic Not Found
          </h1>

          <p className="text-lg text-muted-foreground mb-8">
            We couldn&apos;t find the pain management clinic you&apos;re looking for.
            The clinic may have been removed or the URL may be incorrect.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg">
              <Link href="/clinics">
                <Search className="h-4 w-4" />
                Search All Clinics
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          {/* Helpful Suggestions */}
          <Card className="text-left">
            <CardHeader>
              <CardTitle>Looking for a Pain Management Clinic?</CardTitle>
              <CardDescription>
                Try one of these options to find the care you need
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div>
                  <p className="font-medium">Browse by Location</p>
                  <p className="text-sm text-muted-foreground">
                    Use our{" "}
                    <Link href="/clinics" className="text-primary hover:underline">
                      interactive map
                    </Link>{" "}
                    to find clinics in your area
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div>
                  <p className="font-medium">Search by City or ZIP Code</p>
                  <p className="text-sm text-muted-foreground">
                    Enter your location on our{" "}
                    <Link href="/clinics" className="text-primary hover:underline">
                      clinic search page
                    </Link>{" "}
                    to find nearby options
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div>
                  <p className="font-medium">Check the URL</p>
                  <p className="text-sm text-muted-foreground">
                    Make sure the clinic URL is spelled correctly. If you
                    followed a link, it may be outdated.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
