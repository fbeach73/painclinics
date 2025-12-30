import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { emailBroadcasts } from "@/lib/schema";

// ============================================
// Types
// ============================================

export type TargetFilters = {
  states?: string[];
  tiers?: string[];
  excludeUnsubscribed?: boolean;
};

export type Attachment = {
  url: string;
  filename: string;
  size: number;
};

export type BroadcastStatus = "draft" | "sending" | "completed" | "failed";
export type TargetAudience = "all_with_email" | "featured_only" | "by_state" | "by_tier" | "custom";

export type Broadcast = typeof emailBroadcasts.$inferSelect;
export type NewBroadcast = typeof emailBroadcasts.$inferInsert;

export interface CreateBroadcastInput {
  name: string;
  subject: string;
  previewText?: string;
  htmlContent: string;
  targetAudience?: TargetAudience;
  targetFilters?: TargetFilters;
  attachments?: Attachment[];
  createdBy?: string;
}

export interface UpdateBroadcastInput {
  name?: string;
  subject?: string;
  previewText?: string;
  htmlContent?: string;
  targetAudience?: TargetAudience;
  targetFilters?: TargetFilters;
  attachments?: Attachment[];
  recipientCount?: number;
  sentCount?: number;
  failedCount?: number;
  openedCount?: number;
  clickedCount?: number;
  status?: BroadcastStatus;
  scheduledAt?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Create a new broadcast
 */
export async function createBroadcast(input: CreateBroadcastInput): Promise<Broadcast> {
  const result = await db
    .insert(emailBroadcasts)
    .values({
      name: input.name,
      subject: input.subject,
      previewText: input.previewText,
      htmlContent: input.htmlContent,
      targetAudience: input.targetAudience || "all_with_email",
      targetFilters: input.targetFilters,
      attachments: input.attachments,
      createdBy: input.createdBy,
    })
    .returning();

  const broadcast = result[0];
  if (!broadcast) {
    throw new Error("Failed to create broadcast");
  }
  return broadcast;
}

/**
 * Get a broadcast by ID
 */
export async function getBroadcast(id: string): Promise<Broadcast | null> {
  const result = await db.query.emailBroadcasts.findFirst({
    where: eq(emailBroadcasts.id, id),
  });
  return result ?? null;
}

/**
 * List broadcasts with pagination
 */
export async function listBroadcasts(options?: {
  status?: BroadcastStatus;
  limit?: number;
  offset?: number;
}): Promise<{ broadcasts: Broadcast[]; total: number }> {
  const { status, limit = 20, offset = 0 } = options || {};

  // Fetch paginated broadcasts
  const broadcasts = await db.query.emailBroadcasts.findMany({
    where: status ? eq(emailBroadcasts.status, status) : undefined,
    orderBy: desc(emailBroadcasts.createdAt),
    limit,
    offset,
  });

  // Get total count efficiently using SQL count
  const countResult = await db
    .select({ total: count() })
    .from(emailBroadcasts)
    .where(status ? eq(emailBroadcasts.status, status) : undefined);

  const total = countResult[0]?.total ?? 0;

  return { broadcasts, total };
}

/**
 * Update a broadcast
 */
export async function updateBroadcast(
  id: string,
  input: UpdateBroadcastInput
): Promise<Broadcast | undefined> {
  const [updated] = await db
    .update(emailBroadcasts)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(emailBroadcasts.id, id))
    .returning();

  return updated;
}

/**
 * Delete a broadcast (only drafts can be deleted)
 */
export async function deleteBroadcast(id: string): Promise<boolean> {
  const broadcast = await getBroadcast(id);
  if (!broadcast || broadcast.status !== "draft") {
    return false;
  }

  await db.delete(emailBroadcasts).where(eq(emailBroadcasts.id, id));
  // Verify deletion by checking if record still exists
  const stillExists = await getBroadcast(id);
  return stillExists === null;
}

/**
 * Duplicate a broadcast
 */
export async function duplicateBroadcast(id: string, createdBy?: string): Promise<Broadcast | null> {
  const original = await getBroadcast(id);
  if (!original) {
    return null;
  }

  const result = await db
    .insert(emailBroadcasts)
    .values({
      name: `${original.name} (Copy)`,
      subject: original.subject,
      previewText: original.previewText,
      htmlContent: original.htmlContent,
      targetAudience: original.targetAudience,
      targetFilters: original.targetFilters as TargetFilters | undefined,
      attachments: original.attachments as Attachment[] | undefined,
      status: "draft",
      createdBy: createdBy || original.createdBy,
    })
    .returning();

  return result[0] ?? null;
}

/**
 * Update broadcast status
 */
export async function updateBroadcastStatus(
  id: string,
  status: BroadcastStatus,
  additionalFields?: {
    startedAt?: Date;
    completedAt?: Date;
    recipientCount?: number;
  }
): Promise<Broadcast | undefined> {
  return updateBroadcast(id, {
    status,
    ...additionalFields,
  });
}

/**
 * Increment sent count
 */
export async function incrementSentCount(id: string): Promise<void> {
  const broadcast = await getBroadcast(id);
  if (broadcast) {
    await updateBroadcast(id, {
      sentCount: (broadcast.sentCount || 0) + 1,
    });
  }
}

/**
 * Increment failed count
 */
export async function incrementFailedCount(id: string): Promise<void> {
  const broadcast = await getBroadcast(id);
  if (broadcast) {
    await updateBroadcast(id, {
      failedCount: (broadcast.failedCount || 0) + 1,
    });
  }
}

/**
 * Get broadcast counts by status
 */
export async function getBroadcastCountsByStatus(): Promise<{
  draft: number;
  sending: number;
  completed: number;
  failed: number;
  total: number;
}> {
  // Use GROUP BY for efficient counting
  const result = await db
    .select({
      status: emailBroadcasts.status,
      count: sql<number>`count(*)::int`,
    })
    .from(emailBroadcasts)
    .groupBy(emailBroadcasts.status);

  const counts = {
    draft: 0,
    sending: 0,
    completed: 0,
    failed: 0,
    total: 0,
  };

  for (const row of result) {
    if (row.status && row.status in counts) {
      counts[row.status as keyof Omit<typeof counts, "total">] = row.count;
    }
    counts.total += row.count;
  }

  return counts;
}
