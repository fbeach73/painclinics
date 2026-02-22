import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adImpressions, adClicks, adCreatives } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { checkClickFraud } from "@/lib/click-fraud-filter";

const FALLBACK_URL = "/";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const clickId = searchParams.get("click_id");

  if (!clickId) {
    return NextResponse.json(
      { error: "Missing click_id parameter" },
      { status: 400 }
    );
  }

  // Look up the impression and join to the creative to get the destination URL.
  // Never use the user-supplied `dest` param — that is an open redirect vector.
  const [impression] = await db
    .select({
      clickId: adImpressions.clickId,
      destinationUrl: adCreatives.destinationUrl,
    })
    .from(adImpressions)
    .innerJoin(adCreatives, eq(adImpressions.creativeId, adCreatives.id))
    .where(eq(adImpressions.clickId, clickId))
    .limit(1);

  // Replace {clickId} macro in destination URL so affiliate networks can pass it back
  const rawDestination = impression?.destinationUrl ?? FALLBACK_URL;
  const destination = rawDestination.replace(/\{clickId\}/g, clickId);

  // Collect signals for fraud detection.
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = xForwardedFor?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent") ?? null;
  const viaHeader = request.headers.get("via");

  if (impression) {
    const verdict = checkClickFraud(userAgent, ipAddress, xForwardedFor, viaHeader);

    if (verdict.allowed) {
      // Legitimate click — record normally.
      db.insert(adClicks)
        .values({ clickId, ipAddress, userAgent, isBot: false })
        .onConflictDoNothing({ target: adClicks.clickId })
        .catch((err) => console.error("Failed to record ad click:", err));
    } else {
      // Bot/fraud detected — still redirect (preserve UX) but mark as bot.
      // We keep the record for analysis but exclude it from stats queries.
      db.insert(adClicks)
        .values({
          clickId,
          ipAddress,
          userAgent,
          isBot: true,
          botReason: verdict.reason ?? null,
        })
        .onConflictDoNothing({ target: adClicks.clickId })
        .catch((err) => console.error("Failed to record bot click:", err));
    }
  }

  return NextResponse.redirect(destination, { status: 302 });
}
