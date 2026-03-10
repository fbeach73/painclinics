import { and, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { contacts } from "@/lib/schema";
import { sendEmail, getUnsubscribeUrl } from "@/lib/email";
import {
  getNewsletterBroadcast,
  updateNewsletterBroadcastStatus,
} from "./queries";

// ============================================
// Constants
// ============================================

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 200; // ~250 emails/min, under Mailgun 300/min limit
const FROM_EMAIL = "Pain Clinics Directory <hello@painclinics.com>";

// ============================================
// Subscriber Queries
// ============================================

interface Subscriber {
  email: string;
  unsubscribeToken: string | null;
}

/**
 * Get subscribers for a given list_id (maps to contacts tag).
 * Excludes unsubscribed contacts.
 */
async function getSubscribers(listId: string): Promise<Subscriber[]> {
  const tag = listId; // list_id maps directly to a tag in contacts

  const results = await db
    .select({
      email: contacts.email,
      unsubscribeToken: contacts.unsubscribeToken,
    })
    .from(contacts)
    .where(
      and(
        sql`${contacts.tags} @> ARRAY[${tag}]::text[]`,
        isNull(contacts.unsubscribedAt)
      )
    );

  return results;
}

/**
 * Get subscriber count for a list.
 */
export async function getSubscriberCount(listId: string): Promise<number> {
  const tag = listId;

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(contacts)
    .where(
      and(
        sql`${contacts.tags} @> ARRAY[${tag}]::text[]`,
        isNull(contacts.unsubscribedAt)
      )
    );

  return result?.count ?? 0;
}

// ============================================
// Unsubscribe Footer Injection
// ============================================

const UNSUBSCRIBE_FOOTER = `
<div style="text-align: center; padding: 20px 0 10px; margin-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
  <p style="margin: 0 0 8px;">Pain Clinics Directory · 123 Main St · Anytown, USA</p>
  <p style="margin: 0;"><a href="{{unsubscribe_url}}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a></p>
</div>`;

function injectUnsubscribeFooter(
  html: string,
  unsubscribeUrl: string
): string {
  const footer = UNSUBSCRIBE_FOOTER.replace("{{unsubscribe_url}}", unsubscribeUrl);

  // If </body> exists, inject before it
  if (html.includes("</body>")) {
    return html.replace("</body>", `${footer}</body>`);
  }

  // Otherwise append
  return html + footer;
}

// ============================================
// Send Broadcast
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send a newsletter broadcast to all subscribers of the target list.
 * Runs in batches to stay under Mailgun rate limits.
 */
export async function sendNewsletterBroadcast(
  broadcastId: string
): Promise<{
  success: boolean;
  sentCount: number;
  failedCount: number;
  error?: string;
}> {
  const broadcast = await getNewsletterBroadcast(broadcastId);
  if (!broadcast) {
    return { success: false, sentCount: 0, failedCount: 0, error: "Broadcast not found" };
  }

  if (broadcast.status !== "queued" && broadcast.status !== "sending") {
    return {
      success: false,
      sentCount: 0,
      failedCount: 0,
      error: `Broadcast has status "${broadcast.status}" and cannot be sent`,
    };
  }

  // Get subscribers
  const subscribers = await getSubscribers(broadcast.listId);
  if (subscribers.length === 0) {
    await updateNewsletterBroadcastStatus(broadcastId, "delivered", {
      sentAt: new Date(),
      recipientCount: 0,
      deliveredCount: 0,
    });
    return { success: true, sentCount: 0, failedCount: 0 };
  }

  // Update status to sending
  await updateNewsletterBroadcastStatus(broadcastId, "sending", {
    recipientCount: subscribers.length,
  });

  let sentCount = 0;
  let failedCount = 0;

  // Send in batches
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (subscriber) => {
        const unsubscribeUrl = subscriber.unsubscribeToken
          ? getUnsubscribeUrl(subscriber.unsubscribeToken)
          : getUnsubscribeUrl("unknown");

        const htmlWithFooter = injectUnsubscribeFooter(
          broadcast.htmlContent,
          unsubscribeUrl
        );

        return sendEmail({
          to: subscriber.email,
          subject: broadcast.subject,
          html: htmlWithFooter,
          templateName: "newsletter_broadcast",
          from: FROM_EMAIL,
          metadata: {
            newsletterBroadcastId: broadcastId,
            listId: broadcast.listId,
            ...(broadcast.tags.length > 0 && { tags: broadcast.tags.join(",") }),
          },
        });
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.success) {
        sentCount++;
      } else {
        failedCount++;
      }
    }

    // Rate limit delay between batches (except last batch)
    if (i + BATCH_SIZE < subscribers.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  // Update final status
  const finalStatus = failedCount === subscribers.length ? "failed" : "delivered";
  await updateNewsletterBroadcastStatus(broadcastId, finalStatus, {
    sentAt: new Date(),
    deliveredCount: sentCount,
  });

  return { success: true, sentCount, failedCount };
}
