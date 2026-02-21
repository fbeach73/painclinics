import { db } from "@/lib/db";
import { adSettings } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";

/**
 * Fetch the global ad server percentage, cached for 60s.
 */
const getAdServerPercentage = unstable_cache(
  async () => {
    const row = await db
      .select({ adServerPercentage: adSettings.adServerPercentage })
      .from(adSettings)
      .where(eq(adSettings.id, 1))
      .limit(1);
    return row[0]?.adServerPercentage ?? 0;
  },
  ["ad-server-percentage"],
  { revalidate: 60 }
);

/**
 * Decide whether the current page load should use hosted ads.
 * Call ONCE per page render, pass result to all <AdSlot> instances.
 *
 * Returns true if hosted ads should be shown, false for AdSense.
 */
export async function shouldUseHostedAds(): Promise<boolean> {
  const percentage = await getAdServerPercentage();
  if (percentage <= 0) return false;
  if (percentage >= 100) return true;
  return Math.random() * 100 < percentage;
}
