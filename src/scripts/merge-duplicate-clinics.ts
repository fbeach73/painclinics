// Load environment variables first, before any other imports
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "../lib/db";
import { clinics, clinicClaims, clinicServices } from "../lib/schema";
import { eq, and } from "drizzle-orm";

/**
 * Script to merge duplicate clinics intelligently
 *
 * Duplicates are identified by normalized phone + normalized zip
 * Only merges clinics that:
 * 1. Have the same phone (normalized)
 * 2. Have the same zip (normalized with leading zeros)
 * 3. Have matching addresses (fuzzy match)
 *
 * Merge strategy:
 * - Preserve Google Places ID if available
 * - Prefer published over draft status
 * - Prefer most recent data (higher updatedAt)
 * - Merge services and claims
 */

// Normalize phone number for comparison
function normalizePhone(phone: string | null): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

// Normalize postal code to 5 digits
function normalizeZip(zip: string | null): string {
  if (!zip) return "";
  const cleaned = zip.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (/^\d{4}$/.test(cleaned)) {
    return cleaned.padStart(5, "0");
  }
  return cleaned;
}

// Simple address normalization for comparison
function normalizeAddress(addr1: string | null, addr2: string | null): boolean {
  if (!addr1 || !addr2) return false;
  const clean1 = addr1.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  const clean2 = addr2.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  return clean1 === clean2;
}

interface DuplicateGroup {
  key: string;
  clinics: Array<{
    id: string;
    title: string;
    permalink: string;
    phone: string | null;
    postalCode: string | null;
    streetAddress: string | null;
    placeId: string | null;
    status: string;
    updatedAt: Date | null;
    createdAt: Date | null;
  }>;
}

async function findDuplicateGroups(): Promise<DuplicateGroup[]> {
  const allClinics = await db.select({
    id: clinics.id,
    title: clinics.title,
    permalink: clinics.permalink,
    phone: clinics.phone,
    postalCode: clinics.postalCode,
    streetAddress: clinics.streetAddress,
    placeId: clinics.placeId,
    status: clinics.status,
    updatedAt: clinics.updatedAt,
    createdAt: clinics.createdAt,
  }).from(clinics);

  // Group by normalized phone + zip
  const groups: Record<string, typeof allClinics> = {};

  for (const clinic of allClinics) {
    const normPhone = normalizePhone(clinic.phone);
    const normZip = normalizeZip(clinic.postalCode);
    if (!normPhone || !normZip) continue;

    const key = `${normPhone}-${normZip}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(clinic);
  }

  // Filter to only groups with 2+ clinics, matching addresses, AND matching titles
  const duplicateGroups: DuplicateGroup[] = [];

  for (const [key, clinicList] of Object.entries(groups)) {
    if (clinicList.length < 2) continue;

    // Check if addresses match (handle cases where some might have null addresses)
    const validClinics = clinicList.filter(c => c.streetAddress);
    if (validClinics.length < 2) continue;

    const firstAddress = validClinics[0]?.streetAddress;
    if (!firstAddress) continue;

    const addressMatches = clinicList.filter(c =>
      !c.streetAddress || normalizeAddress(firstAddress, c.streetAddress)
    );

    // Now group by title within address matches
    // This prevents merging different providers at the same location
    const titleGroups: Record<string, typeof addressMatches> = {};
    for (const clinic of addressMatches) {
      const titleKey = clinic.title.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
      if (!titleGroups[titleKey]) {
        titleGroups[titleKey] = [];
      }
      titleGroups[titleKey]!.push(clinic);
    }

    // Only add groups with 2+ clinics having the same title
    for (const [titleKey, clinicsWithTitle] of Object.entries(titleGroups)) {
      if (clinicsWithTitle.length >= 2) {
        duplicateGroups.push({
          key: `${key}-${titleKey.substring(0, 30)}`, // Include title in key for clarity
          clinics: clinicsWithTitle,
        });
      }
    }
  }

  return duplicateGroups;
}

// Choose the best clinic to keep based on multiple factors
function selectBestClinic(groupClinics: DuplicateGroup["clinics"]) {
  // Priority: has Place ID > published status > most recent update
  const ranked = groupClinics.map(c => ({
    clinic: c,
    score: [
      c.placeId ? 100 : 0,           // Has Google Places ID
      c.status === "published" ? 50 : 0,  // Is published
      c.updatedAt?.getTime() || 0,   // Most recent update
    ].reduce((a, b) => a + b, 0),
  }));

  ranked.sort((a, b) => b.score - a.score);
  return ranked[0]?.clinic;
}

async function mergeDuplicates(dryRun = true) {
  console.log("🔍 Finding duplicate clinic groups...\n");

  const groups = await findDuplicateGroups();
  console.log(`📊 Found ${groups.length} duplicate groups to process\n`);

  if (groups.length === 0) {
    console.log("✅ No duplicates found!");
    return;
  }

  let mergedCount = 0;
  let skippedCount = 0;

  for (const group of groups) {
    const bestClinic = selectBestClinic(group.clinics);
    if (!bestClinic) {
      console.log(`\n⚠️  Skipping group: ${group.key} (could not select best clinic)`);
      skippedCount += group.clinics.length;
      continue;
    }

    const duplicates = group.clinics.filter(c => c.id !== bestClinic.id);

    console.log(`\n🔄 Group: ${group.key}`);
    console.log(`   Keeping: [${bestClinic.id}] ${bestClinic.title} (${bestClinic.status})`);
    console.log(`   Permalink: /${bestClinic.permalink}`);
    if (bestClinic.placeId) console.log(`   Place ID: ${bestClinic.placeId}`);

    for (const dup of duplicates) {
      console.log(`   Merging: [${dup.id}] ${dup.title} (${dup.status})`);
      console.log(`     Permalink: /${dup.permalink}, Place ID: ${dup.placeId || "none"}`);
    }

    if (dryRun) {
      console.log(`   ⚠️  DRY RUN - Would merge ${duplicates.length} clinics`);
      mergedCount += duplicates.length;
      continue;
    }

    // Perform the merge
    try {
      // Start a transaction
      await db.transaction(async (tx) => {
        // Move claims from duplicates to the best clinic
        for (const dup of duplicates) {
          await tx
            .update(clinicClaims)
            .set({ clinicId: bestClinic.id })
            .where(eq(clinicClaims.clinicId, dup.id));

          // Move services from duplicates to the best clinic
          const existingServices = await tx
            .select()
            .from(clinicServices)
            .where(eq(clinicServices.clinicId, dup.id));

          for (const serviceLink of existingServices) {
            // Check if this service is already linked to the best clinic
            const existing = await tx
              .select()
              .from(clinicServices)
              .where(
                and(
                  eq(clinicServices.clinicId, bestClinic.id),
                  eq(clinicServices.serviceId, serviceLink.serviceId)
                )
              );

            if (existing.length === 0) {
              // Move the service link
              await tx
                .update(clinicServices)
                .set({ clinicId: bestClinic.id })
                .where(eq(clinicServices.id, serviceLink.id));
            } else {
              // Delete duplicate service link
              await tx
                .delete(clinicServices)
                .where(eq(clinicServices.id, serviceLink.id));
            }
          }

          // Delete the duplicate clinic
          await tx
            .delete(clinics)
            .where(eq(clinics.id, dup.id));
        }

        // Normalize the postal code on the best clinic (add leading zero if needed)
        if (bestClinic.postalCode) {
          const normalizedZip = normalizeZip(bestClinic.postalCode);
          if (normalizedZip !== bestClinic.postalCode && /^\d{5}$/.test(normalizedZip)) {
            await tx
              .update(clinics)
              .set({ postalCode: normalizedZip })
              .where(eq(clinics.id, bestClinic.id));
            }
        }
      });

      mergedCount += duplicates.length;
      console.log(`   ✅ Merged ${duplicates.length} clinics`);
    } catch (err) {
      console.error(`   ❌ Error merging group: ${err}`);
      skippedCount += duplicates.length;
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("📋 SUMMARY:");
  console.log("=".repeat(80));
  console.log(`Duplicate groups processed: ${groups.length}`);
  console.log(`Clinics merged: ${mergedCount}`);
  if (skippedCount > 0) {
    console.log(`Clinics skipped (errors): ${skippedCount}`);
  }
  console.log("=".repeat(80));
}

// Parse command line args
const args = process.argv.slice(2);
const dryRun = !args.includes("--execute");

console.log("=".repeat(80));
console.log("🔧 DUPLICATE CLINIC MERGER");
console.log("=".repeat(80));
console.log(dryRun ? "⚠️  DRY RUN MODE - No changes will be made" : "⚡  EXECUTE MODE - Will merge duplicates");
console.log("Add --execute to perform actual merge");
console.log("=".repeat(80) + "\n");

mergeDuplicates(dryRun)
  .then(() => {
    if (dryRun) {
      console.log("\n✅ Dry run complete! Run with --execute to perform the merge.");
    } else {
      console.log("\n✅ Merge complete!");
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Error:", err);
    process.exit(1);
  });
