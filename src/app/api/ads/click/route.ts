import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adImpressions, adClicks } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const clickId = searchParams.get("click_id");
  const dest = searchParams.get("dest");

  if (!clickId || !dest) {
    return NextResponse.json(
      { error: "Missing click_id or dest parameter" },
      { status: 400 }
    );
  }

  // Validate click_id exists in adImpressions
  const impression = await db
    .select({ clickId: adImpressions.clickId })
    .from(adImpressions)
    .where(eq(adImpressions.clickId, clickId))
    .limit(1);

  if (impression.length === 0) {
    // Invalid click_id — redirect anyway to not break UX
    return NextResponse.redirect(decodeURIComponent(dest), { status: 302 });
  }

  // Record click (fire-and-forget to not delay redirect)
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent") ?? null;

  db.insert(adClicks)
    .values({ clickId, ipAddress, userAgent })
    .onConflictDoNothing({ target: adClicks.clickId })
    .catch((err) => console.error("Failed to record ad click:", err));

  return NextResponse.redirect(decodeURIComponent(dest), { status: 302 });
}
