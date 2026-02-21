import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adClicks, adConversions } from "@/lib/schema";
import { eq } from "drizzle-orm";

// TODO: Add rate limiting (e.g. Upstash Ratelimit) keyed by IP address to
// prevent postback flooding even from parties who know the secret.

const MAX_PAYOUT = 1000.0;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Authenticate the request with a shared secret.
  const secret = searchParams.get("secret");
  const expectedSecret = process.env.POSTBACK_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clickId = searchParams.get("click_id");
  const payoutRaw = searchParams.get("payout");

  if (!clickId) {
    return NextResponse.json(
      { error: "Missing click_id parameter" },
      { status: 400 }
    );
  }

  // Validate and cap payout.
  const payoutNum = payoutRaw !== null ? parseFloat(payoutRaw) : 0;
  if (isNaN(payoutNum) || payoutNum < 0) {
    return NextResponse.json(
      { error: "Invalid payout value" },
      { status: 400 }
    );
  }
  const payout = Math.min(payoutNum, MAX_PAYOUT).toFixed(2);

  // Validate click_id exists in adClicks
  const click = await db
    .select({ clickId: adClicks.clickId })
    .from(adClicks)
    .where(eq(adClicks.clickId, clickId))
    .limit(1);

  if (click.length === 0) {
    return NextResponse.json({ error: "Invalid click_id" }, { status: 404 });
  }

  // Collect all other query params as metadata
  const metadata: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (key !== "click_id" && key !== "payout" && key !== "secret") {
      metadata[key] = value;
    }
  }

  // Insert conversion — ON CONFLICT DO NOTHING for idempotency
  await db
    .insert(adConversions)
    .values({
      clickId,
      payout,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    })
    .onConflictDoNothing({ target: adConversions.clickId });

  return NextResponse.json({ success: true });
}
