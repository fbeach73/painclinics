import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";

// Never cache — each visitor must get their own coin flip
export const dynamic = "force-dynamic";

export async function GET() {
  const row = await db
    .select({ adServerPercentage: adSettings.adServerPercentage })
    .from(adSettings)
    .where(eq(adSettings.id, 1))
    .limit(1);

  const percentage = row[0]?.adServerPercentage ?? 0;

  let useHostedAds: boolean;
  if (percentage <= 0) {
    useHostedAds = false;
  } else if (percentage >= 100) {
    useHostedAds = true;
  } else {
    useHostedAds = Math.random() * 100 < percentage;
  }

  return NextResponse.json({ useHostedAds });
}
