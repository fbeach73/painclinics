import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";
import { sql } from "drizzle-orm";
import { getAllCitiesWithClinics } from "@/lib/clinic-queries";

export const revalidate = 86400; // Cache for 24 hours

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

// Pre-generate redirects at build time for performance
export async function generateStaticParams() {
  try {
    const cities = await getAllCitiesWithClinics();
    return cities.map(({ city }) => ({
      city: city.toLowerCase().replace(/\s+/g, "-"),
    }));
  } catch {
    return [];
  }
}
