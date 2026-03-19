import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clinics } from "@/lib/schema";
import { eq, like, desc, sql } from "drizzle-orm";

interface MatchedClinic {
  id: string;
  title: string;
  permalink: string;
  city: string;
  stateAbbreviation: string | null;
  phone: string | null;
  rating: number | null;
  reviewCount: number | null;
  streetAddress: string | null;
  postalCode: string;
}

export async function POST(request: Request) {
  let body: { zipCode?: string };
  try {
    body = await request.json() as { zipCode?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { zipCode } = body;

  if (!zipCode || !/^\d{5}$/.test(zipCode)) {
    return NextResponse.json({ error: "Valid 5-digit zip code is required" }, { status: 400 });
  }

  const zip3 = zipCode.slice(0, 3);

  // 1. Try exact zip match first
  let results = await db
    .select({
      id: clinics.id,
      title: clinics.title,
      permalink: clinics.permalink,
      city: clinics.city,
      stateAbbreviation: clinics.stateAbbreviation,
      phone: clinics.phone,
      rating: clinics.rating,
      reviewCount: clinics.reviewCount,
      streetAddress: clinics.streetAddress,
      postalCode: clinics.postalCode,
    })
    .from(clinics)
    .where(eq(clinics.postalCode, zipCode))
    .orderBy(desc(sql`COALESCE(${clinics.rating}, 0)`), desc(sql`COALESCE(${clinics.reviewCount}, 0)`))
    .limit(10);

  // 2. Fall back to 3-digit prefix match
  if (results.length === 0) {
    results = await db
      .select({
        id: clinics.id,
        title: clinics.title,
        permalink: clinics.permalink,
        city: clinics.city,
        stateAbbreviation: clinics.stateAbbreviation,
        phone: clinics.phone,
        rating: clinics.rating,
        reviewCount: clinics.reviewCount,
        streetAddress: clinics.streetAddress,
        postalCode: clinics.postalCode,
      })
      .from(clinics)
      .where(like(clinics.postalCode, `${zip3}%`))
      .orderBy(desc(sql`COALESCE(${clinics.rating}, 0)`), desc(sql`COALESCE(${clinics.reviewCount}, 0)`))
      .limit(10);
  }

  const formatted: MatchedClinic[] = results.map((c) => ({
    id: c.id,
    title: c.title,
    permalink: c.permalink,
    city: c.city,
    stateAbbreviation: c.stateAbbreviation,
    phone: c.phone,
    rating: c.rating !== null ? parseFloat(String(c.rating)) : null,
    reviewCount: c.reviewCount,
    streetAddress: c.streetAddress,
    postalCode: c.postalCode,
  }));

  return NextResponse.json({ clinics: formatted, total: formatted.length });
}
