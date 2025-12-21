/**
 * Sync module for Google Places synchronization
 *
 * This module provides:
 * - Database queries for sync schedules, logs, and clinic sync status
 * - Sync service for orchestrating single and bulk sync operations
 * - Scheduling utilities for calculating next run times
 */

// ============================================
// Query Exports
// ============================================

export {
  // Sync Status
  getSyncStatus,
  upsertSyncStatus,
  resetClinicSyncErrors,
  incrementClinicSyncErrors,
  getClinicsWithExcessiveErrors,
  // Schedules
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getDueSchedules,
  markScheduleExecuted,
  // Logs
  createSyncLog,
  updateSyncLog,
  getSyncLogs,
  getSyncLogById,
  getRecentSyncStats,
  // Clinic queries
  getClinicsByIds,
  getClinicIdsWithPlaceId,
  getClinicIdsWithMissingData,
  updateClinicFromSync,
  getClinicForSync,
} from "./sync-queries";

export type {
  SyncSchedule,
  NewSyncSchedule,
  SyncLog,
  NewSyncLog,
  ClinicSyncStatusRecord,
  NewClinicSyncStatus,
} from "./sync-queries";

// ============================================
// Service Exports
// ============================================

export {
  // Single clinic sync
  syncClinic,
  syncClinicReviews,
  syncClinicHours,
  syncClinicContact,
  syncClinicLocation,
  // Bulk sync
  syncBulk,
  getClinicIdsForScope,
  // Preview
  previewClinicSync,
  previewPlaceData,
  // Utilities
  isPlacesApiConfigured,
  getRateLimiterStats,
} from "./sync-service";

export type {
  SyncClinicOptions,
  BulkSyncOptions,
  ScheduleScopeOptions,
} from "./sync-service";

// ============================================
// Scheduler Exports
// ============================================

export {
  // Next run calculation
  calculateNextRun,
  calculateNextRunForSchedule,
  // Schedule validation
  isScheduleDue,
  canExecuteSchedule,
  // Description helpers
  getFrequencyDescription,
  getNextRunDescription,
  getLastRunDescription,
  // Cron helpers
  getCronExpression,
  describeCronSchedule,
  // Execution helpers
  getScheduleSyncFields,
  estimateSyncDuration,
} from "./scheduler";

export type { SyncFrequency } from "./scheduler";
