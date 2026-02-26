import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGuideByIdAdmin } from "@/lib/guides/guide-admin-queries";
import { GuideForm } from "../guide-form";

interface EditGuidePageProps {
  params: Promise<{ guideId: string }>;
}

export async function generateMetadata({
  params,
}: EditGuidePageProps): Promise<Metadata> {
  const { guideId } = await params;
  const guide = await getGuideByIdAdmin(guideId);
  return {
    title: guide ? `Edit: ${guide.title} - Admin` : "Guide Not Found - Admin",
  };
}

export default async function EditGuidePage({ params }: EditGuidePageProps) {
  const { guideId } = await params;
  const guide = await getGuideByIdAdmin(guideId);

  if (!guide) notFound();

  return (
    <GuideForm
      initialData={{
        id: guide.id,
        title: guide.title,
        slug: guide.slug,
        content: guide.content,
        excerpt: guide.excerpt || "",
        metaTitle: guide.metaTitle || "",
        metaDescription: guide.metaDescription || "",
        stateAbbreviation: guide.stateAbbreviation || "",
        status: guide.status,
        faqs: (guide.faqs as Array<{ question: string; answer: string }>) || [],
        aboutTopics: (guide.aboutTopics as string[]) || [],
      }}
    />
  );
}
