import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sendBroadcastEmail, generateUnsubscribeToken, getUnsubscribeUrl } from "@/lib/email";
import { user } from "@/lib/schema";
import {
  getBroadcast,
  updateBroadcastStatus,
  incrementSentCount,
  incrementFailedCount,
  type Broadcast,
  type TargetFilters,
  type TargetAudience,
} from "./broadcast-queries";
import { getTargetClinics, type ClinicEmail } from "./clinic-targeting";

// ============================================
// Constants
// ============================================

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 200; // ~250 emails/min, under 300/min limit

// ============================================
// Types
// ============================================

export interface SendBroadcastResult {
  success: boolean;
  broadcastId: string;
  sentCount: number;
  failedCount: number;
  error?: string;
}

export interface SendTestEmailResult {
  success: boolean;
  error?: string | undefined;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Delay execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get or create unsubscribe token for a user
 */
async function getOrCreateUnsubscribeToken(userId: string | null): Promise<string> {
  if (!userId) {
    // For clinics without an owner, generate a one-time token
    return generateUnsubscribeToken();
  }

  // Check if user already has a token
  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (existingUser?.unsubscribeToken) {
    return existingUser.unsubscribeToken;
  }

  // Generate and save new token
  const token = generateUnsubscribeToken();
  await db.update(user).set({ unsubscribeToken: token }).where(eq(user.id, userId));

  return token;
}

// ============================================
// Main Service Functions
// ============================================

/**
 * Send a test email for a broadcast
 */
export async function sendTestEmail(
  broadcastId: string,
  testEmail: string
): Promise<SendTestEmailResult> {
  const broadcast = await getBroadcast(broadcastId);
  if (!broadcast) {
    return { success: false, error: "Broadcast not found" };
  }

  // Generate a test unsubscribe URL (won't actually work for unsubscribing)
  const unsubscribeUrl = getUnsubscribeUrl("test-token");

  const result = await sendBroadcastEmail({
    to: testEmail,
    subject: broadcast.subject,
    htmlContent: broadcast.htmlContent,
    previewText: broadcast.previewText ?? undefined,
    broadcastId: broadcast.id,
    unsubscribeUrl,
    isTest: true,
  });

  return {
    success: result.success,
    error: result.error instanceof Error ? result.error.message : result.error ? String(result.error) : undefined,
  };
}

/**
 * Send a broadcast to all target recipients
 */
export async function sendBroadcast(broadcastId: string): Promise<SendBroadcastResult> {
  // 1. Get broadcast and validate status
  const broadcast = await getBroadcast(broadcastId);
  if (!broadcast) {
    return {
      success: false,
      broadcastId,
      sentCount: 0,
      failedCount: 0,
      error: "Broadcast not found",
    };
  }

  if (broadcast.status !== "draft") {
    return {
      success: false,
      broadcastId,
      sentCount: 0,
      failedCount: 0,
      error: `Broadcast status is ${broadcast.status}, must be draft to send`,
    };
  }

  // 2. Get target clinics
  const targetFilters = broadcast.targetFilters as TargetFilters | null;
  const targetClinics = await getTargetClinics({
    audience: (broadcast.targetAudience || "all_with_email") as TargetAudience,
    filters: targetFilters || undefined,
  });

  if (targetClinics.length === 0) {
    return {
      success: false,
      broadcastId,
      sentCount: 0,
      failedCount: 0,
      error: "No target clinics found with the specified filters",
    };
  }

  // 3. Update status to sending
  await updateBroadcastStatus(broadcastId, "sending", {
    startedAt: new Date(),
    recipientCount: targetClinics.length,
  });

  // 4. Send emails in batches
  let sentCount = 0;
  let failedCount = 0;

  for (let i = 0; i < targetClinics.length; i += BATCH_SIZE) {
    const batch = targetClinics.slice(i, i + BATCH_SIZE);

    // Process batch
    await Promise.all(
      batch.map(async (clinic) => {
        try {
          const success = await sendBroadcastToClinic(broadcast, clinic);
          if (success) {
            sentCount++;
            await incrementSentCount(broadcastId);
          } else {
            failedCount++;
            await incrementFailedCount(broadcastId);
          }
        } catch (error) {
          console.error(`Failed to send to ${clinic.email}:`, error);
          failedCount++;
          await incrementFailedCount(broadcastId);
        }
      })
    );

    // Delay between batches (except after last batch)
    if (i + BATCH_SIZE < targetClinics.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  // 5. Update final status
  const finalStatus = failedCount === targetClinics.length ? "failed" : "completed";
  await updateBroadcastStatus(broadcastId, finalStatus, {
    completedAt: new Date(),
  });

  return {
    success: failedCount < targetClinics.length,
    broadcastId,
    sentCount,
    failedCount,
  };
}

/**
 * Send broadcast email to a single clinic
 */
async function sendBroadcastToClinic(
  broadcast: Broadcast,
  clinic: ClinicEmail
): Promise<boolean> {
  // Get or create unsubscribe token
  const unsubscribeToken = await getOrCreateUnsubscribeToken(clinic.ownerUserId);
  const unsubscribeUrl = getUnsubscribeUrl(unsubscribeToken);

  // Send email using the broadcast email helper
  const result = await sendBroadcastEmail({
    to: clinic.email,
    subject: broadcast.subject,
    htmlContent: broadcast.htmlContent,
    previewText: broadcast.previewText ?? undefined,
    broadcastId: broadcast.id,
    clinicId: clinic.clinicId,
    unsubscribeUrl,
  });

  return result.success;
}

/**
 * Preview recipient count without sending
 */
export async function previewRecipientCount(
  audience: TargetAudience,
  filters?: TargetFilters | undefined
): Promise<number> {
  const clinics = await getTargetClinics({ audience, filters });
  return clinics.length;
}
