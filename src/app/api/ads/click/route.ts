import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adImpressions, adClicks, adCreatives } from "@/lib/schema";
import { eq } from "drizzle-orm";

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

  const destination = impression?.destinationUrl ?? FALLBACK_URL;

  // Record click (fire-and-forget to not delay redirect)
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent") ?? null;

  if (impression) {
    db.insert(adClicks)
      .values({ clickId, ipAddress, userAgent })
      .onConflictDoNothing({ target: adClicks.clickId })
      .catch((err) => console.error("Failed to record ad click:", err));
  }

  return NextResponse.redirect(destination, { status: 302 });
}
