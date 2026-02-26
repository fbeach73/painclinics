import { eq, desc, ilike, sql, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { guides } from "@/lib/schema";

type GuideStatus = "draft" | "published" | "archived";

export async function getGuidesAdmin(options: {
  page: number;
  limit: number;
  status?: string | undefined;
  search?: string | undefined;
}) {
  const { page, limit, status, search } = options;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status && status !== "all") {
    conditions.push(eq(guides.status, status as GuideStatus));
  }
  if (search) {
    conditions.push(ilike(guides.title, `%${search}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(guides)
      .where(where)
      .orderBy(desc(guides.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(guides)
      .where(where),
  ]);

  return {
    guides: rows,
    total: countResult[0]?.count ?? 0,
  };
}

export async function getGuideCountsByStatus() {
  const result = await db
    .select({
      status: guides.status,
      count: sql<number>`count(*)::int`,
    })
    .from(guides)
    .groupBy(guides.status);

  const counts = { all: 0, draft: 0, published: 0, archived: 0 };
  for (const row of result) {
    counts[row.status] = row.count;
    counts.all += row.count;
  }
  return counts;
}

export async function getGuideByIdAdmin(id: string) {
  const result = await db
    .select()
    .from(guides)
    .where(eq(guides.id, id))
    .limit(1);
  return result[0] ?? null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createGuide(data: {
  title: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  stateAbbreviation?: string;
  status?: GuideStatus;
  faqs?: Array<{ question: string; answer: string }>;
  aboutTopics?: string[];
}) {
  const slug = data.slug || slugify(data.title);
  const result = await db
    .insert(guides)
    .values({
      title: data.title,
      slug,
      content: data.content || "",
      excerpt: data.excerpt,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      featuredImageUrl: data.featuredImageUrl,
      featuredImageAlt: data.featuredImageAlt,
      stateAbbreviation: data.stateAbbreviation || null,
      status: data.status || "draft",
      faqs: data.faqs,
      aboutTopics: data.aboutTopics,
      publishedAt: data.status === "published" ? new Date() : null,
    })
    .returning({ id: guides.id });

  return result[0]!.id;
}

export async function updateGuide(
  id: string,
  data: {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    metaTitle?: string;
    metaDescription?: string;
    featuredImageUrl?: string;
    featuredImageAlt?: string;
    stateAbbreviation?: string | null;
    status?: GuideStatus;
    faqs?: Array<{ question: string; answer: string }>;
    aboutTopics?: string[];
  }
) {
  // If publishing for the first time, set publishedAt
  const existing = await getGuideByIdAdmin(id);
  const publishedAt =
    data.status === "published" && existing && !existing.publishedAt
      ? new Date()
      : undefined;

  await db
    .update(guides)
    .set({
      ...data,
      ...(publishedAt && { publishedAt }),
    })
    .where(eq(guides.id, id));
}

export async function deleteGuide(id: string) {
  await db.delete(guides).where(eq(guides.id, id));
}
