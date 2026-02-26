import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getGuideBySlug,
  getAllPublishedGuideSlugs,
} from "@/lib/guides/guide-queries";
import {
  generateMedicalWebPageSchema,
  generateFAQStructuredData,
  generateResourceBreadcrumbSchema,
} from "@/lib/structured-data";

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

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllPublishedGuideSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);

  if (!guide) {
    return { title: "Guide Not Found | PainClinics.com" };
  }

  const title =
    guide.metaTitle || `${guide.title} | PainClinics.com`;
  const description =
    guide.metaDescription || guide.excerpt || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `/guides/${slug}`,
    },
    openGraph: {
      title: guide.metaTitle || guide.title,
      description: guide.metaDescription || guide.excerpt || "",
      images: guide.featuredImageUrl ? [guide.featuredImageUrl] : [],
      type: "article",
      publishedTime: guide.publishedAt?.toISOString(),
      modifiedTime: guide.updatedAt?.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title: guide.metaTitle || guide.title,
      description: guide.metaDescription || guide.excerpt || "",
      images: guide.featuredImageUrl ? [guide.featuredImageUrl] : [],
    },
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = await getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com";
  const stateName = guide.stateAbbreviation
    ? STATE_NAMES[guide.stateAbbreviation]
    : null;

  // Structured data
  const aboutTopics = guide.aboutTopics as string[] | null;
  const medicalPageJsonLd = generateMedicalWebPageSchema({
    name: guide.title,
    description: guide.metaDescription || guide.excerpt || guide.title,
    url: `${baseUrl}/guides/${slug}`,
    ...(guide.publishedAt && { datePublished: guide.publishedAt.toISOString() }),
    ...(guide.updatedAt && { dateModified: guide.updatedAt.toISOString() }),
    ...(aboutTopics && { about: aboutTopics }),
  });

  const breadcrumbJsonLd = generateResourceBreadcrumbSchema({
    pageName: guide.title,
    pageUrl: `${baseUrl}/guides/${slug}`,
  });

  const faqJsonLd = guide.faqs
    ? generateFAQStructuredData(
        guide.faqs as Array<{ question: string; answer: string }>
      )
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(medicalPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <main id="main-content" className="container mx-auto py-8 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-primary">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/guides" className="hover:text-primary">
                  Guides
                </Link>
              </li>
              <li>/</li>
              <li className="text-foreground font-medium truncate">
                {guide.title}
              </li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              {guide.title}
            </h1>
            {guide.excerpt && (
              <p className="text-lg text-muted-foreground">{guide.excerpt}</p>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              {stateName && (
                <Link
                  href={`/pain-management/${guide.stateAbbreviation!.toLowerCase()}`}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Browse {stateName} Clinics
                </Link>
              )}
              {guide.publishedAt && (
                <time dateTime={guide.publishedAt.toISOString()}>
                  {guide.publishedAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              )}
            </div>
          </header>

          {/* Content */}
          <article
            className="prose prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary prose-ol:text-foreground prose-ul:text-foreground dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: guide.content }}
          />

          {/* State CTA */}
          {stateName && guide.stateAbbreviation && (
            <div className="mt-12 rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Find Pain Management Clinics in {stateName}
              </h2>
              <p className="text-muted-foreground mb-4">
                Browse our directory of verified pain management specialists
                across {stateName}.
              </p>
              <Link
                href={`/pain-management/${guide.stateAbbreviation.toLowerCase()}`}
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                View {stateName} Clinics
              </Link>
            </div>
          )}

          {/* FAQ section */}
          {guide.faqs &&
            Array.isArray(guide.faqs) &&
            (guide.faqs as Array<{ question: string; answer: string }>).length > 0 && (
              <section className="mt-12">
                <h2 className="text-2xl font-semibold text-foreground mb-6">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  {(guide.faqs as Array<{ question: string; answer: string }>).map(
                    (faq, i) => (
                      <details
                        key={i}
                        className="group rounded-lg border border-border bg-card"
                      >
                        <summary className="cursor-pointer p-4 font-medium text-foreground hover:bg-accent/50 rounded-lg">
                          {faq.question}
                        </summary>
                        <div className="px-4 pb-4 text-muted-foreground">
                          {faq.answer}
                        </div>
                      </details>
                    )
                  )}
                </div>
              </section>
            )}
        </div>
      </main>
    </>
  );
}
