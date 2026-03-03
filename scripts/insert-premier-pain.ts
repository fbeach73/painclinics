/**
 * One-shot script to insert Premier Pain Centers (Richardson, TX) as a draft clinic.
 *
 * Run with:
 *   source .env.local && POSTGRES_URL="$POSTGRES_URL" NEXT_PUBLIC_MAPBOX_TOKEN="$NEXT_PUBLIC_MAPBOX_TOKEN" npx tsx scripts/insert-premier-pain.ts
 */

import postgres from "postgres";
import { createId } from "@paralleldrive/cuid2";

const CLINIC = {
  title: "Premier Pain Centers",
  streetAddress: "2071 N Collins Blvd",
  city: "Richardson",
  state: "Texas",
  stateAbbreviation: "TX",
  postalCode: "75080",
  phone: "04695624188",
  website: "https://paindoctorindallas.com/",
  emails: ["itmanagement@mypremierpain.com"],
  permalink: "pain-management/premier-pain-centers-richardson-tx",
};

async function geocode(
  address: string,
  token: string
): Promise<{ lat: number; lng: number }> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Mapbox geocode failed: ${res.statusText}`);
  const data = (await res.json()) as {
    features: Array<{ center: [number, number] }>;
  };
  if (!data.features?.length) throw new Error("No geocode results");
  const [lng, lat] = data.features[0]!.center;
  return { lat, lng };
}

async function main() {
  const connectionString = process.env.POSTGRES_URL;
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!connectionString) {
    console.error("POSTGRES_URL is required");
    process.exit(1);
  }
  if (!mapboxToken) {
    console.error("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is required");
    process.exit(1);
  }

  const sql = postgres(connectionString);

  // Check for duplicate
  const existing =
    await sql`SELECT id FROM clinics WHERE permalink = ${CLINIC.permalink}`;
  if (existing.length > 0) {
    console.log(
      `Clinic already exists with id: ${existing[0]!.id} — skipping insert.`
    );
    await sql.end();
    return;
  }

  // Geocode
  const fullAddress = `${CLINIC.streetAddress}, ${CLINIC.city}, ${CLINIC.stateAbbreviation} ${CLINIC.postalCode}`;
  console.log(`Geocoding: ${fullAddress}`);
  const { lat, lng } = await geocode(fullAddress, mapboxToken);
  console.log(`  → lat: ${lat}, lng: ${lng}`);

  // Insert
  const id = createId();
  await sql`
    INSERT INTO clinics (
      id, title, permalink, post_type,
      street_address, city, state, state_abbreviation, postal_code,
      map_latitude, map_longitude, detailed_address,
      phone, website, emails,
      status, created_at, updated_at
    ) VALUES (
      ${id}, ${CLINIC.title}, ${CLINIC.permalink}, 'pain-management',
      ${CLINIC.streetAddress}, ${CLINIC.city}, ${CLINIC.state}, ${CLINIC.stateAbbreviation}, ${CLINIC.postalCode},
      ${lat}, ${lng}, ${fullAddress},
      ${CLINIC.phone}, ${CLINIC.website}, ${sql.array(CLINIC.emails)},
      'draft', NOW(), NOW()
    )
  `;

  console.log(`\nInserted clinic with id: ${id}`);
  console.log(`  Status: draft`);
  console.log(`  Permalink: /${CLINIC.permalink}`);
  console.log(`\nNext: run link-places.ts to attach a Google Place ID:`);
  console.log(
    `  source .env.local && POSTGRES_URL="$POSTGRES_URL" GOOGLE_PLACES_API_KEY="$GOOGLE_PLACES_API_KEY" npx tsx scripts/link-places.ts ${id}`
  );

  await sql.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
