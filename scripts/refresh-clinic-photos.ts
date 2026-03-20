/**
 * Batch refresh clinic photo URLs from Google Places API
 *
 * Targets clinics with BROKEN image URLs only (by default):
 *   - gps-cs-s signed URLs (403 — expired)
 *   - Mangled -N=s1024 suffix URLs (400 — corrupted during original scrape)
 *
 * Usage:
 *   npx tsx scripts/refresh-clinic-photos.ts              # broken URLs only (~328 clinics)
 *   npx tsx scripts/refresh-clinic-photos.ts --all         # all clinics with Place IDs
 *   npx tsx scripts/refresh-clinic-photos.ts --state CA    # only California clinics
 *   npx tsx scripts/refresh-clinic-photos.ts --limit 10    # first N matches
 *   npx tsx scripts/refresh-clinic-photos.ts --dry-run     # preview without updating
 */

import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  // Dynamic imports — must come AFTER dotenv so POSTGRES_URL is available at import time
  const { db } = await import("@/lib/db");
  const { clinics } = await import("@/lib/schema");
  const { isNotNull, eq, and, sql } = await import("drizzle-orm");
  const { GooglePlacesClient } = await import("@/lib/google-places/client");
  const { PlacesRateLimiter } = await import("@/lib/google-places");

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_PLACES_API_KEY is required");
    process.exit(1);
  }

  const client = new GooglePlacesClient(apiKey);
  const limiter = new PlacesRateLimiter({ requestsPerSecond: 5, maxConcurrent: 3 });

  // Parse CLI args
  const args = process.argv.slice(2);
  const stateFilter = args.includes("--state") ? args[args.indexOf("--state") + 1]?.toUpperCase() : null;
  const limitArg = args.includes("--limit") ? parseInt(args[args.indexOf("--limit") + 1] || "0", 10) : 0;
  const dryRun = args.includes("--dry-run");
  const allClinics = args.includes("--all");
  const mode = allClinics ? "ALL clinics" : "BROKEN URLs only";
  console.warn(`Mode: ${mode}${stateFilter ? ` (state: ${stateFilter})` : ""}${dryRun ? " [DRY RUN]" : ""}`);

  const conditions = [isNotNull(clinics.placeId)];

  if (!allClinics) {
    // Target only clinics with known broken URL patterns:
    // 1) gps-cs-s signed URLs (expired, return 403)
    // 2) Mangled URLs with -N=s1024 suffix (corrupted hash, return 400)
    conditions.push(
      sql`(
        EXISTS (SELECT 1 FROM unnest(clinic_image_urls) u(url) WHERE u.url LIKE '%/gps-cs-s/%')
        OR EXISTS (SELECT 1 FROM unnest(clinic_image_urls) u(url) WHERE u.url ~ '-[0-9]+=s1024$')
      )`
    );
  }

  if (stateFilter) {
    conditions.push(eq(clinics.stateAbbreviation, stateFilter));
  }

  const query = db
    .select({
      id: clinics.id,
      title: clinics.title,
      placeId: clinics.placeId,
      clinicImageUrls: clinics.clinicImageUrls,
    })
    .from(clinics)
    .where(and(...conditions))
    .orderBy(clinics.id);

  const rows = limitArg > 0 ? await query.limit(limitArg) : await query;

  console.warn(`Found ${rows.length} clinics to process\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let apiCalls = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const progress = `[${i + 1}/${rows.length}]`;

    try {
      // Fetch place details with photos field
      const placeDetails = await limiter.execute(() =>
        client.getPlaceDetails(row.placeId!, ["photos"])
      );
      apiCalls++;

      if (!placeDetails.photos || placeDetails.photos.length === 0) {
        console.warn(`${progress} ${row.title} — no photos on Google`);
        skipped++;
        continue;
      }

      // Resolve each photo name to a fresh URL
      const photoUrls: string[] = [];
      for (const photo of placeDetails.photos.slice(0, 10)) {
        try {
          const media = await limiter.execute(() =>
            client.getPhotoUri(photo.name, 1920)
          );
          photoUrls.push(media.photoUri);
          apiCalls++;
        } catch {
          // Skip individual photo failures
        }
      }

      if (photoUrls.length === 0) {
        console.warn(`${progress} ${row.title} — all photos failed to resolve`);
        skipped++;
        continue;
      }

      if (dryRun) {
        console.warn(`${progress} ${row.title} — would update ${photoUrls.length} photos (had ${row.clinicImageUrls?.length ?? 0})`);
      } else {
        await db.update(clinics).set({ clinicImageUrls: photoUrls }).where(eq(clinics.id, row.id));
        console.warn(`${progress} ${row.title} — updated ${photoUrls.length} photos`);
      }
      updated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(`${progress} ${row.title} — ERROR: ${msg}`);
      errors++;
    }
  }

  console.warn(`\nDone! Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
  console.warn(`API calls used: ${apiCalls} (est. cost: $${((Math.max(0, apiCalls - 1000) * 0.007)).toFixed(2)})`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
