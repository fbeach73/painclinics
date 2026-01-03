"use client";

import { FinalCTA } from "@/components/for-clinics/final-cta";
import { HowItWorks } from "@/components/for-clinics/how-it-works";
import { OwnerFAQ } from "@/components/for-clinics/owner-faq";
import { OwnerHero } from "@/components/for-clinics/owner-hero";
import { OwnerTestimonials } from "@/components/for-clinics/owner-testimonials";
import { PricingComparison } from "@/components/for-clinics/pricing-comparison";
import { ProblemSection } from "@/components/for-clinics/problem-section";
import { SolutionGrid } from "@/components/for-clinics/solution-grid";

export default function ForClinicsPage() {
  return (
    <div className="relative w-full overflow-x-hidden">
      <OwnerHero />
      <ProblemSection />
      <SolutionGrid />
      <OwnerTestimonials />
      <PricingComparison />
      <HowItWorks />
      <OwnerFAQ />
      <FinalCTA />
    </div>
  );
}
