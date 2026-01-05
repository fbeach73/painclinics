/**
 * One-time script to set featured clinics
 * Selects top 3 clinics per state based on: rating × log(reviewCount + 1)
 *
 * Run with: POSTGRES_URL="..." npx tsx scripts/set-featured-clinics.ts
 * Add --dry-run to preview without making changes
 */

import postgres from "postgres";

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error("POSTGRES_URL environment variable is required");
    process.exit(1);
  }

  const sql = postgres(connectionString);

  console.log(isDryRun ? "🔍 DRY RUN MODE - No changes will be made\n" : "");

  // Step 1: Clear all existing featured flags
  console.log("Step 1: Clearing all existing featured flags...");

  const currentFeatured = await sql`SELECT count(*) as count FROM clinics WHERE is_featured = true`;
  const featuredCount = currentFeatured[0]?.count ?? 0;
  console.log(`  Currently ${featuredCount} featured clinics`);

  if (!isDryRun) {
    await sql`UPDATE clinics SET is_featured = false WHERE is_featured = true`;
    console.log(`  Cleared all featured flags\n`);
  } else {
    console.log(`  Would clear ${featuredCount} featured clinics\n`);
  }

  // Step 2: Get top 3 clinics per state using window function
  console.log("Step 2: Finding top 3 clinics per state...\n");

  const topClinics = await sql`
    WITH ranked_clinics AS (
      SELECT
        id,
        title,
        state_abbreviation,
        rating,
        review_count,
        rating * ln(review_count + 1) as score,
        ROW_NUMBER() OVER (
          PARTITION BY state_abbreviation
          ORDER BY rating * ln(review_count + 1) DESC
        ) as rank
      FROM clinics
      WHERE state_abbreviation IS NOT NULL
        AND rating IS NOT NULL
        AND review_count IS NOT NULL
        AND review_count > 0
    )
    SELECT id, title, state_abbreviation, rating, review_count, score
    FROM ranked_clinics
    WHERE rank <= 3
    ORDER BY state_abbreviation, rank
  `;

  // Group by state for display
  type ClinicRow = { id: unknown; title: unknown; state_abbreviation: unknown; rating: unknown; review_count: unknown; score: unknown };
  const byState: Record<string, ClinicRow[]> = {};
  for (const clinic of topClinics) {
    const state = clinic.state_abbreviation as string;
    if (!byState[state]) byState[state] = [];
    byState[state]!.push(clinic as ClinicRow);
  }

  console.log("Selected featured clinics:\n");
  for (const state of Object.keys(byState).sort()) {
    console.log(`${state}:`);
    for (const c of byState[state]!) {
      const score = Math.round(Number(c.score) * 100) / 100;
      console.log(`  - ${c.title} (${c.rating}★, ${c.review_count} reviews, score: ${score})`);
    }
  }

  const clinicIds = topClinics.map((c) => c.id as string);
  console.log(`\nStep 3: Marking ${clinicIds.length} clinics as featured across ${Object.keys(byState).length} states...`);

  if (!isDryRun) {
    await sql`UPDATE clinics SET is_featured = true WHERE id = ANY(${clinicIds})`;
    console.log(`✅ Done! ${clinicIds.length} clinics marked as featured.`);
  } else {
    console.log(`\n🔍 DRY RUN: Would mark ${clinicIds.length} clinics as featured.`);
    console.log("Run without --dry-run to apply changes.");
  }

  await sql.end();
}

main().catch(console.error);
