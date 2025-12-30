/**
 * Database cleanup script for service names and icon names
 *
 * Issues to fix:
 * 1. Service names with brackets: ["Neurosurgeon"], "Bariatric surgeon"
 * 2. Icon names in lowercase/kebab-case: scissors, heart-pulse, building-2
 * 3. Checkbox features in clinics with bracket patterns
 *
 * Run with: POSTGRES_URL="..." pnpm tsx src/scripts/cleanup-service-data.ts
 */

import { sql, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { services, clinics } from "@/lib/schema";

// Icon name normalization map (lowercase/kebab-case -> PascalCase)
const ICON_NAME_MAP: Record<string, string> = {
  activity: "Activity",
  bone: "Bone",
  brain: "Brain",
  hand: "Hand",
  target: "Target",
  "building-2": "Building2",
  "heart-pulse": "HeartPulse",
  scissors: "Scissors",
  stethoscope: "Stethoscope",
};

/**
 * Clean up a service name by removing brackets and quotes
 */
function cleanServiceName(name: string): string {
  // Remove leading [" and trailing "]
  const cleaned = name
    .replace(/^\["?/, "") // Remove leading [" or [
    .replace(/"?\]$/, "") // Remove trailing "] or ]
    .replace(/^"/, "") // Remove leading "
    .replace(/"$/, ""); // Remove trailing "

  return cleaned.trim();
}

/**
 * Normalize icon name to PascalCase
 */
function normalizeIconName(iconName: string): string {
  // Check if we have a mapping for this icon name
  if (ICON_NAME_MAP[iconName]) {
    return ICON_NAME_MAP[iconName];
  }
  // Return as-is if already in PascalCase or unknown
  return iconName;
}

/**
 * Create a new slug from the cleaned name
 */
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Clean up checkbox_features array in clinics
 * Removes bracket and quote patterns from array elements
 */
function cleanCheckboxFeatures(features: string[]): string[] {
  return features.map((feature) => {
    // Remove leading [" and trailing "]
    const cleaned = feature
      .replace(/^\["?/, "") // Remove leading [" or [
      .replace(/"?\]$/, "") // Remove trailing "] or ]
      .replace(/^"/, "") // Remove leading "
      .replace(/"$/, ""); // Remove trailing "

    return cleaned.trim();
  });
}

async function main() {
  console.log("Starting database cleanup...\n");

  // 1. Clean up service names and icon names
  console.log("=== Cleaning Services ===");

  const allServices = await db.select().from(services);
  let servicesUpdated = 0;
  let serviceErrors = 0;

  for (const service of allServices) {
    const cleanedName = cleanServiceName(service.name);
    const normalizedIcon = normalizeIconName(service.iconName);

    // Only update if something changed
    if (cleanedName !== service.name || normalizedIcon !== service.iconName) {
      const newSlug = createSlug(cleanedName);

      try {
        await db
          .update(services)
          .set({
            name: cleanedName,
            slug: newSlug,
            iconName: normalizedIcon,
            updatedAt: new Date(),
          })
          .where(eq(services.id, service.id));

        console.log(`Updated service: "${service.name}" -> "${cleanedName}"`);
        if (normalizedIcon !== service.iconName) {
          console.log(`  Icon: "${service.iconName}" -> "${normalizedIcon}"`);
        }
        servicesUpdated++;
      } catch (error) {
        console.error(`Error updating service ${service.id}:`, error);
        serviceErrors++;
      }
    }
  }

  console.log(`\nServices updated: ${servicesUpdated}`);
  console.log(`Errors: ${serviceErrors}`);

  // 2. Clean up checkbox_features in clinics
  console.log("\n=== Cleaning Clinic Checkbox Features ===");

  const clinicsWithFeatures = await db
    .select({
      id: clinics.id,
      title: clinics.title,
      checkboxFeatures: clinics.checkboxFeatures,
    })
    .from(clinics)
    .where(sql`checkbox_features IS NOT NULL`);

  let clinicsUpdated = 0;
  let clinicErrors = 0;

  for (const clinic of clinicsWithFeatures) {
    if (!clinic.checkboxFeatures || clinic.checkboxFeatures.length === 0) {
      continue;
    }

    const cleanedFeatures = cleanCheckboxFeatures(clinic.checkboxFeatures);

    // Check if any features changed
    const hasChanges = clinic.checkboxFeatures.some(
      (f, i) => f !== cleanedFeatures[i]
    );

    if (hasChanges) {
      try {
        await db
          .update(clinics)
          .set({
            checkboxFeatures: cleanedFeatures,
            updatedAt: new Date(),
          })
          .where(eq(clinics.id, clinic.id));

        console.log(`Updated clinic: ${clinic.title}`);
        console.log(`  Before: ${clinic.checkboxFeatures.slice(0, 2).join(", ")}...`);
        console.log(`  After: ${cleanedFeatures.slice(0, 2).join(", ")}...`);
        clinicsUpdated++;
      } catch (error) {
        console.error(`Error updating clinic ${clinic.id}:`, error);
        clinicErrors++;
      }
    }
  }

  console.log(`\nClinics updated: ${clinicsUpdated}`);
  console.log(`Errors: ${clinicErrors}`);

  console.log("\n=== Cleanup Complete ===");
  console.log(`Total services updated: ${servicesUpdated}`);
  console.log(`Total clinics updated: ${clinicsUpdated}`);
}

main()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
