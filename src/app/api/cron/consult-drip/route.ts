import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { contacts } from "@/lib/schema";
import {
  sendConsultFollowupDay3Email,
  sendConsultFollowupDay7Email,
} from "@/lib/email";

/**
 * GET /api/cron/consult-drip
 * Daily cron job to send Day 3 and Day 7 follow-up emails to consult-user contacts.
 * Protected by CRON_SECRET via Authorization header (Vercel Cron).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";
  const now = new Date();

  // Window: ±12 hours around the exact day boundary
  const HALF_WINDOW_MS = 12 * 60 * 60 * 1000;

  const day3MinMs = 3 * 24 * 60 * 60 * 1000 - HALF_WINDOW_MS;
  const day3MaxMs = 3 * 24 * 60 * 60 * 1000 + HALF_WINDOW_MS;
  const day7MinMs = 7 * 24 * 60 * 60 * 1000 - HALF_WINDOW_MS;
  const day7MaxMs = 7 * 24 * 60 * 60 * 1000 + HALF_WINDOW_MS;

  // Fetch all active consult-user contacts who haven't unsubscribed
  const allContacts = await db
    .select()
    .from(contacts)
    .where(
      sql`${contacts.tags} @> ARRAY['consult-user']::text[]
        AND ${contacts.unsubscribedAt} IS NULL`
    );

  let day3Sent = 0;
  let day7Sent = 0;
  let skipped = 0;

  for (const contact of allContacts) {
    const metadata = contact.metadata ?? {};

    const consultDateRaw = metadata.consultDate;
    if (!consultDateRaw || typeof consultDateRaw !== "string") {
      skipped++;
      continue;
    }

    const consultDate = new Date(consultDateRaw);
    if (isNaN(consultDate.getTime())) {
      skipped++;
      continue;
    }

    const elapsedMs = now.getTime() - consultDate.getTime();

    const condition = cleanCondition(
      typeof metadata.condition === "string" ? metadata.condition : "your pain"
    );
    const zipCode = typeof metadata.zipCode === "string" ? metadata.zipCode : "";
    const firstName = extractFirstName(contact.name);
    const clinicsUrl = zipCode
      ? `${baseUrl}/pain-management?zip=${zipCode}`
      : `${baseUrl}/pain-management`;
    const unsubscribeToken =
      contact.unsubscribeToken ?? undefined;

    // Day 3 check
    if (
      elapsedMs >= day3MinMs &&
      elapsedMs <= day3MaxMs &&
      !metadata.drip3Sent
    ) {
      const result = await sendConsultFollowupDay3Email(
        contact.email,
        { firstName, condition, zipCode, clinicsUrl },
        unsubscribeToken ? { unsubscribeToken } : undefined
      );

      if (result.success) {
        await db
          .update(contacts)
          .set({
            metadata: sql`${contacts.metadata} || '{"drip3Sent": true}'::jsonb`,
          })
          .where(eq(contacts.id, contact.id));
        day3Sent++;
      }
      continue;
    }

    // Day 7 check
    if (
      elapsedMs >= day7MinMs &&
      elapsedMs <= day7MaxMs &&
      !metadata.drip7Sent
    ) {
      const result = await sendConsultFollowupDay7Email(
        contact.email,
        { firstName, condition, zipCode, clinicsUrl },
        unsubscribeToken ? { unsubscribeToken } : undefined
      );

      if (result.success) {
        await db
          .update(contacts)
          .set({
            metadata: sql`${contacts.metadata} || '{"drip7Sent": true}'::jsonb`,
          })
          .where(eq(contacts.id, contact.id));
        day7Sent++;
      }
      continue;
    }

    skipped++;
  }

  return NextResponse.json({ success: true, day3Sent, day7Sent, skipped });
}

/**
 * Strip common "My pain is in my ..." prefixes so the condition reads naturally
 * in email copy. Falls back to the original string if no prefix matches.
 */
function cleanCondition(raw: string): string {
  const prefixes = [
    /^my pain is in my\s+/i,
    /^my pain is\s+/i,
    /^i have pain in my\s+/i,
    /^i have\s+/i,
    /^pain in my\s+/i,
    /^pain in\s+/i,
  ];

  for (const prefix of prefixes) {
    if (prefix.test(raw)) {
      const cleaned = raw.replace(prefix, "").trim();
      // Capitalize first letter
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }

  return raw;
}

function extractFirstName(name: string | null | undefined): string {
  if (!name) return "there";
  return name.split(" ")[0] ?? "there";
}

// Required for Vercel to generate a stable URL without dynamic rendering issues
export const dynamic = "force-dynamic";
