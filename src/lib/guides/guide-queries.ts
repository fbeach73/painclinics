import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { guides } from "@/lib/schema";

export async function getGuideBySlug(slug: string) {
  const result = await db
    .select()
    .from(guides)
    .where(eq(guides.slug, slug))
    .limit(1);

  const guide = result[0];
  if (!guide || guide.status !== "published") return null;
  return guide;
}

export async function getAllPublishedGuides() {
  return db
    .select({
      id: guides.id,
      title: guides.title,
      slug: guides.slug,
      excerpt: guides.excerpt,
      stateAbbreviation: guides.stateAbbreviation,
      featuredImageUrl: guides.featuredImageUrl,
      publishedAt: guides.publishedAt,
    })
    .from(guides)
    .where(eq(guides.status, "published"))
    .orderBy(guides.title);
}

export async function getAllPublishedGuideSlugs() {
  const result = await db
    .select({ slug: guides.slug })
    .from(guides)
    .where(eq(guides.status, "published"));
  return result.map((r) => r.slug);
}

export async function getAllGuidesForSitemap() {
  return db
    .select({
      slug: guides.slug,
      updatedAt: guides.updatedAt,
    })
    .from(guides)
    .where(eq(guides.status, "published"));
}
