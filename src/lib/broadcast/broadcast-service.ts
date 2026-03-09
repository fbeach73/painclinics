import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sendBroadcastEmail, generateUnsubscribeToken, getUnsubscribeUrl } from "@/lib/email";
import { user, emailUnsubscribes } from "@/lib/schema";
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
import {
  getTargetContacts,
  substituteContactMergeTags,
  getSampleContactData,
} from "./contact-targeting";
import type { ContactEmail } from "@/lib/contact-queries";

// ============================================
// Constants
// ============================================

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 200; // ~250 emails/min, under 300/min limit

// ============================================
// City Clinic Count Cache
// ============================================

let cityClinicCountsCache: Map<string, number> | null = null;

async function getCityClinicCounts(): Promise<Map<string, number>> {
  if (cityClinicCountsCache) return cityClinicCountsCache;

  const { db } = await import("@/lib/db");
  const { clinics } = await import("@/lib/schema");
  const { eq, sql, and } = await import("drizzle-orm");

  const result = await db
    .select({
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
      count: sql<number>`count(*)::int`,
    })
    .from(clinics)
    .where(and(eq(clinics.status, "published")))
    .groupBy(clinics.city, clinics.stateAbbreviation);

  const counts = new Map<string, number>();
  for (const row of result) {
    const key = `${row.city}|${row.stateAbbreviation}`;
    counts.set(key, row.count);
  }
  cityClinicCountsCache = counts;
  return counts;
}

function isContactAudience(
  audience: string
): audience is "contacts_all" | "contacts_users" | "contacts_leads" {
  return audience.startsWith("contacts_");
}

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
 * Get or create unsubscribe token
 * For users with accounts: uses user.unsubscribeToken
 * For emails without accounts: uses emailUnsubscribes table
 */
async function getOrCreateUnsubscribeToken(
  userId: string | null,
  email: string,
  clinicId: string | null
): Promise<string> {
  // If user has an account, use user-based unsubscribe
  if (userId) {
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (existingUser?.unsubscribeToken) {
      return existingUser.unsubscribeToken;
    }

    // Generate and save new token on user
    const token = generateUnsubscribeToken();
    await db.update(user).set({ unsubscribeToken: token }).where(eq(user.id, userId));
    return token;
  }

  // For emails without user accounts, use emailUnsubscribes table
  // Check if token already exists for this email
  const existing = await db.query.emailUnsubscribes.findFirst({
    where: eq(emailUnsubscribes.email, email),
  });

  if (existing) {
    return existing.token;
  }

  // Create new unsubscribe record
  const token = generateUnsubscribeToken();
  await db.insert(emailUnsubscribes).values({
    email,
    token,
    clinicId: clinicId || undefined,
  });

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
  return process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com";
}

/**
 * Substitute merge tags in content with actual clinic data
 */
export function substituteMergeTags(
  content: string,
  clinic: ClinicEmail,
  cityClinicCounts?: Map<string, number>
): string {
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

  // Computed audit merge tags
  const ratingStars = clinic.rating
    ? "★".repeat(Math.round(clinic.rating)) + "☆".repeat(5 - Math.round(clinic.rating)) + ` ${clinic.rating.toFixed(1)}`
    : "No rating yet";

  const reviewSummary = clinic.reviewCount && clinic.reviewCount > 0
    ? `${clinic.reviewCount} Google review${clinic.reviewCount === 1 ? "" : "s"}`
    : "No reviews yet";

  const missingItems: string[] = [];
  if (!clinic.website) missingItems.push("website");
  if (!clinic.phone) missingItems.push("phone number");
  if (!clinic.clinicHours) missingItems.push("business hours");
  if (!clinic.imageUrl) missingItems.push("photos");
  if (!clinic.content && !clinic.enhancedAbout) missingItems.push("business description");
  if (!clinic.rating) missingItems.push("Google reviews");
  const missingItemsStr = missingItems.length > 0 ? missingItems.join(", ") : "none — looks great!";

  const totalFields = 6; // website, phone, hours, photos, description, reviews
  const filledFields = totalFields - missingItems.length;
  const profileScore = Math.round((filledFields / totalFields) * 100);

  const cityKey = `${clinic.city}|${clinic.stateAbbreviation}`;
  const competitorCount = cityClinicCounts?.get(cityKey) ?? 0;
  const competitorCountMinusOne = Math.max(0, competitorCount - 1);

  replacements["{{rating_stars}}"] = ratingStars;
  replacements["{{review_summary}}"] = reviewSummary;
  replacements["{{missing_items}}"] = missingItemsStr;
  replacements["{{profile_score}}"] = `${profileScore}%`;
  replacements["{{competitor_count}}"] = competitorCountMinusOne.toString();

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
    clinicHours: { Monday: "9:00 AM - 5:00 PM" },
    imageUrl: "https://example.com/photo.jpg",
    content: "Sample clinic content",
    enhancedAbout: null,
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

  const audienceType = (broadcast.targetAudience || "all_with_email") as string;

  let personalizedSubject: string;
  let personalizedContent: string;
  let personalizedPreview: string | undefined;

  if (isContactAudience(audienceType)) {
    // Use sample contact data for contact audiences
    const sampleContact = getSampleContactData();
    personalizedSubject = substituteContactMergeTags(broadcast.subject, sampleContact);
    personalizedContent = substituteContactMergeTags(broadcast.htmlContent, sampleContact);
    personalizedPreview = broadcast.previewText
      ? substituteContactMergeTags(broadcast.previewText, sampleContact)
      : undefined;
  } else {
    // Use sample clinic data for clinic audiences
    const sampleClinic = getSampleClinicData();
    personalizedSubject = substituteMergeTags(broadcast.subject, sampleClinic);
    personalizedContent = substituteMergeTags(broadcast.htmlContent, sampleClinic);
    personalizedPreview = broadcast.previewText
      ? substituteMergeTags(broadcast.previewText, sampleClinic)
      : undefined;
  }

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

  // 2. Get target recipients (clinics or contacts)
  const audienceType = (broadcast.targetAudience || "all_with_email") as string;
  const targetFilters = broadcast.targetFilters as TargetFilters | null;

  let recipientCount: number;
  let sentCount = 0;
  let failedCount = 0;

  if (isContactAudience(audienceType)) {
    // Contact-based audience
    const targetContacts = await getTargetContacts(
      audienceType,
      targetFilters?.excludeUnsubscribed ?? true
    );

    if (targetContacts.length === 0) {
      return {
        success: false,
        broadcastId,
        sentCount: 0,
        failedCount: 0,
        error: "No target contacts found with the specified filters",
      };
    }

    recipientCount = targetContacts.length;

    // 3. Update status to sending
    await updateBroadcastStatus(broadcastId, "sending", {
      startedAt: new Date(),
      recipientCount,
    });

    // 4. Send emails in batches
    for (let i = 0; i < targetContacts.length; i += BATCH_SIZE) {
      const batch = targetContacts.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (contact) => {
          try {
            const success = await sendBroadcastToContact(broadcast, contact);
            if (success) {
              sentCount++;
              await incrementSentCount(broadcastId);
            } else {
              failedCount++;
              await incrementFailedCount(broadcastId);
            }
          } catch (error) {
            console.error(`Failed to send to ${contact.email}:`, error);
            failedCount++;
            await incrementFailedCount(broadcastId);
          }
        })
      );

      if (i + BATCH_SIZE < targetContacts.length) {
        await delay(BATCH_DELAY_MS);
      }
    }
  } else {
    // Clinic-based audience
    const targetClinics = await getTargetClinics({
      audience: audienceType as TargetAudience,
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

    recipientCount = targetClinics.length;

    // Fetch city clinic counts once for computed merge tags
    const cityClinicCounts = await getCityClinicCounts();

    // 3. Update status to sending
    await updateBroadcastStatus(broadcastId, "sending", {
      startedAt: new Date(),
      recipientCount,
    });

    // 4. Send emails in batches
    for (let i = 0; i < targetClinics.length; i += BATCH_SIZE) {
      const batch = targetClinics.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (clinic) => {
          try {
            const success = await sendBroadcastToClinic(broadcast, clinic, cityClinicCounts);
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

      if (i + BATCH_SIZE < targetClinics.length) {
        await delay(BATCH_DELAY_MS);
      }
    }
  }

  // 5. Update final status
  const finalStatus = failedCount === recipientCount ? "failed" : "completed";
  await updateBroadcastStatus(broadcastId, finalStatus, {
    completedAt: new Date(),
  });

  cityClinicCountsCache = null; // Clear cache after broadcast

  return {
    success: failedCount < recipientCount,
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
  clinic: ClinicEmail,
  cityClinicCounts?: Map<string, number>
): Promise<boolean> {
  // Get or create unsubscribe token (pass email and clinicId for non-user emails)
  const unsubscribeToken = await getOrCreateUnsubscribeToken(
    clinic.ownerUserId,
    clinic.email,
    clinic.clinicId || null
  );
  const unsubscribeUrl = getUnsubscribeUrl(unsubscribeToken);

  // Substitute merge tags with actual clinic data
  const personalizedSubject = substituteMergeTags(broadcast.subject, clinic, cityClinicCounts);
  const personalizedContent = substituteMergeTags(broadcast.htmlContent, clinic, cityClinicCounts);
  const personalizedPreview = broadcast.previewText
    ? substituteMergeTags(broadcast.previewText, clinic, cityClinicCounts)
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
 * Send broadcast email to a single contact
 * Substitutes contact merge tags with actual contact data
 */
async function sendBroadcastToContact(
  broadcast: Broadcast,
  contact: ContactEmail
): Promise<boolean> {
  // Use the contact's existing unsubscribe token
  const unsubscribeToken = contact.unsubscribeToken || await getOrCreateUnsubscribeToken(
    contact.userId,
    contact.email,
    null
  );
  const unsubscribeUrl = getUnsubscribeUrl(unsubscribeToken);

  // Substitute merge tags with actual contact data
  const personalizedSubject = substituteContactMergeTags(broadcast.subject, contact);
  const personalizedContent = substituteContactMergeTags(broadcast.htmlContent, contact);
  const personalizedPreview = broadcast.previewText
    ? substituteContactMergeTags(broadcast.previewText, contact)
    : undefined;

  const result = await sendBroadcastEmail({
    to: contact.email,
    subject: personalizedSubject,
    htmlContent: personalizedContent,
    previewText: personalizedPreview,
    broadcastId: broadcast.id,
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
  if (isContactAudience(audience)) {
    const contacts = await getTargetContacts(
      audience,
      filters?.excludeUnsubscribed ?? true
    );
    return contacts.length;
  }
  const clinics = await getTargetClinics({ audience, filters });
  return clinics.length;
}
