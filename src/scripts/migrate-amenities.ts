/**
 * Migration script: Migrate clinic checkbox_features to the new services system
 *
 * This script reads the checkbox_features array from each clinic and creates
 * corresponding clinic_services records in the junction table.
 *
 * NOTE: The original plan mentioned "amenities" but the actual service data
 * is stored in checkbox_features (amenities contains facility features like
 * parking, wheelchair access, etc.)
 *
 * Run with: pnpm tsx src/scripts/migrate-amenities.ts
 */

import { db } from "@/lib/db";
import { clinics, services, clinicServices } from "@/lib/schema";
import { eq, isNotNull, sql } from "drizzle-orm";

// Mapping from checkbox_features to service slugs
// Based on actual data in the database:
// - pain_management_services (3731 clinics)
// - physical_therapy (3326 clinics)
// - injection_treatments (2603 clinics)
// - surgery_services (2478 clinics)
// - diagnostic_services (2223 clinics)
// - medication_management (1823 clinics)
// - advanced_treatment_options (421 clinics)
const checkboxFeatureToSlugMap: Record<string, string[]> = {
  // Direct service mappings
  injection_treatments: ["injection-therapy"],
  injection_treatment: ["injection-therapy"],
  physical_therapy: ["physical-therapy"],
  medication_management: ["medication-management"],
  diagnostic_services: ["diagnostic-imaging", "pain-assessment", "emg-nerve-studies"],
  surgery_services: ["kyphoplasty"], // Maps to minimally invasive procedures

  // Broader category mappings
  pain_management_services: [
    "nerve-blocks",
    "spinal-cord-stimulation",
    "radiofrequency-ablation",
  ],
  advanced_treatment_options: [
    "regenerative-medicine",
    "ketamine-infusion",
    "intrathecal-pump",
  ],

  // Note: The following checkbox_features are NOT services:
  // thorough_care, good_doctors, friendly_staff, experienced_doctors,
  // multiple_locations, board_certified_physicians, short_wait_times,
  // long_wait_times, comfortable_waiting_area, telemedicine_available,
  // efficient_service, extended_hours, insurance_accepted,
  // online_appointment_booking, on_site_pharmacy, wheelchair_accessible_facility,
  // cash_credit_payments_accepted, flexible_payment_options, free_parking,
  // convenient_clinic_location, multilingual_staff_available, rude_staff,
  // emergency_appointments, open_7_days_a_week, etc.
};

interface MigrationResult {
  clinicId: string;
  clinicName: string;
  featuresCount: number;
  mappedCount: number;
  servicesAdded: string[];
  unmappedFeatures: string[];
}

interface MigrationSummary {
  totalClinics: number;
  clinicsWithFeatures: number;
  clinicsMigrated: number;
  totalServicesAdded: number;
  unmappedFeatures: Map<string, number>;
  errors: Array<{ clinicId: string; error: string }>;
}

async function migrateCheckboxFeatures(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Starting checkbox_features to services migration...");
  console.log("=".repeat(60));

  // Step 1: Load all services and create slug-to-id map
  console.log("\n📋 Loading services from database...");
  const allServices = await db.select().from(services);
  const slugToServiceId = new Map<string, string>();

  for (const service of allServices) {
    slugToServiceId.set(service.slug, service.id);
  }
  console.log(`   Found ${allServices.length} services`);

  // Step 2: Fetch all clinics with checkbox_features
  console.log("\n📍 Fetching clinics with checkbox_features...");
  const clinicsWithFeatures = await db
    .select({
      id: clinics.id,
      title: clinics.title,
      checkboxFeatures: clinics.checkboxFeatures,
    })
    .from(clinics)
    .where(isNotNull(clinics.checkboxFeatures));

  console.log(`   Found ${clinicsWithFeatures.length} clinics with checkbox_features`);

  if (clinicsWithFeatures.length === 0) {
    console.log("\n✅ No clinics with checkbox_features to migrate.");
    console.log("   Migration complete (no data to process).");
    return;
  }

  // Step 3: Process each clinic
  const summary: MigrationSummary = {
    totalClinics: clinicsWithFeatures.length,
    clinicsWithFeatures: 0,
    clinicsMigrated: 0,
    totalServicesAdded: 0,
    unmappedFeatures: new Map(),
    errors: [],
  };

  const results: MigrationResult[] = [];
  let processedCount = 0;

  for (const clinic of clinicsWithFeatures) {
    const features = (clinic.checkboxFeatures as string[]) || [];
    if (features.length === 0) continue;

    summary.clinicsWithFeatures++;
    processedCount++;

    // Log progress every 500 clinics
    if (processedCount % 500 === 0) {
      console.log(`   Processing clinic ${processedCount}/${clinicsWithFeatures.length}...`);
    }

    const result: MigrationResult = {
      clinicId: clinic.id,
      clinicName: clinic.title,
      featuresCount: features.length,
      mappedCount: 0,
      servicesAdded: [],
      unmappedFeatures: [],
    };

    // Map checkbox_features to service slugs
    const serviceSlugsToAdd = new Set<string>();

    for (const feature of features) {
      const normalized = feature.toLowerCase().trim();
      const slugs = checkboxFeatureToSlugMap[normalized];

      if (slugs) {
        for (const slug of slugs) {
          if (slugToServiceId.has(slug)) {
            serviceSlugsToAdd.add(slug);
          }
        }
      } else {
        // Track unmapped features (excluding known non-service features)
        const nonServiceFeatures = [
          "thorough_care",
          "good_doctors",
          "friendly_staff",
          "experienced_doctors",
          "multiple_locations",
          "board_certified_physicians",
          "short_wait_times",
          "long_wait_times",
          "comfortable_waiting_area",
          "telemedicine_available",
          "efficient_service",
          "extended_hours",
          "insurance_accepted",
          "online_appointment_booking",
          "on_site_pharmacy",
          "wheelchair_accessible_facility",
          "cash_credit_payments_accepted",
          "flexible_payment_options",
          "free_parking",
          "convenient_clinic_location",
          "multilingual_staff_available",
          "rude_staff",
          "emergency_appointments",
          "open_7_days_a_week",
          "no data",
          "no features detected",
          "processing...",
          "state-of-the-art_equipment",
          "accessible_wheelchair_parking",
          "free_wifi_available",
        ];

        if (!nonServiceFeatures.includes(normalized)) {
          result.unmappedFeatures.push(feature);
          const count = summary.unmappedFeatures.get(normalized) || 0;
          summary.unmappedFeatures.set(normalized, count + 1);
        }
      }
    }

    // Insert clinic_services records
    if (serviceSlugsToAdd.size > 0) {
      try {
        const slugArray = Array.from(serviceSlugsToAdd);
        const inserts = slugArray.map((slug, index) => ({
          clinicId: clinic.id,
          serviceId: slugToServiceId.get(slug)!,
          isFeatured: index < 8, // First 8 services are featured
          displayOrder: index,
        }));

        // Use onConflictDoNothing in case services already exist
        await db
          .insert(clinicServices)
          .values(inserts)
          .onConflictDoNothing();

        result.mappedCount = serviceSlugsToAdd.size;
        result.servicesAdded = slugArray;
        summary.clinicsMigrated++;
        summary.totalServicesAdded += serviceSlugsToAdd.size;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        summary.errors.push({ clinicId: clinic.id, error: errorMessage });
        console.error(`   ❌ Error migrating clinic ${clinic.id}: ${errorMessage}`);
      }
    }

    results.push(result);
  }

  // Step 4: Print summary
  console.log("\n" + "=".repeat(60));
  console.log("MIGRATION SUMMARY");
  console.log("=".repeat(60));

  console.log(`\n📊 Statistics:`);
  console.log(`   Total clinics processed:    ${summary.totalClinics}`);
  console.log(`   Clinics with features:      ${summary.clinicsWithFeatures}`);
  console.log(`   Clinics migrated:           ${summary.clinicsMigrated}`);
  console.log(`   Total services linked:      ${summary.totalServicesAdded}`);
  console.log(`   Errors:                     ${summary.errors.length}`);

  if (summary.unmappedFeatures.size > 0) {
    console.log(`\n⚠️  Unmapped service features (${summary.unmappedFeatures.size} unique):`);
    const sortedUnmapped = Array.from(summary.unmappedFeatures.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    for (const [feature, count] of sortedUnmapped) {
      console.log(`   - "${feature}" (${count} occurrences)`);
    }
  }

  if (summary.errors.length > 0) {
    console.log(`\n❌ Errors:`);
    for (const { clinicId, error } of summary.errors.slice(0, 10)) {
      console.log(`   - Clinic ${clinicId}: ${error}`);
    }
    if (summary.errors.length > 10) {
      console.log(`   ... and ${summary.errors.length - 10} more errors`);
    }
  }

  // Step 5: Verification queries
  console.log("\n" + "=".repeat(60));
  console.log("VERIFICATION");
  console.log("=".repeat(60));

  const clinicsWithServicesCount = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${clinicServices.clinicId})` })
    .from(clinicServices);

  const serviceUsage = await db
    .select({
      name: services.name,
      count: sql<number>`COUNT(${clinicServices.id})`,
    })
    .from(services)
    .leftJoin(clinicServices, eq(services.id, clinicServices.serviceId))
    .groupBy(services.id, services.name)
    .orderBy(sql`COUNT(${clinicServices.id}) DESC`);

  console.log(`\n✅ Clinics with services: ${clinicsWithServicesCount[0]?.count || 0}`);
  console.log(`\n📈 Service usage:`);

  for (const { name, count } of serviceUsage) {
    if (Number(count) > 0) {
      console.log(`   - ${name}: ${count} clinics`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Migration complete!");
  console.log("=".repeat(60));
}

// Run the migration
migrateCheckboxFeatures()
  .then(() => {
    console.log("\n✅ Script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  });
