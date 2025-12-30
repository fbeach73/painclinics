import { redirect, notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";

// Dynamic route - no static generation needed for redirects
export const dynamic = "force-dynamic";

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

  // Look up city in database (first match wins for multi-state cities)
  const result = await db
    .select({
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
    })
    .from(clinics)
    .where(sql`LOWER(${clinics.city}) = LOWER(${cityName})`)
    .limit(1);

  const firstResult = result[0];
  if (!firstResult) {
    notFound();
  }

  const { stateAbbreviation } = firstResult;
  const citySlug = city.toLowerCase();
  const stateSlug = stateAbbreviation?.toLowerCase() || "";

  // 301 permanent redirect to new URL
  redirect(`/pain-management/${stateSlug}/${citySlug}/`);
}
