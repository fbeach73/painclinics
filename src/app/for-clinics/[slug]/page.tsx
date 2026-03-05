import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSubNicheConfig, getAllSubNicheSlugs } from "@/data/sub-niche-configs";
import { SubNicheContent } from "./sub-niche-content";

export function generateStaticParams() {
  return getAllSubNicheSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = getSubNicheConfig(slug);
  if (!config) return {};

  return {
    title: config.metaTitle,
    description: config.metaDescription,
    openGraph: {
      title: config.metaTitle,
      description: config.metaDescription,
    },
  };
}

export default async function SubNichePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = getSubNicheConfig(slug);

  if (!config) {
    notFound();
  }

  return <SubNicheContent slug={slug} />;
}
