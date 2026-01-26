// Load environment variables first, before any imports
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "../lib/db";
import { clinics } from "../lib/schema";

/**
 * Script to find duplicate clinics in the database
 *
 * Duplicates are identified by:
 * 1. Same Google Places ID
 * 2. Same normalized phone number + normalized zip code
 * 3. Same permalink (different zip variations like 07960 vs 7960)
 */

// Normalize phone number for comparison
function normalizePhone(phone: string | null): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

// Normalize postal code for comparison (pad with leading zeros)
function normalizeZip(zip: string | null): string {
  if (!zip) return "";
  const cleaned = zip.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  // Pad 4-digit zips with leading zero
  if (/^\d{4}$/.test(cleaned)) {
    return cleaned.padStart(5, "0");
  }
  return cleaned;
}

async function findDuplicates() {
  console.log("🔍 Finding duplicate clinics...\n");

  // Get all clinics for analysis
  const allClinics = await db.select({
    id: clinics.id,
    title: clinics.title,
    permalink: clinics.permalink,
    placeId: clinics.placeId,
    phone: clinics.phone,
    postalCode: clinics.postalCode,
    city: clinics.city,
    state: clinics.state,
    status: clinics.status,
  }).from(clinics);

  console.log(`📊 Total clinics in database: ${allClinics.length}\n`);

  // Track duplicates
  const duplicatesByPlaceId: Record<string, typeof allClinics> = {};
  const duplicatesByPhoneZip: Record<string, typeof allClinics> = {};
  const duplicatesByPermalinkPattern: Record<string, typeof allClinics> = {};

  // Group by normalized identifiers
  for (const clinic of allClinics) {
    // Group by Google Places ID
    if (clinic.placeId) {
      if (!duplicatesByPlaceId[clinic.placeId]) {
        duplicatesByPlaceId[clinic.placeId] = [];
      }
      duplicatesByPlaceId[clinic.placeId]!.push(clinic);
    }

    // Group by normalized phone + zip
    const normPhone = normalizePhone(clinic.phone);
    const normZip = normalizeZip(clinic.postalCode);
    if (normPhone && normZip) {
      const key = `${normPhone}-${normZip}`;
      if (!duplicatesByPhoneZip[key]) {
        duplicatesByPhoneZip[key] = [];
      }
      duplicatesByPhoneZip[key].push(clinic);
    }

    // Group by permalink pattern (ignoring zip variations)
    // Extract base permalink without zip: pain-management/{title}-{state}-
    const permalinkBase = clinic.permalink?.replace(/-\d{4,5}$/, "") || "";
    if (permalinkBase && permalinkBase.includes("pain-management/")) {
      if (!duplicatesByPermalinkPattern[permalinkBase]) {
        duplicatesByPermalinkPattern[permalinkBase] = [];
      }
      duplicatesByPermalinkPattern[permalinkBase].push(clinic);
    }
  }

  // Report duplicates by Place ID
  const placeIdDups = Object.entries(duplicatesByPlaceId).filter(([_, clinics]) => clinics.length > 1);
  if (placeIdDups.length > 0) {
    console.log("🔄 DUPLICATES BY GOOGLE PLACES ID:");
    console.log("=".repeat(80));
    for (const [placeId, clinics] of placeIdDups) {
      console.log(`\nPlace ID: ${placeId} (${clinics.length} duplicates)`);
      for (const c of clinics) {
        console.log(`  - [${c.id}] ${c.title}`);
        console.log(`    Permalink: /${c.permalink}`);
        console.log(`    Status: ${c.status}`);
        console.log(`    Location: ${c.city}, ${c.state} ${c.postalCode}`);
      }
    }
    console.log(`\nTotal: ${placeIdDups.length} Place ID groups with duplicates`);
  } else {
    console.log("✅ No duplicates by Google Places ID\n");
  }

  // Report duplicates by Phone + Zip
  const phoneZipDups = Object.entries(duplicatesByPhoneZip).filter(([_, clinics]) => clinics.length > 1);
  if (phoneZipDups.length > 0) {
    console.log("\n\n📞 DUPLICATES BY PHONE + ZIP CODE:");
    console.log("=".repeat(80));
    for (const [key, clinics] of phoneZipDups) {
      const [phone, zip] = key.split("-");
      console.log(`\nPhone: ${phone}, Zip: ${zip} (${clinics.length} duplicates)`);
      for (const c of clinics) {
        console.log(`  - [${c.id}] ${c.title}`);
        console.log(`    Permalink: /${c.permalink}`);
        console.log(`    Status: ${c.status}`);
        console.log(`    Original phone: ${c.phone}, zip: ${c.postalCode}`);
        if (c.placeId) console.log(`    Place ID: ${c.placeId}`);
      }
    }
    console.log(`\nTotal: ${phoneZipDups.length} phone+zip groups with duplicates`);
  } else {
    console.log("✅ No duplicates by phone + zip code\n");
  }

  // Report duplicates by permalink pattern (likely zip variations)
  const permalinkDups = Object.entries(duplicatesByPermalinkPattern).filter(([_, clinics]) => clinics.length > 1);
  if (permalinkDups.length > 0) {
    console.log("\n\n🔗 DUPLICATES BY PERMALINK PATTERN (likely zip code variations):");
    console.log("=".repeat(80));
    for (const [base, clinics] of permalinkDups) {
      console.log(`\nBase permalink: ${base}* (${clinics.length} variations)`);
      for (const c of clinics) {
        const zipSuffix = c.permalink?.split("-").pop() || "";
        console.log(`  - [${c.id}] ${c.title}`);
        console.log(`    Full permalink: /${c.permalink}`);
        console.log(`    Status: ${c.status}`);
        console.log(`    Zip suffix: ${zipSuffix}`);
      }
    }
    console.log(`\nTotal: ${permalinkDups.length} permalink patterns with variations`);
  } else {
    console.log("✅ No duplicate permalink variations\n");
  }

  // Summary
  const totalDuplicateRecords =
    placeIdDups.reduce((sum, [_, c]) => sum + c.length - 1, 0) +
    phoneZipDups.reduce((sum, [_, c]) => sum + c.length - 1, 0) +
    permalinkDups.reduce((sum, [_, c]) => sum + c.length - 1, 0);

  console.log("\n" + "=".repeat(80));
  console.log("📋 SUMMARY:");
  console.log("=".repeat(80));
  console.log(`Place ID duplicates: ${placeIdDups.length} groups`);
  console.log(`Phone+Zip duplicates: ${phoneZipDups.length} groups`);
  console.log(`Permalink variations: ${permalinkDups.length} groups`);
  console.log(`\nApproximate duplicate records that could be merged: ${totalDuplicateRecords}`);
  console.log("=".repeat(80));
}

// Run the script
findDuplicates()
  .then(() => {
    console.log("\n✅ Duplicate scan complete!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
