import { Award, CheckCircle2, Target, TrendingUp, Users } from "lucide-react";
import { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { AdvertiseForm } from "./advertise-form";

export const metadata: Metadata = {
  title: "Advertise With Us | Pain Clinics",
  description:
    "Reach patients actively searching for pain management solutions. Advertising opportunities for healthcare providers, medical device companies, and related businesses.",
};

const audienceStats = [
  {
    icon: Users,
    stat: "Thousands",
    label: "Monthly Visitors",
    description: "Patients actively seeking pain management care",
  },
  {
    icon: Target,
    stat: "Targeted",
    label: "Healthcare Audience",
    description: "People searching for pain treatment options",
  },
  {
    icon: TrendingUp,
    stat: "Growing",
    label: "Platform",
    description: "Expanding reach across all 50 states",
  },
  {
    icon: Award,
    stat: "Quality",
    label: "Content",
    description: "Trusted resource for pain management info",
  },
];

const opportunities = [
  {
    title: "Featured Clinic Listing",
    description: "Get premium placement in search results and on relevant pages",
    features: [
      "Top placement in location searches",
      "Enhanced clinic profile",
      "Highlighted in relevant categories",
      "Priority display badge",
    ],
    popular: true,
  },
  {
    title: "Display Advertising",
    description: "Banner ads strategically placed throughout the site",
    features: [
      "Homepage banner placement",
      "Category page sidebars",
      "Clinic listing pages",
      "Custom targeting options",
    ],
    popular: false,
  },
  {
    title: "Sponsored Content",
    description: "Educational content that showcases your expertise",
    features: [
      "Blog posts and articles",
      "Treatment guides",
      "Expert Q&A features",
      "Resource page mentions",
    ],
    popular: false,
  },
];

export default function AdvertisePage() {
  return (
    <main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Advertise With Us</h1>
          <p className="text-lg text-foreground/70">
            Connect with patients actively searching for pain management solutions across the United
            States.
          </p>
        </div>

        {/* Audience Stats */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Our Audience</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {audienceStats.map((item) => (
              <Card key={item.label}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-primary/10 p-3 mb-3">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-primary mb-1">{item.stat}</div>
                    <div className="font-medium mb-1">{item.label}</div>
                    <p className="text-xs text-foreground/80">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Who Should Advertise */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Who Should Advertise</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">Healthcare Providers</h3>
                  <ul className="space-y-2 text-sm text-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      Pain management clinics
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      Physical therapy centers
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      Rehabilitation facilities
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      Specialty hospitals
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Related Businesses</h3>
                  <ul className="space-y-2 text-sm text-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      Medical device companies
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      Pharmaceutical companies
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      Healthcare technology providers
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      Wellness product companies
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Advertising Opportunities */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Advertising Opportunities</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {opportunities.map((opp) => (
              <Card key={opp.title} className={opp.popular ? "border-primary" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{opp.title}</CardTitle>
                    {opp.popular && <Badge>Popular</Badge>}
                  </div>
                  <CardDescription>{opp.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {opp.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact for Advertising */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Get Started</h2>
          <AdvertiseForm />

          <div className="mt-6 text-center text-sm text-foreground/80">
            <p>
              All advertising on Pain Clinics is clearly labeled and complies with healthcare
              advertising regulations. We reserve the right to reject any advertisement that does not
              meet our editorial standards.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
