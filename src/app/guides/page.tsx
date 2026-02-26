import Link from "next/link";
import type { Metadata } from "next";
import { getAllPublishedGuides } from "@/lib/guides/guide-queries";
import { generateResourceBreadcrumbSchema } from "@/lib/structured-data";

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

export const metadata: Metadata = {
  title: "Pain Management Guides by State | PainClinics.com",
  description:
    "State-by-state guides to pain management — regulations, insurance coverage, treatment options, and how to find the right specialist near you.",
  alternates: {
    canonical: "/guides",
  },
  openGraph: {
    title: "Pain Management Guides by State",
    description:
      "State-by-state guides to pain management — regulations, insurance coverage, treatment options, and how to find the right specialist near you.",
    type: "website",
  },
};

export default async function GuidesIndexPage() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com";

  const allGuides = await getAllPublishedGuides();

  const stateGuides = allGuides.filter((g) => g.stateAbbreviation);
  const generalGuides = allGuides.filter((g) => !g.stateAbbreviation);

  const breadcrumbJsonLd = generateResourceBreadcrumbSchema({
    pageName: "Guides",
    pageUrl: `${baseUrl}/guides`,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pain Management Guides
          </h1>
          <p className="text-lg text-muted-foreground mb-10">
            State-by-state guides covering regulations, insurance coverage,
            treatment options, and how to find the right pain management
            specialist.
          </p>

          {generalGuides.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                General Guides
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {generalGuides.map((guide) => (
                  <GuideCard key={guide.id} guide={guide} />
                ))}
              </div>
            </section>
          )}

          {stateGuides.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-6">
                State Guides
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {stateGuides.map((guide) => (
                  <GuideCard key={guide.id} guide={guide} />
                ))}
              </div>
            </section>
          )}

          {allGuides.length === 0 && (
            <p className="text-muted-foreground">
              Guides are coming soon. Check back shortly.
            </p>
          )}
        </div>
      </main>
    </>
  );
}

function GuideCard({
  guide,
}: {
  guide: {
    slug: string;
    title: string;
    excerpt: string | null;
    stateAbbreviation: string | null;
  };
}) {
  const stateName = guide.stateAbbreviation
    ? STATE_NAMES[guide.stateAbbreviation]
    : null;

  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="block rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-accent/50"
    >
      <h3 className="font-semibold text-foreground mb-1">
        {guide.title}
      </h3>
      {stateName && (
        <span className="inline-block text-xs font-medium text-primary mb-2">
          {stateName}
        </span>
      )}
      {guide.excerpt && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {guide.excerpt}
        </p>
      )}
    </Link>
  );
}
