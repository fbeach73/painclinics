import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adClicks, adConversions } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const clickId = searchParams.get("click_id");
  const payout = searchParams.get("payout");

  if (!clickId) {
    return NextResponse.json(
      { error: "Missing click_id parameter" },
      { status: 400 }
    );
  }

  // Validate click_id exists in adClicks
  const click = await db
    .select({ clickId: adClicks.clickId })
    .from(adClicks)
    .where(eq(adClicks.clickId, clickId))
    .limit(1);

  if (click.length === 0) {
    return NextResponse.json(
      { error: "Invalid click_id" },
      { status: 404 }
    );
  }

  // Collect all other query params as metadata
  const metadata: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (key !== "click_id" && key !== "payout") {
      metadata[key] = value;
    }
  }

  // Insert conversion — ON CONFLICT DO NOTHING for idempotency
  await db
    .insert(adConversions)
    .values({
      clickId,
      payout: payout ?? "0",
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    })
    .onConflictDoNothing({ target: adConversions.clickId });

  return NextResponse.json({ success: true });
}
