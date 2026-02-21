/**
 * Import crawl4ai extraction results into the database.
 * Normalizes insurance names to canonical providers and populates:
 *   - clinic_insurance junction table
 *   - clinics.payment_methods array
 *
 * Run: pnpm tsx scripts/crawl-insurance/import-results.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import {
  clinics,
  clinicInsurance,
  insuranceProviders as insuranceProvidersTable,
} from "../../src/lib/schema";
import { readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";
config({ path: ".env.local" });

// ============================================
// Fuzzy matching rules: raw extracted name → canonical slug
// ============================================

const INSURANCE_NORMALIZE_MAP: Record<string, string> = {
  // Medicare
  medicare: "medicare",
  "medicare advantage": "medicare",
  "medicare part b": "medicare",
  "medicare supplement": "medicare",
  medigap: "medicare",

  // Medicaid
  medicaid: "medicaid",

  // Blue Cross Blue Shield variants
  "blue cross": "blue-cross",
  "blue cross blue shield": "blue-cross",
  bcbs: "blue-cross",
  "blue shield": "blue-cross",
  "anthem": "blue-cross",
  "anthem blue cross": "blue-cross",
  "anthem bcbs": "blue-cross",
  "carefirst": "blue-cross",
  "carefirst bcbs": "blue-cross",
  "highmark": "blue-cross",
  "highmark bcbs": "blue-cross",
  "horizon blue cross": "blue-cross",
  "independence blue cross": "blue-cross",
  "premera blue cross": "blue-cross",
  "regence blue cross": "blue-cross",
  "blue cross of idaho": "blue-cross",
  "excellus bcbs": "blue-cross",
  "wellmark blue cross": "blue-cross",
  "florida blue": "blue-cross",

  // Aetna
  aetna: "aetna",
  "aetna better health": "aetna",

  // Cigna
  cigna: "cigna",
  "cigna healthcare": "cigna",
  "evernorth": "cigna",

  // United Healthcare
  "united healthcare": "united-healthcare",
  "unitedhealthcare": "united-healthcare",
  uhc: "united-healthcare",
  "united health care": "united-healthcare",
  "united health": "united-healthcare",
  optum: "united-healthcare",
  "oxford health": "united-healthcare",
  "oxford health plans": "united-healthcare",

  // Humana
  humana: "humana",
  "humana gold": "humana",

  // Kaiser Permanente
  kaiser: "kaiser",
  "kaiser permanente": "kaiser",

  // TRICARE
  tricare: "tricare",
  "tricare prime": "tricare",
  "tricare select": "tricare",
  "tricare for life": "tricare",
  triwest: "tricare",
  "triwest healthcare": "tricare",

  // Workers' Compensation
  "workers comp": "workers-comp",
  "workers compensation": "workers-comp",
  "workers' compensation": "workers-comp",
  "worker's compensation": "workers-comp",
  "worker's comp": "workers-comp",
  "work comp": "workers-comp",
  "workman's comp": "workers-comp",
};

// Payment method normalization
const PAYMENT_NORMALIZE_MAP: Record<string, string> = {
  "credit card": "credit-card",
  "credit cards": "credit-card",
  visa: "credit-card",
  mastercard: "credit-card",
  "american express": "credit-card",
  amex: "credit-card",
  discover: "credit-card",
  cash: "cash",
  check: "check",
  checks: "check",
  "personal check": "check",
  "personal checks": "check",
  financing: "financing",
  "payment plan": "financing",
  "payment plans": "financing",
  "monthly payments": "financing",
  carecredit: "financing",
  "care credit": "financing",
  "sliding scale": "sliding-scale",
  "sliding fee": "sliding-scale",
  "income-based": "sliding-scale",
  hsa: "hsa-fsa",
  fsa: "hsa-fsa",
  "hsa/fsa": "hsa-fsa",
  "health savings account": "hsa-fsa",
  "flexible spending": "hsa-fsa",
  "debit card": "debit-card",
  "debit cards": "debit-card",
};

interface ExtractionResult {
  clinicId: string;
  title: string;
  website: string;
  state: string;
  extraction: {
    insuranceProviders: string[];
    otherInsurance: string[];
    paymentMethods: string[];
    acceptsNewPatients: boolean | null;
    confidence: "high" | "medium" | "low" | "none";
  } | null;
  error: string | null;
}

function normalizeInsurance(raw: string): string | null {
  const lower = raw.toLowerCase().trim();
  // Direct match
  if (INSURANCE_NORMALIZE_MAP[lower]) return INSURANCE_NORMALIZE_MAP[lower]!;
  // Partial match
  for (const [key, slug] of Object.entries(INSURANCE_NORMALIZE_MAP)) {
    if (lower.includes(key) || key.includes(lower)) {
      return slug;
    }
  }
  return null;
}

function normalizePaymentMethod(raw: string): string | null {
  const lower = raw.toLowerCase().trim();
  if (PAYMENT_NORMALIZE_MAP[lower]) return PAYMENT_NORMALIZE_MAP[lower]!;
  for (const [key, slug] of Object.entries(PAYMENT_NORMALIZE_MAP)) {
    if (lower.includes(key) || key.includes(lower)) {
      return slug;
    }
  }
  return null;
}

async function main() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_URL environment variable is required");
  }

  const resultsPath = resolve(__dirname, "extraction-results.json");
  let results: ExtractionResult[];
  try {
    results = JSON.parse(readFileSync(resultsPath, "utf-8"));
  } catch {
    console.error(`Error: Could not read ${resultsPath}. Run crawl.py first.`);
    process.exit(1);
  }

  console.log("Connecting to database...");
  const client = postgres(connectionString);
  const db = drizzle(client);

  // Load insurance provider IDs from DB
  const providers = await db
    .select({ id: insuranceProvidersTable.id, slug: insuranceProvidersTable.slug })
    .from(insuranceProvidersTable);

  const slugToProviderId = new Map(providers.map((p) => [p.slug, p.id]));
  console.log(`Loaded ${providers.length} insurance providers from DB`);

  if (providers.length === 0) {
    console.error(
      "No insurance providers in DB! Run: pnpm tsx src/scripts/seed-insurance.ts"
    );
    process.exit(1);
  }

  // Stats
  let totalProcessed = 0;
  let clinicsWithInsurance = 0;
  let clinicsWithPayment = 0;
  let insuranceRowsInserted = 0;
  let paymentMethodsUpdated = 0;
  let skippedNoExtraction = 0;
  let skippedLowConfidence = 0;
  const insuranceCounts = new Map<string, number>();
  const paymentCounts = new Map<string, number>();
  const unmatchedInsurance = new Map<string, number>();

  // Filter to results with extractions
  const validResults = results.filter(
    (r): r is ExtractionResult & { extraction: NonNullable<ExtractionResult["extraction"]> } => {
      if (!r.extraction) {
        skippedNoExtraction++;
        return false;
      }
      if (r.extraction.confidence === "none") {
        skippedLowConfidence++;
        return false;
      }
      return true;
    }
  );

  console.log(`\nTotal results: ${results.length}`);
  console.log(`Valid extractions: ${validResults.length}`);
  console.log(`Skipped (no extraction): ${skippedNoExtraction}`);
  console.log(`Skipped (confidence=none): ${skippedLowConfidence}`);
  console.log(`\nImporting...\n`);

  // Process in batches of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < validResults.length; i += BATCH_SIZE) {
    const batch = validResults.slice(i, i + BATCH_SIZE);

    for (const result of batch) {
      totalProcessed++;
      const { clinicId, extraction } = result;

      // Normalize insurance providers
      const allInsurance = [
        ...extraction.insuranceProviders,
        ...extraction.otherInsurance,
      ];
      const normalizedSlugs = new Set<string>();

      for (const raw of allInsurance) {
        const slug = normalizeInsurance(raw);
        if (slug && slugToProviderId.has(slug)) {
          normalizedSlugs.add(slug);
          insuranceCounts.set(slug, (insuranceCounts.get(slug) || 0) + 1);
        } else if (!slug) {
          unmatchedInsurance.set(raw, (unmatchedInsurance.get(raw) || 0) + 1);
        }
      }

      // Insert insurance junction rows
      if (normalizedSlugs.size > 0) {
        clinicsWithInsurance++;
        for (const slug of normalizedSlugs) {
          const providerId = slugToProviderId.get(slug)!;
          try {
            const inserted = await db
              .insert(clinicInsurance)
              .values({
                clinicId,
                insuranceId: providerId,
              })
              .onConflictDoNothing()
              .returning({ id: clinicInsurance.id });
            if (inserted.length > 0) insuranceRowsInserted++;
          } catch (err) {
            // Foreign key constraint = clinic doesn't exist, skip
          }
        }
      }

      // Normalize payment methods
      const normalizedPayments = new Set<string>();
      for (const raw of extraction.paymentMethods) {
        const slug = normalizePaymentMethod(raw);
        if (slug) {
          normalizedPayments.add(slug);
          paymentCounts.set(slug, (paymentCounts.get(slug) || 0) + 1);
        }
      }

      // Update clinic payment methods
      if (normalizedPayments.size > 0) {
        clinicsWithPayment++;
        try {
          await db
            .update(clinics)
            .set({ paymentMethods: Array.from(normalizedPayments) })
            .where(eq(clinics.id, clinicId));
          paymentMethodsUpdated++;
        } catch {
          // Clinic might not exist
        }
      }
    }

    // Progress
    const pct = ((i + batch.length) / validResults.length * 100).toFixed(1);
    process.stdout.write(
      `\r  Processed ${i + batch.length}/${validResults.length} (${pct}%)`
    );
  }

  console.log("\n\n========================================");
  console.log("Import Results:");
  console.log(`  Total processed: ${totalProcessed}`);
  console.log(`  Clinics with insurance: ${clinicsWithInsurance}`);
  console.log(`  Clinics with payment methods: ${clinicsWithPayment}`);
  console.log(`  Insurance rows inserted: ${insuranceRowsInserted}`);
  console.log(`  Payment methods updated: ${paymentMethodsUpdated}`);
  console.log("========================================");

  console.log("\nInsurance coverage by provider:");
  const sortedInsurance = [...insuranceCounts.entries()].sort(
    (a, b) => b[1] - a[1]
  );
  for (const [slug, count] of sortedInsurance) {
    console.log(`  ${slug}: ${count} clinics`);
  }

  console.log("\nPayment methods breakdown:");
  const sortedPayments = [...paymentCounts.entries()].sort(
    (a, b) => b[1] - a[1]
  );
  for (const [slug, count] of sortedPayments) {
    console.log(`  ${slug}: ${count} clinics`);
  }

  if (unmatchedInsurance.size > 0) {
    console.log("\nTop unmatched insurance names (consider adding to normalize map):");
    const sortedUnmatched = [...unmatchedInsurance.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    for (const [name, count] of sortedUnmatched) {
      console.log(`  "${name}": ${count} occurrences`);
    }
  }

  await client.end();
  console.log("\nImport complete!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
