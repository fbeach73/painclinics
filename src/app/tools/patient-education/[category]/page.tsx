import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { EducationGenerator } from "@/components/tools/education-generator";
import {
  educationCategories,
  findCategoryBySlug,
} from "@/data/education-conditions";

export function generateStaticParams() {
  return educationCategories.map((cat) => ({ category: cat.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = findCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: `${category.name} Patient Education Content Generator`,
    description: `Generate free patient education content about ${category.name.toLowerCase()} for your pain management clinic. ${category.conditions.length} conditions available.`,
    openGraph: {
      title: `${category.name} Patient Education Generator | PainClinics.com`,
      description: `Generate free ${category.name.toLowerCase()} patient education content for your clinic.`,
    },
  };
}

export default async function CategoryEducationPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = findCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-muted/50 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <Link
            href="/tools/patient-education"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            All Conditions
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {category.name}{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Education Generator
            </span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {category.description}. Generate patient-ready content for{" "}
            {category.conditions.length} conditions.
          </p>
        </div>
      </section>

      {/* Generator — pre-selected to this category, condition tiles built in */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <EducationGenerator defaultCategory={category.slug} />
      </section>
    </div>
  );
}
