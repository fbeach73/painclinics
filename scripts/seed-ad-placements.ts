/**
 * Seed default ad placement slots and global ad settings.
 *
 * Run with: POSTGRES_URL="..." pnpm tsx scripts/seed-ad-placements.ts
 * Add --dry-run to preview without making changes
 */

import postgres from "postgres";

const isDryRun = process.argv.includes("--dry-run");

const DEFAULT_PLACEMENTS = [
  {
    name: "clinic-below-header",
    label: "Clinic Page — Below Header (ATF)",
    page_type: "clinic",
    description: "Full-width ad between hero section and services, visible above the fold on desktop",
    default_width: 728,
    default_height: 90,
  },
  {
    name: "clinic-above-fold",
    label: "Clinic Page — Above Fold",
    page_type: "clinic",
    description: "Below breadcrumbs on clinic detail page",
    default_width: 728,
    default_height: 90,
  },
  {
    name: "clinic-mid-content",
    label: "Clinic Page — Mid Content",
    page_type: "clinic",
    description: "Between content sections on clinic detail page",
    default_width: 728,
    default_height: 90,
  },
  {
    name: "directory-in-list",
    label: "Directory — In List",
    page_type: "directory",
    description: "After 3rd clinic card in state/city listings",
    default_width: null,
    default_height: null,
  },
  {
    name: "homepage-mid",
    label: "Homepage — Mid Page",
    page_type: "homepage",
    description: "Between featured section and popular searches",
    default_width: 728,
    default_height: 90,
  },
  {
    name: "blog-mid-content",
    label: "Blog — Mid Content",
    page_type: "blog",
    description: "Mid-content in blog posts",
    default_width: 728,
    default_height: 90,
  },
];

async function main() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error("POSTGRES_URL environment variable is required");
    process.exit(1);
  }

  const sql = postgres(connectionString);

  console.log(isDryRun ? "DRY RUN MODE - No changes will be made\n" : "");

  // Seed placements
  console.log(`Seeding ${DEFAULT_PLACEMENTS.length} ad placements...`);

  for (const p of DEFAULT_PLACEMENTS) {
    if (isDryRun) {
      console.log(`  Would insert: ${p.name} (${p.label})`);
    } else {
      await sql`
        INSERT INTO ad_placements (id, name, label, page_type, description, default_width, default_height, is_active, created_at, updated_at)
        VALUES (
          gen_random_uuid()::text,
          ${p.name},
          ${p.label},
          ${p.page_type},
          ${p.description},
          ${p.default_width},
          ${p.default_height},
          true,
          now(),
          now()
        )
        ON CONFLICT (name) DO NOTHING
      `;
      console.log(`  Inserted: ${p.name}`);
    }
  }

  // Seed global ad settings (single row, id=1)
  console.log("\nSeeding ad_settings (ad_server_percentage = 0)...");

  if (isDryRun) {
    console.log("  Would insert ad_settings row with id=1, ad_server_percentage=0");
  } else {
    await sql`
      INSERT INTO ad_settings (id, ad_server_percentage, updated_at)
      VALUES (1, 0, now())
      ON CONFLICT (id) DO NOTHING
    `;
    console.log("  Inserted ad_settings row");
  }

  console.log("\nDone!");
  await sql.end();
}

main().catch(console.error);
