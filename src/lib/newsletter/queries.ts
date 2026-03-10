import { createId } from "@paralleldrive/cuid2";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { newsletterBroadcasts } from "@/lib/schema";

// ============================================
// Types
// ============================================

export type NewsletterBroadcast = typeof newsletterBroadcasts.$inferSelect;

export type NewsletterBroadcastStatus =
  | "queued"
  | "sending"
  | "delivered"
  | "cancelled"
  | "failed";

// ============================================
// ID Generation
// ============================================

export function generateBroadcastId(): string {
  return `bc_${createId()}`;
}

// ============================================
// CRUD
// ============================================

export async function createNewsletterBroadcast(input: {
  subject: string;
  htmlContent: string;
  plainText: string;
  previewText?: string | undefined;
  listId?: string | undefined;
  tags?: string[] | undefined;
  scheduledAt?: Date | null | undefined;
  recipientCount?: number | undefined;
  status?: NewsletterBroadcastStatus | undefined;
}): Promise<NewsletterBroadcast> {
  const broadcastId = generateBroadcastId();

  const [result] = await db
    .insert(newsletterBroadcasts)
    .values({
      broadcastId,
      subject: input.subject,
      htmlContent: input.htmlContent,
      plainText: input.plainText,
      previewText: input.previewText || "",
      listId: input.listId || "newsletter",
      tags: input.tags || [],
      status: input.status || (input.scheduledAt ? "queued" : "sending"),
      scheduledAt: input.scheduledAt || null,
      recipientCount: input.recipientCount || 0,
    })
    .returning();

  if (!result) throw new Error("Failed to create newsletter broadcast");
  return result;
}

export async function getNewsletterBroadcast(
  broadcastId: string
): Promise<NewsletterBroadcast | null> {
  const result = await db.query.newsletterBroadcasts.findFirst({
    where: eq(newsletterBroadcasts.broadcastId, broadcastId),
  });
  return result ?? null;
}

export async function listNewsletterBroadcasts(options?: {
  limit?: number;
  offset?: number;
}): Promise<{ broadcasts: NewsletterBroadcast[]; total: number }> {
  const { limit = 20, offset = 0 } = options || {};

  const broadcasts = await db.query.newsletterBroadcasts.findMany({
    orderBy: desc(newsletterBroadcasts.createdAt),
    limit,
    offset,
  });

  const [countResult] = await db
    .select({ total: count() })
    .from(newsletterBroadcasts);

  return { broadcasts, total: countResult?.total ?? 0 };
}

export async function updateNewsletterBroadcastStatus(
  broadcastId: string,
  status: NewsletterBroadcastStatus,
  extra?: {
    sentAt?: Date;
    recipientCount?: number;
    deliveredCount?: number;
  }
): Promise<NewsletterBroadcast | null> {
  const [updated] = await db
    .update(newsletterBroadcasts)
    .set({
      status,
      ...extra,
      updatedAt: new Date(),
    })
    .where(eq(newsletterBroadcasts.broadcastId, broadcastId))
    .returning();

  return updated ?? null;
}

export async function incrementNewsletterBroadcastCount(
  broadcastId: string,
  field: "deliveredCount" | "openedCount" | "clickedCount" | "bouncedCount" | "unsubscribedCount"
): Promise<void> {
  await db
    .update(newsletterBroadcasts)
    .set({
      [field]: sql`COALESCE(${newsletterBroadcasts[field]}, 0) + 1`,
      updatedAt: new Date(),
    })
    .where(eq(newsletterBroadcasts.broadcastId, broadcastId));
}
