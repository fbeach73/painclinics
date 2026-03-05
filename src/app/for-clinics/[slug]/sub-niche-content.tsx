"use client";

import { FinalCTA } from "@/components/for-clinics/final-cta";
import { HowItWorks } from "@/components/for-clinics/how-it-works";
import { OwnerFAQ } from "@/components/for-clinics/owner-faq";
import { OwnerHero } from "@/components/for-clinics/owner-hero";
import { OwnerTestimonials } from "@/components/for-clinics/owner-testimonials";
import { PricingComparison } from "@/components/for-clinics/pricing-comparison";
import { ProblemSection } from "@/components/for-clinics/problem-section";
import { SolutionGrid } from "@/components/for-clinics/solution-grid";
import { ToolCtaSection } from "@/components/for-clinics/tool-cta-section";
import { getSubNicheConfig } from "@/data/sub-niche-configs";

export function SubNicheContent({ slug }: { slug: string }) {
  const config = getSubNicheConfig(slug);

  if (!config) return null;

  return (
    <div className="relative w-full overflow-x-hidden">
      <OwnerHero
        badge={config.heroBadge}
        title={config.heroTitle}
        titleGradient={config.heroTitleGradient}
        subtitle={config.heroSubtitle}
      />
      <ProblemSection
        heading={config.problemHeading}
        subheading={config.problemSubheading}
        problems={config.problems}
      />
      <SolutionGrid />
      <ToolCtaSection
        text={config.toolCta.text}
        href={config.toolCta.href}
        description={config.toolCta.description}
      />
      <OwnerTestimonials />
      <PricingComparison />
      <HowItWorks />
      <OwnerFAQ additionalFaqs={config.additionalFaqs} />
      <FinalCTA
        heading={config.finalCtaHeading}
        subtext={config.finalCtaSubtext}
      />
    </div>
  );
}
