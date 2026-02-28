import { createId } from "@paralleldrive/cuid2";
import { eq, and, sql, isNull, not, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinics,
  featuredSubscriptions,
  featuredRotationLog,
  rotationConfig,
} from "@/lib/schema";

export interface RotationResult {
  batchId: string;
  unfeaturedCount: number;
  featuredCount: number;
  featuredClinics: Array<{
    id: string;
    title: string;
    city: string | null;
    stateAbbreviation: string | null;
    emails: string[] | null;
  }>;
}

/**
 * Get clinic IDs that have an active paid subscription (should never be unfeatured).
 */
async function getActiveSubscriberClinicIds(): Promise<string[]> {
  const subs = await db
    .select({ clinicId: featuredSubscriptions.clinicId })
    .from(featuredSubscriptions)
    .where(eq(featuredSubscriptions.status, "active"));
  return subs.map((s) => s.clinicId);
}

/**
 * Unfeature the current free rotation batch.
 * Only unfeatures clinics that are featured but NOT active subscribers.
 */
async function unfeatureCurrentBatch(
  subscriberClinicIds: string[]
): Promise<{ unfeaturedCount: number; unfeaturedClinicIds: string[] }> {
  // Find clinics that are currently featured but not subscribers
  const conditions = [eq(clinics.isFeatured, true)];
  if (subscriberClinicIds.length > 0) {
    conditions.push(not(inArray(clinics.id, subscriberClinicIds)));
  }

  const currentlyFeatured = await db
    .select({ id: clinics.id })
    .from(clinics)
    .where(and(...conditions));

  if (currentlyFeatured.length === 0) {
    return { unfeaturedCount: 0, unfeaturedClinicIds: [] };
  }

  const ids = currentlyFeatured.map((c) => c.id);

  // Unfeature them
  await db
    .update(clinics)
    .set({
      isFeatured: false,
      featuredTier: "none",
      featuredUntil: null,
      updatedAt: new Date(),
    })
    .where(inArray(clinics.id, ids));

  // Update rotation log — set unfeaturedAt for these clinics' active log entries
  const now = new Date();
  await db
    .update(featuredRotationLog)
    .set({ unfeaturedAt: now })
    .where(
      and(
        inArray(featuredRotationLog.clinicId, ids),
        isNull(featuredRotationLog.unfeaturedAt)
      )
    );

  return { unfeaturedCount: ids.length, unfeaturedClinicIds: ids };
}

/**
 * Pick next batch of clinics to feature.
 * Prioritizes clinics never rotated, then least recently rotated.
 * Spreads evenly across states.
 */
async function pickNextBatch(
  batchSize: number,
  subscriberClinicIds: string[]
): Promise<
  Array<{
    id: string;
    title: string;
    city: string | null;
    stateAbbreviation: string | null;
    emails: string[] | null;
  }>
> {
  // Build exclusion list: active subscribers + currently featured
  const excludeConditions = [
    eq(clinics.status, "published"),
    eq(clinics.isFeatured, false),
    sql`array_length(${clinics.emails}, 1) > 0`,
  ];
  if (subscriberClinicIds.length > 0) {
    excludeConditions.push(not(inArray(clinics.id, subscriberClinicIds)));
  }

  // Query eligible clinics with their last rotation time
  // Order by: never rotated first (NULL unfeaturedAt), then oldest unfeaturedAt
  const eligible = await db
    .select({
      id: clinics.id,
      title: clinics.title,
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
      emails: clinics.emails,
      lastUnfeatured: sql<Date | null>`(
        SELECT MAX(${featuredRotationLog.unfeaturedAt})
        FROM ${featuredRotationLog}
        WHERE ${featuredRotationLog.clinicId} = ${clinics.id}
      )`.as("last_unfeatured"),
    })
    .from(clinics)
    .where(and(...excludeConditions))
    .orderBy(
      sql`CASE WHEN (
        SELECT MAX(${featuredRotationLog.unfeaturedAt})
        FROM ${featuredRotationLog}
        WHERE ${featuredRotationLog.clinicId} = ${clinics.id}
      ) IS NULL THEN 0 ELSE 1 END`,
      sql`(
        SELECT MAX(${featuredRotationLog.unfeaturedAt})
        FROM ${featuredRotationLog}
        WHERE ${featuredRotationLog.clinicId} = ${clinics.id}
      ) ASC NULLS FIRST`
    )
    .limit(batchSize * 3); // Fetch extra for state distribution

  if (eligible.length === 0) {
    return [];
  }

  // Spread across states
  const byState = new Map<
    string,
    typeof eligible
  >();
  for (const clinic of eligible) {
    const state = clinic.stateAbbreviation ?? "unknown";
    if (!byState.has(state)) {
      byState.set(state, []);
    }
    byState.get(state)!.push(clinic);
  }

  const stateCount = byState.size;
  const perState = Math.ceil(batchSize / stateCount);
  const result: typeof eligible = [];

  // Round-robin across states
  for (const [, stateClinics] of byState) {
    const take = Math.min(perState, stateClinics.length);
    result.push(...stateClinics.slice(0, take));
    if (result.length >= batchSize) break;
  }

  // If we didn't fill the batch from round-robin, add remaining
  if (result.length < batchSize) {
    const selectedIds = new Set(result.map((c) => c.id));
    for (const clinic of eligible) {
      if (selectedIds.has(clinic.id)) continue;
      result.push(clinic);
      if (result.length >= batchSize) break;
    }
  }

  return result.slice(0, batchSize).map((c) => ({
    id: c.id,
    title: c.title,
    city: c.city,
    stateAbbreviation: c.stateAbbreviation,
    emails: c.emails,
  }));
}

/**
 * Main rotation function.
 * 1. Unfeatures current free batch
 * 2. Picks next batch
 * 3. Features them for 7 days
 * 4. Logs everything
 */
export async function rotateFeaturedClinics(
  batchSize = 150
): Promise<RotationResult> {
  const subscriberClinicIds = await getActiveSubscriberClinicIds();
  const batchId = createId();
  const now = new Date();
  const featuredUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Step 1: Unfeature current free batch
  const { unfeaturedCount } =
    await unfeatureCurrentBatch(subscriberClinicIds);

  // Step 2: Pick next batch
  const nextBatch = await pickNextBatch(batchSize, subscriberClinicIds);

  if (nextBatch.length === 0) {
    return {
      batchId,
      unfeaturedCount,
      featuredCount: 0,
      featuredClinics: [],
    };
  }

  const nextBatchIds = nextBatch.map((c) => c.id);

  // Step 3: Feature them
  await db
    .update(clinics)
    .set({
      isFeatured: true,
      featuredTier: "none",
      featuredUntil,
      updatedAt: now,
    })
    .where(inArray(clinics.id, nextBatchIds));

  // Step 4: Log rotation
  const logEntries = nextBatch.map((clinic) => ({
    id: createId(),
    clinicId: clinic.id,
    featuredAt: now,
    batchId,
    createdAt: now,
  }));

  await db.insert(featuredRotationLog).values(logEntries);

  return {
    batchId,
    unfeaturedCount,
    featuredCount: nextBatch.length,
    featuredClinics: nextBatch,
  };
}

/**
 * Get rotation history (recent batches).
 */
export async function getRotationHistory(limit = 20) {
  const batches = await db
    .select({
      batchId: featuredRotationLog.batchId,
      featuredAt: sql<Date>`MIN(${featuredRotationLog.featuredAt})`.as(
        "featured_at"
      ),
      unfeaturedAt: sql<Date | null>`MAX(${featuredRotationLog.unfeaturedAt})`.as(
        "unfeatured_at"
      ),
      clinicCount: sql<number>`COUNT(*)::int`.as("clinic_count"),
      broadcastId: sql<string | null>`MAX(${featuredRotationLog.broadcastId})`.as(
        "broadcast_id"
      ),
    })
    .from(featuredRotationLog)
    .groupBy(featuredRotationLog.batchId)
    .orderBy(sql`MIN(${featuredRotationLog.featuredAt}) DESC`)
    .limit(limit);

  return batches;
}

/**
 * Get the current active rotation batch (clinics featured by rotation that haven't been unfeatured).
 */
export async function getCurrentRotationBatch() {
  const active = await db
    .select({
      batchId: featuredRotationLog.batchId,
      clinicId: featuredRotationLog.clinicId,
      featuredAt: featuredRotationLog.featuredAt,
      clinicTitle: clinics.title,
      clinicCity: clinics.city,
      clinicState: clinics.stateAbbreviation,
    })
    .from(featuredRotationLog)
    .innerJoin(clinics, eq(featuredRotationLog.clinicId, clinics.id))
    .where(isNull(featuredRotationLog.unfeaturedAt))
    .orderBy(clinics.stateAbbreviation, clinics.title);

  return active;
}

/**
 * Link a broadcast to a rotation batch.
 */
export async function linkBroadcastToBatch(
  batchId: string,
  broadcastId: string
) {
  await db
    .update(featuredRotationLog)
    .set({ broadcastId })
    .where(eq(featuredRotationLog.batchId, batchId));
}

// ============================================
// Rotation Config (email template + settings)
// ============================================

export interface RotationConfigData {
  emailSubject: string;
  emailPreviewText: string | null;
  emailHtmlContent: string;
  batchSize: number;
}

/**
 * Get the rotation config (email template + batch size).
 * Returns null if not configured yet.
 */
export async function getRotationConfig(): Promise<RotationConfigData | null> {
  const config = await db.query.rotationConfig.findFirst();
  if (!config) return null;
  return {
    emailSubject: config.emailSubject,
    emailPreviewText: config.emailPreviewText,
    emailHtmlContent: config.emailHtmlContent,
    batchSize: config.batchSize,
  };
}

/**
 * Save rotation config (upsert — single row).
 */
export async function saveRotationConfig(data: RotationConfigData) {
  const existing = await db.query.rotationConfig.findFirst();
  if (existing) {
    await db
      .update(rotationConfig)
      .set({
        emailSubject: data.emailSubject,
        emailPreviewText: data.emailPreviewText,
        emailHtmlContent: data.emailHtmlContent,
        batchSize: data.batchSize,
        updatedAt: new Date(),
      })
      .where(eq(rotationConfig.id, existing.id));
  } else {
    await db.insert(rotationConfig).values({
      emailSubject: data.emailSubject,
      emailPreviewText: data.emailPreviewText,
      emailHtmlContent: data.emailHtmlContent,
      batchSize: data.batchSize,
    });
  }
}
