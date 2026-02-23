/**
 * Seed JustAnswer affiliate campaign with native creative.
 *
 * Run with: POSTGRES_URL="..." pnpm tsx scripts/seed-justanswer-campaign.ts
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

  console.log(isDryRun ? "DRY RUN MODE - No changes will be made\n" : "");

  // 1. Create campaign
  const campaignId = crypto.randomUUID();
  const campaignData = {
    id: campaignId,
    name: "JustAnswer — Ask a Doctor",
    advertiserName: "JustAnswer (Vault Media)",
    advertiserUrl: "https://www.justanswer.com",
    status: "paused", // Start paused so you can review before going live
    notes: "Affiliate offer via Vault Media. $20 CPA on $5 customer registration. Native creative targeting clinic pages.",
  };

  console.log(`Creating campaign: ${campaignData.name}`);
  if (!isDryRun) {
    await sql`
      INSERT INTO ad_campaigns (id, name, advertiser_name, advertiser_url, status, notes, created_at, updated_at)
      VALUES (
        ${campaignData.id},
        ${campaignData.name},
        ${campaignData.advertiserName},
        ${campaignData.advertiserUrl},
        ${campaignData.status},
        ${campaignData.notes},
        now(),
        now()
      )
    `;
    console.log(`  Created campaign: ${campaignId}`);
  }

  // 2. Create native creative
  const creativeId = crypto.randomUUID();
  const creativeData = {
    id: creativeId,
    campaignId,
    name: "JustAnswer Native — Ask a Doctor v1",
    creativeType: "native",
    headline: "Ask a Doctor Online Now",
    bodyText: "Get answers from verified doctors in minutes. No appointment needed — start for just $5.",
    ctaText: "Chat with a Doctor",
    // Use {clickId} macro for S2S conversion tracking
    destinationUrl: "https://vaultmediainc10211905.o18.link/c?o=21483674&m=20197&a=628724&aff_click_id={clickId}&sub_aff_id=nativeset1&mo=Doctor_USA",
    aspectRatio: "auto",
    weight: 1,
    isActive: true,
  };

  console.log(`Creating creative: ${creativeData.name}`);
  if (!isDryRun) {
    await sql`
      INSERT INTO ad_creatives (id, campaign_id, name, creative_type, headline, body_text, cta_text, destination_url, aspect_ratio, weight, is_active, created_at, updated_at)
      VALUES (
        ${creativeData.id},
        ${creativeData.campaignId},
        ${creativeData.name},
        ${creativeData.creativeType},
        ${creativeData.headline},
        ${creativeData.bodyText},
        ${creativeData.ctaText},
        ${creativeData.destinationUrl},
        ${creativeData.aspectRatio},
        ${creativeData.weight},
        ${creativeData.isActive},
        now(),
        now()
      )
    `;
    console.log(`  Created creative: ${creativeId}`);
  }

  // 3. Assign to clinic placements that allow native
  const targetPlacements = [
    "clinic-above-fold",    // native allowed
    "clinic-mid-content",   // native allowed
  ];

  console.log(`\nAssigning to ${targetPlacements.length} placements...`);
  for (const placementName of targetPlacements) {
    if (isDryRun) {
      console.log(`  Would assign to: ${placementName}`);
    } else {
      const [placement] = await sql`
        SELECT id FROM ad_placements WHERE name = ${placementName} AND is_active = true
      `;
      if (placement) {
        await sql`
          INSERT INTO ad_campaign_placements (id, campaign_id, placement_id, weight, created_at)
          VALUES (${crypto.randomUUID()}, ${campaignId}, ${placement.id}, 1, now())
          ON CONFLICT DO NOTHING
        `;
        console.log(`  Assigned to: ${placementName}`);
      } else {
        console.log(`  SKIPPED (not found or inactive): ${placementName}`);
      }
    }
  }

  console.log("\nDone! Campaign created as PAUSED.");
  console.log("Go to /admin/ads/campaigns to review and activate.");
  await sql.end();
}

main().catch(console.error);
