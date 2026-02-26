"use client";

import Image from "next/image";

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

interface FAQ {
  question: string;
  answer: string;
}

interface GuidePreviewProps {
  title: string;
  excerpt: string;
  content: string;
  stateAbbreviation: string;
  featuredImageUrl: string | null;
  featuredImageAlt: string;
  faqs: FAQ[];
}

export function GuidePreview({
  title,
  excerpt,
  content,
  stateAbbreviation,
  featuredImageUrl,
  featuredImageAlt,
  faqs,
}: GuidePreviewProps) {
  const stateName =
    stateAbbreviation && stateAbbreviation !== "none"
      ? STATE_NAMES[stateAbbreviation]
      : null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <ol className="flex items-center gap-1.5">
          <li>Home</li>
          <li>/</li>
          <li>Guides</li>
          <li>/</li>
          <li className="text-foreground font-medium truncate">
            {title || "Untitled Guide"}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          {title || "Untitled Guide"}
        </h1>
        {excerpt && (
          <p className="text-lg text-muted-foreground">{excerpt}</p>
        )}
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          {stateName && (
            <span className="text-primary">
              Browse {stateName} Clinics
            </span>
          )}
          <time>
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>
      </header>

      {/* Featured Image */}
      {featuredImageUrl && (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-8">
          <Image
            src={featuredImageUrl}
            alt={featuredImageAlt || title}
            fill
            className="object-cover"
            sizes="(max-width: 896px) 100vw, 896px"
          />
        </div>
      )}

      {/* Content */}
      <article
        className="prose prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-a:text-primary prose-ol:text-foreground prose-ul:text-foreground dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* State CTA */}
      {stateName && stateAbbreviation && (
        <div className="mt-12 rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Find Pain Management Clinics in {stateName}
          </h2>
          <p className="text-muted-foreground mb-4">
            Browse our directory of verified pain management specialists
            across {stateName}.
          </p>
          <span className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            View {stateName} Clinics
          </span>
        </div>
      )}

      {/* FAQ section */}
      {faqs.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
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
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
