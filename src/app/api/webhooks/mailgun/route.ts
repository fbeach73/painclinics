import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { updateEmailLogByMessageId } from "@/lib/email-logger";

/**
 * Verify Mailgun webhook signature
 * @see https://documentation.mailgun.com/en/latest/user_manual.html#webhooks-1
 */
function verifyWebhookSignature(
  timestamp: string,
  token: string,
  signature: string
): boolean {
  const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
  if (!signingKey) {
    console.warn("MAILGUN_WEBHOOK_SIGNING_KEY not configured");
    return false;
  }

  // Mailgun signs with timestamp + token
  const encodedToken = crypto
    .createHmac("sha256", signingKey)
    .update(timestamp.concat(token))
    .digest("hex");

  return encodedToken === signature;
}

/**
 * Extract message ID from various Mailgun event formats
 */
function extractMessageId(eventData: Record<string, unknown>): string | null {
  // Try different paths where message ID might be
  const message = eventData.message as Record<string, unknown> | undefined;
  const headers = message?.headers as Record<string, string> | undefined;

  // Mailgun v2 format
  if (headers?.["message-id"]) {
    return headers["message-id"];
  }

  // Some events have it at top level
  if (typeof eventData["message-id"] === "string") {
    return eventData["message-id"];
  }

  // Legacy format
  if (typeof eventData["Message-Id"] === "string") {
    return eventData["Message-Id"];
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Handle JSON format (modern Mailgun webhooks)
    if (contentType.includes("application/json")) {
      const body = await request.json();

      // Extract signature from JSON body
      const signatureData = body.signature as Record<string, string> | undefined;
      if (signatureData && process.env.MAILGUN_WEBHOOK_SIGNING_KEY) {
        const timestamp = signatureData.timestamp || "";
        const token = signatureData.token || "";
        const signature = signatureData.signature || "";
        if (timestamp && token && signature && !verifyWebhookSignature(timestamp, token, signature)) {
          console.error("Invalid Mailgun webhook signature (JSON)");
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
      }

      // Extract event data from JSON body
      const eventData = body["event-data"] as Record<string, unknown>;
      if (!eventData) {
        console.warn("No event-data in JSON webhook");
        return NextResponse.json({ received: true });
      }

      const messageId = extractMessageId(eventData);
      const event = eventData.event as string;

      if (!messageId) {
        console.warn("Webhook received without message ID:", event);
        return NextResponse.json({ received: true });
      }

      await processEvent(event, messageId, eventData);
      return NextResponse.json({ received: true });
    }

    // Handle form data format (legacy Mailgun webhooks)
    const formData = await request.formData();

    // Extract signature fields
    const timestamp = formData.get("timestamp") as string;
    const token = formData.get("token") as string;
    const signature = formData.get("signature") as string;

    // Verify signature (skip in development if not configured)
    if (process.env.MAILGUN_WEBHOOK_SIGNING_KEY) {
      if (!verifyWebhookSignature(timestamp, token, signature)) {
        console.error("Invalid Mailgun webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // Parse event data
    const eventDataStr = formData.get("event-data") as string;

    // Legacy format fallback - some events come as flat form data
    if (!eventDataStr) {
      const event = formData.get("event") as string;
      const messageId = formData.get("Message-Id") as string;

      if (event && messageId) {
        await processEvent(event, messageId, {});
      }

      return NextResponse.json({ received: true });
    }

    // Parse JSON event data
    let eventData: Record<string, unknown>;
    try {
      eventData = JSON.parse(eventDataStr);
    } catch {
      console.error("Failed to parse event-data JSON");
      return NextResponse.json({ error: "Invalid event data" }, { status: 400 });
    }

    const messageId = extractMessageId(eventData);
    const event = eventData.event as string;

    if (!messageId) {
      console.warn("Webhook received without message ID:", event);
      return NextResponse.json({ received: true });
    }

    await processEvent(event, messageId, eventData);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Mailgun webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * Process Mailgun webhook event and update email log
 */
async function processEvent(
  event: string,
  messageId: string,
  eventData: Record<string, unknown>
) {
  const updates: {
    status?: "queued" | "delivered" | "bounced" | "complained" | "failed" | "opened" | "clicked";
    errorMessage?: string;
    deliveredAt?: Date;
    openedAt?: Date;
    clickedAt?: Date;
    bouncedAt?: Date;
  } = {};

  switch (event) {
    case "delivered":
      updates.status = "delivered";
      updates.deliveredAt = new Date();
      break;

    case "opened":
      updates.status = "opened";
      updates.openedAt = new Date();
      // If opened, it must have been delivered (Mailgun sometimes skips delivered event)
      updates.deliveredAt = new Date();
      break;

    case "clicked":
      updates.status = "clicked";
      updates.clickedAt = new Date();
      // If clicked, it must have been delivered (Mailgun sometimes skips delivered event)
      updates.deliveredAt = new Date();
      break;

    case "bounced":
    case "permanent_fail":
      updates.status = "bounced";
      updates.bouncedAt = new Date();
      updates.errorMessage = extractErrorMessage(eventData);
      break;

    case "complained":
      updates.status = "complained";
      updates.errorMessage = "Recipient marked as spam";
      break;

    case "failed":
    case "temporary_fail":
      updates.status = "failed";
      updates.errorMessage = extractErrorMessage(eventData);
      break;

    case "accepted":
      // Email accepted by Mailgun - we already log this on send
      // Don't update status as it might overwrite a more informative status
      return;

    default:
      console.warn("Unhandled Mailgun event:", event);
      return;
  }

  if (Object.keys(updates).length > 0) {
    try {
      await updateEmailLogByMessageId(messageId, updates);
      console.warn(`Email log updated for ${messageId}: ${event}`);
    } catch (error) {
      console.error(`Failed to update email log for ${messageId}:`, error);
    }
  }
}

/**
 * Extract error message from event data
 */
function extractErrorMessage(eventData: Record<string, unknown>): string {
  // Try various paths for error messages
  if (typeof eventData.reason === "string") {
    return eventData.reason;
  }

  const deliveryStatus = eventData["delivery-status"] as Record<string, unknown> | undefined;
  if (deliveryStatus) {
    if (typeof deliveryStatus.description === "string") {
      return deliveryStatus.description;
    }
    if (typeof deliveryStatus.message === "string") {
      return deliveryStatus.message;
    }
  }

  const reject = eventData.reject as Record<string, unknown> | undefined;
  if (reject && typeof reject.reason === "string") {
    return reject.reason;
  }

  return "Unknown delivery error";
}

// Mailgun also supports GET for verification
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Mailgun webhook endpoint active"
  });
}
