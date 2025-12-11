import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import type { EmailTemplateName } from "@/emails";
import { db } from "./db";
import { emailLogs } from "./schema";

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
  await db
    .update(emailLogs)
    .set(updates)
    .where(eq(emailLogs.mailgunMessageId, messageId));
}
