import { redirect, notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";

// Dynamic route - redirect must execute at request time
export const dynamic = "force-dynamic";

const getCachedCityState = unstable_cache(
  async (cityName: string) => {
    const result = await db
      .select({
        city: clinics.city,
        stateAbbreviation: clinics.stateAbbreviation,
      })
      .from(clinics)
      .where(sql`LOWER(${clinics.city}) = LOWER(${cityName})`)
      .limit(1);
    return result[0] ?? null;
  },
  ["city-redirect"],
  { revalidate: 2592000 } // 30 days
);

interface Props {
  params: Promise<{ city: string }>;
}

export default async function CityRedirectPage({ params }: Props) {
  const { city } = await params;

  // Convert slug to city name format for lookup
  const cityName = city
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const firstResult = await getCachedCityState(cityName);
  if (!firstResult) {
    notFound();
  }

  const { stateAbbreviation } = firstResult;
  const citySlug = city.toLowerCase();
  const stateSlug = stateAbbreviation?.toLowerCase() || "";

  // 301 permanent redirect to new URL
  redirect(`/pain-management/${stateSlug}/${citySlug}/`);
}
