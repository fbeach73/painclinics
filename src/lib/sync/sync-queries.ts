/**
 * Database queries for sync-related tables
 */

import { db } from "@/lib/db";
import {
  syncSchedules,
  syncLogs,
  clinicSyncStatus,
  clinics,
} from "@/lib/schema";
import { eq, and, lte, isNull, or, desc, inArray } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

// ============================================
// Type Definitions
// ============================================

export type SyncSchedule = InferSelectModel<typeof syncSchedules>;
export type NewSyncSchedule = InferInsertModel<typeof syncSchedules>;

export type SyncLog = InferSelectModel<typeof syncLogs>;
export type NewSyncLog = InferInsertModel<typeof syncLogs>;

export type ClinicSyncStatusRecord = InferSelectModel<typeof clinicSyncStatus>;
export type NewClinicSyncStatus = InferInsertModel<typeof clinicSyncStatus>;

// ============================================
// Clinic Sync Status Queries
// ============================================

/**
 * Get the sync status for a clinic
 */
export async function getSyncStatus(
  clinicId: string
): Promise<ClinicSyncStatusRecord | null> {
  const [result] = await db
    .select()
    .from(clinicSyncStatus)
    .where(eq(clinicSyncStatus.clinicId, clinicId))
    .limit(1);

  return result ?? null;
}

/**
 * Upsert (create or update) sync status for a clinic
 */
export async function upsertSyncStatus(
  clinicId: string,
  updates: Partial<Omit<NewClinicSyncStatus, "id" | "clinicId">>
): Promise<ClinicSyncStatusRecord> {
  const existing = await getSyncStatus(clinicId);

  if (existing) {
    const [updated] = await db
      .update(clinicSyncStatus)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(clinicSyncStatus.clinicId, clinicId))
      .returning();

    return updated;
  } else {
    const [created] = await db
      .insert(clinicSyncStatus)
      .values({
        clinicId,
        ...updates,
      })
      .returning();

    return created;
  }
}

/**
 * Reset error count for a clinic
 */
export async function resetClinicSyncErrors(
  clinicId: string
): Promise<ClinicSyncStatusRecord> {
  return upsertSyncStatus(clinicId, {
    consecutiveErrors: 0,
    lastSyncError: null,
  });
}

/**
 * Increment error count for a clinic
 */
export async function incrementClinicSyncErrors(
  clinicId: string,
  errorMessage: string
): Promise<ClinicSyncStatusRecord> {
  const existing = await getSyncStatus(clinicId);
  const currentErrors = existing?.consecutiveErrors ?? 0;

  return upsertSyncStatus(clinicId, {
    consecutiveErrors: currentErrors + 1,
    lastSyncError: errorMessage,
  });
}

/**
 * Get clinics that have exceeded the error threshold
 */
export async function getClinicsWithExcessiveErrors(
  threshold: number = 3
): Promise<ClinicSyncStatusRecord[]> {
  const results = await db
    .select()
    .from(clinicSyncStatus)
    .where(
      and(
        clinicSyncStatus.consecutiveErrors
          ? lte(clinicSyncStatus.consecutiveErrors, threshold) === false
          : undefined
      )
    );

  // Filter manually since we need >= comparison
  return results.filter(
    (r) => r.consecutiveErrors !== null && r.consecutiveErrors >= threshold
  );
}

// ============================================
// Sync Schedule Queries
// ============================================

/**
 * Get all sync schedules
 */
export async function getSchedules(
  filters: { isActive?: boolean } = {}
): Promise<SyncSchedule[]> {
  const conditions = [];

  if (filters.isActive !== undefined) {
    conditions.push(eq(syncSchedules.isActive, filters.isActive));
  }

  const query =
    conditions.length > 0
      ? db
          .select()
          .from(syncSchedules)
          .where(and(...conditions))
      : db.select().from(syncSchedules);

  return query.orderBy(desc(syncSchedules.createdAt));
}

/**
 * Get a schedule by ID
 */
export async function getScheduleById(
  id: string
): Promise<SyncSchedule | null> {
  const [result] = await db
    .select()
    .from(syncSchedules)
    .where(eq(syncSchedules.id, id))
    .limit(1);

  return result ?? null;
}

/**
 * Create a new sync schedule
 */
export async function createSchedule(
  data: Omit<NewSyncSchedule, "id">
): Promise<SyncSchedule> {
  const [created] = await db.insert(syncSchedules).values(data).returning();

  return created;
}

/**
 * Update a sync schedule
 */
export async function updateSchedule(
  id: string,
  data: Partial<Omit<NewSyncSchedule, "id">>
): Promise<SyncSchedule | null> {
  const [updated] = await db
    .update(syncSchedules)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(syncSchedules.id, id))
    .returning();

  return updated ?? null;
}

/**
 * Delete a sync schedule
 */
export async function deleteSchedule(id: string): Promise<boolean> {
  const result = await db
    .delete(syncSchedules)
    .where(eq(syncSchedules.id, id))
    .returning({ id: syncSchedules.id });

  return result.length > 0;
}

/**
 * Get schedules that are due to run
 * (active schedules with nextRunAt <= now)
 */
export async function getDueSchedules(): Promise<SyncSchedule[]> {
  const now = new Date();

  return db
    .select()
    .from(syncSchedules)
    .where(
      and(
        eq(syncSchedules.isActive, true),
        or(
          lte(syncSchedules.nextRunAt, now),
          isNull(syncSchedules.nextRunAt)
        )
      )
    )
    .orderBy(syncSchedules.nextRunAt);
}

/**
 * Update schedule after execution
 */
export async function markScheduleExecuted(
  id: string,
  status: "completed" | "failed",
  nextRunAt?: Date | null
): Promise<SyncSchedule | null> {
  return updateSchedule(id, {
    lastRunAt: new Date(),
    lastRunStatus: status,
    nextRunAt: nextRunAt ?? null,
  });
}

// ============================================
// Sync Log Queries
// ============================================

/**
 * Create a new sync log entry
 */
export async function createSyncLog(
  data: Omit<NewSyncLog, "id">
): Promise<SyncLog> {
  const [created] = await db
    .insert(syncLogs)
    .values({
      ...data,
      startedAt: data.startedAt ?? new Date(),
    })
    .returning();

  return created;
}

/**
 * Update a sync log
 */
export async function updateSyncLog(
  id: string,
  data: Partial<Omit<NewSyncLog, "id">>
): Promise<SyncLog | null> {
  const [updated] = await db
    .update(syncLogs)
    .set(data)
    .where(eq(syncLogs.id, id))
    .returning();

  return updated ?? null;
}

/**
 * Get sync logs with optional filters
 */
export async function getSyncLogs(
  filters: {
    scheduleId?: string;
    status?: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
    limit?: number;
    offset?: number;
  } = {}
): Promise<SyncLog[]> {
  const { scheduleId, status, limit = 50, offset = 0 } = filters;
  const conditions = [];

  if (scheduleId) {
    conditions.push(eq(syncLogs.scheduleId, scheduleId));
  }

  if (status) {
    conditions.push(eq(syncLogs.status, status));
  }

  const query =
    conditions.length > 0
      ? db
          .select()
          .from(syncLogs)
          .where(and(...conditions))
      : db.select().from(syncLogs);

  return query
    .orderBy(desc(syncLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Get a sync log by ID
 */
export async function getSyncLogById(id: string): Promise<SyncLog | null> {
  const [result] = await db
    .select()
    .from(syncLogs)
    .where(eq(syncLogs.id, id))
    .limit(1);

  return result ?? null;
}

/**
 * Get recent sync logs for statistics
 */
export async function getRecentSyncStats(
  hours: number = 24
): Promise<{
  totalRuns: number;
  successCount: number;
  errorCount: number;
  totalClinicsProcessed: number;
}> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const logs = await db
    .select()
    .from(syncLogs)
    .where(
      and(
        syncLogs.createdAt
          ? lte(since, syncLogs.createdAt) === false
          : undefined,
        eq(syncLogs.status, "completed")
      )
    );

  // Filter by createdAt manually
  const recentLogs = logs.filter(
    (log) => log.createdAt && log.createdAt >= since
  );

  return {
    totalRuns: recentLogs.length,
    successCount: recentLogs.filter((l) => l.status === "completed").length,
    errorCount: recentLogs.filter((l) => l.status === "failed").length,
    totalClinicsProcessed: recentLogs.reduce(
      (sum, l) => sum + (l.totalClinics ?? 0),
      0
    ),
  };
}

// ============================================
// Clinic Queries for Sync
// ============================================

/**
 * Get clinics by IDs with their place IDs
 */
export async function getClinicsByIds(
  clinicIds: string[]
): Promise<
  Array<{
    id: string;
    title: string;
    placeId: string | null;
    rating: number | null;
    reviewCount: number | null;
    phone: string | null;
    website: string | null;
  }>
> {
  if (clinicIds.length === 0) return [];

  return db
    .select({
      id: clinics.id,
      title: clinics.title,
      placeId: clinics.placeId,
      rating: clinics.rating,
      reviewCount: clinics.reviewCount,
      phone: clinics.phone,
      website: clinics.website,
    })
    .from(clinics)
    .where(inArray(clinics.id, clinicIds));
}

/**
 * Get clinics that have a Place ID (can be synced)
 */
export async function getClinicIdsWithPlaceId(
  filters: {
    stateFilter?: string;
    limit?: number;
  } = {}
): Promise<string[]> {
  const conditions = [clinics.placeId ? true : false];

  if (filters.stateFilter) {
    conditions.push(
      or(
        eq(clinics.state, filters.stateFilter),
        eq(clinics.stateAbbreviation, filters.stateFilter)
      ) as ReturnType<typeof eq>
    );
  }

  let query = db
    .select({ id: clinics.id })
    .from(clinics)
    .where(
      and(
        clinics.placeId ? undefined : undefined, // placeholder for proper filter
        filters.stateFilter
          ? or(
              eq(clinics.state, filters.stateFilter),
              eq(clinics.stateAbbreviation, filters.stateFilter)
            )
          : undefined
      )
    );

  // Need to filter for non-null placeId after the fact since the SQL check is complex
  const results = await query.limit(filters.limit ?? 10000);

  // Post-filter to only include clinics with placeId
  const filtered = await db
    .select({ id: clinics.id, placeId: clinics.placeId })
    .from(clinics);

  return filtered
    .filter((c) => c.placeId !== null)
    .filter((c) =>
      filters.stateFilter
        ? results.some((r) => r.id === c.id)
        : true
    )
    .slice(0, filters.limit ?? 10000)
    .map((c) => c.id);
}

/**
 * Get clinics with missing data (for "missing_data" scope)
 */
export async function getClinicIdsWithMissingData(): Promise<string[]> {
  // Get clinics that have a Place ID but are missing rating, reviewCount, or hours
  const results = await db
    .select({
      id: clinics.id,
      placeId: clinics.placeId,
      rating: clinics.rating,
      reviewCount: clinics.reviewCount,
      clinicHours: clinics.clinicHours,
      phone: clinics.phone,
    })
    .from(clinics);

  return results
    .filter(
      (c) =>
        c.placeId !== null &&
        (c.rating === null ||
          c.reviewCount === null ||
          c.clinicHours === null ||
          c.phone === null)
    )
    .map((c) => c.id);
}

/**
 * Update clinic with synced data
 */
export async function updateClinicFromSync(
  clinicId: string,
  data: {
    rating?: number;
    reviewCount?: number;
    featuredReviews?: unknown;
    phone?: string;
    website?: string;
    clinicHours?: unknown;
    mapLatitude?: number;
    mapLongitude?: number;
    detailedAddress?: string;
    googleListingLink?: string;
  }
): Promise<void> {
  await db.update(clinics).set(data).where(eq(clinics.id, clinicId));
}

/**
 * Get a single clinic by ID with data needed for sync
 */
export async function getClinicForSync(
  clinicId: string
): Promise<{
  id: string;
  title: string;
  placeId: string | null;
  rating: number | null;
  reviewCount: number | null;
  featuredReviews: unknown;
  phone: string | null;
  website: string | null;
  clinicHours: unknown;
  mapLatitude: number;
  mapLongitude: number;
  detailedAddress: string | null;
  googleListingLink: string | null;
} | null> {
  const [result] = await db
    .select({
      id: clinics.id,
      title: clinics.title,
      placeId: clinics.placeId,
      rating: clinics.rating,
      reviewCount: clinics.reviewCount,
      featuredReviews: clinics.featuredReviews,
      phone: clinics.phone,
      website: clinics.website,
      clinicHours: clinics.clinicHours,
      mapLatitude: clinics.mapLatitude,
      mapLongitude: clinics.mapLongitude,
      detailedAddress: clinics.detailedAddress,
      googleListingLink: clinics.googleListingLink,
    })
    .from(clinics)
    .where(eq(clinics.id, clinicId))
    .limit(1);

  return result ?? null;
}
