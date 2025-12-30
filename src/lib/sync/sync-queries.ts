/**
 * Database queries for sync-related tables
 */

import { eq, and, lte, isNull, isNotNull, or, desc, inArray, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  syncSchedules,
  syncLogs,
  clinicSyncStatus,
  clinics,
} from "@/lib/schema";
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

    if (!updated) {
      throw new Error(`Failed to update sync status for clinic ${clinicId}`);
    }
    return updated;
  } else {
    const [created] = await db
      .insert(clinicSyncStatus)
      .values({
        clinicId,
        ...updates,
      })
      .returning();

    if (!created) {
      throw new Error(`Failed to create sync status for clinic ${clinicId}`);
    }
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
    .where(gte(clinicSyncStatus.consecutiveErrors, threshold));

  return results;
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
  if (filters.isActive !== undefined) {
    return db
      .select()
      .from(syncSchedules)
      .where(eq(syncSchedules.isActive, filters.isActive))
      .orderBy(desc(syncSchedules.createdAt));
  }

  return db
    .select()
    .from(syncSchedules)
    .orderBy(desc(syncSchedules.createdAt));
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

  if (!created) {
    throw new Error("Failed to create sync schedule");
  }
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

  if (!created) {
    throw new Error("Failed to create sync log");
  }
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

  if (scheduleId && status) {
    return db
      .select()
      .from(syncLogs)
      .where(and(eq(syncLogs.scheduleId, scheduleId), eq(syncLogs.status, status)))
      .orderBy(desc(syncLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  if (scheduleId) {
    return db
      .select()
      .from(syncLogs)
      .where(eq(syncLogs.scheduleId, scheduleId))
      .orderBy(desc(syncLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  if (status) {
    return db
      .select()
      .from(syncLogs)
      .where(eq(syncLogs.status, status))
      .orderBy(desc(syncLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  return db
    .select()
    .from(syncLogs)
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
    .where(gte(syncLogs.createdAt, since));

  return {
    totalRuns: logs.length,
    successCount: logs.filter((l) => l.status === "completed").length,
    errorCount: logs.filter((l) => l.status === "failed").length,
    totalClinicsProcessed: logs.reduce(
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
  const { stateFilter, limit = 10000 } = filters;

  let results;

  if (stateFilter) {
    results = await db
      .select({ id: clinics.id })
      .from(clinics)
      .where(
        and(
          isNotNull(clinics.placeId),
          or(
            eq(clinics.state, stateFilter),
            eq(clinics.stateAbbreviation, stateFilter)
          )
        )
      )
      .limit(limit);
  } else {
    results = await db
      .select({ id: clinics.id })
      .from(clinics)
      .where(isNotNull(clinics.placeId))
      .limit(limit);
  }

  return results.map((c) => c.id);
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
    .from(clinics)
    .where(isNotNull(clinics.placeId));

  return results
    .filter(
      (c) =>
        c.rating === null ||
        c.reviewCount === null ||
        c.clinicHours === null ||
        c.phone === null
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
