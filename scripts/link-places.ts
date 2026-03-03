/**
 * Link a clinic to its Google Places entry.
 * Searches Google Places by clinic name + location, previews results, and
 * auto-links if confidence is high (fuzzy name match > 80%).
 *
 * Run with:
 *   source .env.local && POSTGRES_URL="$POSTGRES_URL" GOOGLE_PLACES_API_KEY="$GOOGLE_PLACES_API_KEY" npx tsx scripts/link-places.ts <clinicId>
 */

import postgres from "postgres";

const PLACES_API_BASE = "https://places.googleapis.com/v1";

interface PlaceResult {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  location?: { latitude: number; longitude: number };
}

async function searchPlaces(
  apiKey: string,
  query: string,
  locationBias?: { lat: number; lng: number }
): Promise<PlaceResult[]> {
  const body: Record<string, unknown> = {
    textQuery: query,
    maxResultCount: 5,
  };

  if (locationBias) {
    body.locationBias = {
      circle: {
        center: {
          latitude: locationBias.lat,
          longitude: locationBias.lng,
        },
        radius: 5000,
      },
    };
  }

  const res = await fetch(`${PLACES_API_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Places API error (${res.status}): ${err}`);
  }

  const data = (await res.json()) as { places?: PlaceResult[] };
  return data.places || [];
}

function fuzzyScore(a: string, b: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 100;

  // Containment check — if one name fully contains the other,
  // score high (the extra text is usually a city/location suffix)
  const longer = na.length > nb.length ? na : nb;
  const shorter = na.length > nb.length ? nb : na;
  if (longer.includes(shorter)) {
    // Starts-with gets a bonus since Google often appends ": City"
    const ratio = shorter.length / longer.length;
    if (longer.startsWith(shorter)) return Math.max(90, Math.round(ratio * 100));
    return Math.max(80, Math.round(ratio * 100));
  }

  // Character overlap
  let matches = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i]!)) matches++;
  }
  return Math.round((matches / longer.length) * 100);
}

async function main() {
  const clinicId = process.argv[2];
  if (!clinicId) {
    console.error("Usage: npx tsx scripts/link-places.ts <clinicId>");
    process.exit(1);
  }

  const connectionString = process.env.POSTGRES_URL;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!connectionString) {
    console.error("POSTGRES_URL is required");
    process.exit(1);
  }
  if (!apiKey) {
    console.error("GOOGLE_PLACES_API_KEY is required");
    process.exit(1);
  }

  const sql = postgres(connectionString);

  // Fetch clinic
  const rows =
    await sql`SELECT id, title, city, state, state_abbreviation, street_address, map_latitude, map_longitude, place_id FROM clinics WHERE id = ${clinicId}`;
  if (rows.length === 0) {
    console.error(`Clinic not found: ${clinicId}`);
    await sql.end();
    process.exit(1);
  }

  const clinic = rows[0]!;

  if (clinic.place_id) {
    console.log(
      `Clinic already has placeId: ${clinic.place_id} — nothing to do.`
    );
    await sql.end();
    return;
  }

  const query = `${clinic.title}, ${clinic.city}, ${clinic.state_abbreviation}`;
  console.log(`Searching Google Places: "${query}"`);

  const places = await searchPlaces(apiKey!, query, {
    lat: clinic.map_latitude,
    lng: clinic.map_longitude,
  });

  if (places.length === 0) {
    console.log("No results found. Try searching manually in admin UI.");
    await sql.end();
    return;
  }

  console.log(`\nFound ${places.length} result(s):\n`);
  for (let i = 0; i < places.length; i++) {
    const p = places[i]!;
    const score = fuzzyScore(clinic.title as string, p.displayName.text);
    console.log(`  [${i + 1}] ${p.displayName.text}`);
    console.log(`      Address: ${p.formattedAddress}`);
    console.log(`      Place ID: ${p.id}`);
    console.log(`      Name match: ${score}%`);
    console.log();
  }

  // Auto-select if high confidence
  const topPlace = places[0]!;
  const topScore = fuzzyScore(clinic.title as string, topPlace.displayName.text);

  if (topScore < 80) {
    console.log(
      `Top match score (${topScore}%) is below 80% threshold. Not auto-linking.`
    );
    console.log(
      "To link manually, update the clinic in the admin UI or run:"
    );
    console.log(
      `  UPDATE clinics SET place_id = '<placeId>' WHERE id = '${clinicId}';`
    );
    await sql.end();
    return;
  }

  console.log(
    `Auto-linking top result (${topScore}% match): ${topPlace.displayName.text}`
  );
  await sql`UPDATE clinics SET place_id = ${topPlace.id}, updated_at = NOW() WHERE id = ${clinicId}`;

  console.log(`\nLinked placeId: ${topPlace.id}`);
  console.log(`\nNext: go to /admin/clinics/${clinicId} → Sync tab → run full sync`);

  await sql.end();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
