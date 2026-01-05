import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import type { EmailTemplateName } from "@/emails";
import { db } from "./db";
import { emailLogs } from "./schema";
import {
  incrementOpenedCount,
  incrementClickedCount,
} from "./broadcast/broadcast-queries";

interface LogEmailParams {
  userId?: string | undefined;
  recipientEmail: string;
  templateName: EmailTemplateName | string;
  subject: string;
  metadata?: Record<string, string> | undefined;
}

export async function createEmailLog(params: LogEmailParams): Promise<string> {
  const id = createId();
  await db.insert(emailLogs).values({
    id,
    userId: params.userId,
    recipientEmail: params.recipientEmail,
    templateName: params.templateName,
    subject: params.subject,
    metadata: params.metadata,
    status: "queued",
  });
  return id;
}

export async function updateEmailLog(
  id: string,
  updates: {
    mailgunMessageId?: string | undefined;
    status?: "queued" | "delivered" | "bounced" | "complained" | "failed" | "opened" | "clicked" | undefined;
    errorMessage?: string | undefined;
    deliveredAt?: Date | undefined;
    openedAt?: Date | undefined;
    clickedAt?: Date | undefined;
    bouncedAt?: Date | undefined;
  }
) {
  await db.update(emailLogs).set(updates).where(eq(emailLogs.id, id));
}

export async function updateEmailLogByMessageId(
  messageId: string,
  updates: {
    status?: "queued" | "delivered" | "bounced" | "complained" | "failed" | "opened" | "clicked";
    errorMessage?: string;
    deliveredAt?: Date;
    openedAt?: Date;
    clickedAt?: Date;
    bouncedAt?: Date;
  }
) {
  // Normalize message ID - try both with and without angle brackets
  // DB stores with brackets: <id@domain>, webhook might send without: id@domain
  const messageIdWithBrackets = messageId.startsWith("<") ? messageId : `<${messageId}>`;
  const messageIdWithoutBrackets = messageId.startsWith("<")
    ? messageId.slice(1, -1)
    : messageId;

  // First, fetch the existing log to get metadata (contains broadcastId for broadcast emails)
  // Try with brackets first (how we store it), then without
  let existingLog = await db.query.emailLogs.findFirst({
    where: eq(emailLogs.mailgunMessageId, messageIdWithBrackets),
  });

  let matchedMessageId = messageIdWithBrackets;

  if (!existingLog) {
    existingLog = await db.query.emailLogs.findFirst({
      where: eq(emailLogs.mailgunMessageId, messageIdWithoutBrackets),
    });
    matchedMessageId = messageIdWithoutBrackets;
  }

  if (!existingLog) {
    console.warn(`No email log found for message ID: ${messageId}`);
    return;
  }

  // Update the email log
  await db
    .update(emailLogs)
    .set(updates)
    .where(eq(emailLogs.mailgunMessageId, matchedMessageId));

  // If this is a broadcast email and we have an open/click event, increment broadcast counts
  if (existingLog?.metadata) {
    const metadata = existingLog.metadata as Record<string, string>;
    const broadcastId = metadata.broadcastId;

    if (broadcastId) {
      // Only increment on first open/click (check if not already recorded)
      if (updates.status === "opened" && !existingLog.openedAt) {
        await incrementOpenedCount(broadcastId);
      } else if (updates.status === "clicked" && !existingLog.clickedAt) {
        await incrementClickedCount(broadcastId);
      }
    }
  }
}
