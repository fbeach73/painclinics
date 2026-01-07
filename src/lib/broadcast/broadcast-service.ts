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
import { getTargetClinics, MERGE_TAGS, type ClinicEmail } from "./clinic-targeting";

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

/**
 * Build full address from clinic data
 */
function buildFullAddress(clinic: ClinicEmail): string {
  const parts = [
    clinic.streetAddress,
    clinic.city,
    clinic.stateAbbreviation || clinic.state,
    clinic.postalCode,
  ].filter(Boolean);
  return parts.join(", ");
}

/**
 * Get the base URL for the application
 */
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";
}

/**
 * Substitute merge tags in content with actual clinic data
 */
export function substituteMergeTags(content: string, clinic: ClinicEmail): string {
  const baseUrl = getBaseUrl();
  const clinicUrl = clinic.permalink
    ? `${baseUrl}/pain-management/${clinic.permalink}`
    : "";
  const claimUrl = clinic.permalink
    ? `${baseUrl}/pain-management/${clinic.permalink}#claim`
    : "";

  const replacements: Record<string, string> = {
    "{{clinic_name}}": clinic.clinicName || "",
    "{{clinic_url}}": clinicUrl,
    "{{claim_url}}": claimUrl,
    "{{city}}": clinic.city || "",
    "{{state}}": clinic.state || "",
    "{{state_abbr}}": clinic.stateAbbreviation || "",
    "{{address}}": clinic.streetAddress || "",
    "{{full_address}}": buildFullAddress(clinic),
    "{{postal_code}}": clinic.postalCode || "",
    "{{phone}}": clinic.phone || "",
    "{{website}}": clinic.website || "",
    "{{rating}}": clinic.rating?.toFixed(1) || "",
    "{{review_count}}": clinic.reviewCount?.toString() || "",
  };

  let result = content;
  for (const [tag, value] of Object.entries(replacements)) {
    result = result.replaceAll(tag, value);
  }

  return result;
}

/**
 * Get sample clinic data for preview/test emails
 */
export function getSampleClinicData(): ClinicEmail {
  return {
    clinicId: "sample-id",
    clinicName: "Sample Pain Clinic",
    email: "sample@example.com",
    bccEmails: null,
    ownerUserId: null,
    permalink: "sample-pain-clinic",
    city: "Los Angeles",
    state: "California",
    stateAbbreviation: "CA",
    streetAddress: "123 Medical Center Drive",
    postalCode: "90001",
    phone: "(555) 123-4567",
    website: "https://samplepain.com",
    rating: 4.8,
    reviewCount: 127,
    isFeatured: false,
    featuredTier: null,
  };
}

/**
 * Get merge tag examples for UI display
 */
export function getMergeTagExamples(): Array<{ tag: string; label: string; example: string }> {
  return Object.entries(MERGE_TAGS).map(([key, value]) => ({
    tag: `{{${key}}}`,
    label: value.label,
    example: value.example,
  }));
}

// ============================================
// Main Service Functions
// ============================================

/**
 * Send a test email for a broadcast
 * Uses sample clinic data to demonstrate merge tag substitution
 */
export async function sendTestEmail(
  broadcastId: string,
  testEmail: string
): Promise<SendTestEmailResult> {
  const broadcast = await getBroadcast(broadcastId);
  if (!broadcast) {
    return { success: false, error: "Broadcast not found" };
  }

  // Use sample clinic data to show how merge tags will render
  const sampleClinic = getSampleClinicData();

  // Substitute merge tags with sample data
  const personalizedSubject = substituteMergeTags(broadcast.subject, sampleClinic);
  const personalizedContent = substituteMergeTags(broadcast.htmlContent, sampleClinic);
  const personalizedPreview = broadcast.previewText
    ? substituteMergeTags(broadcast.previewText, sampleClinic)
    : undefined;

  // Generate a test unsubscribe URL (won't actually work for unsubscribing)
  const unsubscribeUrl = getUnsubscribeUrl("test-token");

  const result = await sendBroadcastEmail({
    to: testEmail,
    subject: personalizedSubject,
    htmlContent: personalizedContent,
    previewText: personalizedPreview,
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
 * Substitutes merge tags with actual clinic data
 */
async function sendBroadcastToClinic(
  broadcast: Broadcast,
  clinic: ClinicEmail
): Promise<boolean> {
  // Get or create unsubscribe token
  const unsubscribeToken = await getOrCreateUnsubscribeToken(clinic.ownerUserId);
  const unsubscribeUrl = getUnsubscribeUrl(unsubscribeToken);

  // Substitute merge tags with actual clinic data
  const personalizedSubject = substituteMergeTags(broadcast.subject, clinic);
  const personalizedContent = substituteMergeTags(broadcast.htmlContent, clinic);
  const personalizedPreview = broadcast.previewText
    ? substituteMergeTags(broadcast.previewText, clinic)
    : undefined;

  // Send email using the broadcast email helper
  // BCC additional clinic emails if present
  const result = await sendBroadcastEmail({
    to: clinic.email,
    subject: personalizedSubject,
    htmlContent: personalizedContent,
    previewText: personalizedPreview,
    broadcastId: broadcast.id,
    clinicId: clinic.clinicId,
    unsubscribeUrl,
    bcc: clinic.bccEmails || undefined,
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
