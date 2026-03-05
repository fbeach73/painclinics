import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Stethoscope } from "lucide-react";

import { EducationGenerator } from "@/components/tools/education-generator";
import { educationCategories } from "@/data/education-conditions";

export const metadata: Metadata = {
  title: "AI Patient Education Content Generator",
  description:
    "Generate free patient education content for your pain management clinic. Choose from back pain, neuropathy, and more conditions. Website pages, handouts, and social media posts.",
  openGraph: {
    title: "AI Patient Education Content Generator | PainClinics.com",
    description:
      "Generate free patient education content for your pain management clinic in seconds.",
  },
};

export default function PatientEducationPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-muted/50 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-2 mb-6">
            <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm text-emerald-700 dark:text-emerald-300">
              Free AI Tool for Pain Clinics
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Patient Education{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Content Generator
            </span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate professional, medically-accurate patient education content
            for your clinic website, handouts, or social media — in seconds.
          </p>
        </div>
      </section>

      {/* Generator */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <EducationGenerator />
      </section>

      {/* Category Browse */}
      <section className="bg-muted/50 border-t border-border py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            Browse by Condition Category
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {educationCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/tools/patient-education/${category.slug}`}
                className="group rounded-xl border border-border p-6 bg-card hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {category.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {category.conditions.length} conditions
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA to claim listing */}
      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Want more tools for your clinic?
        </h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Claim your free listing on PainClinics.com and get access to
          additional marketing tools designed for pain management practices.
        </p>
        <Link
          href="/for-clinics"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 font-semibold transition-colors"
        >
          Learn More
        </Link>
      </section>
    </div>
  );
}
