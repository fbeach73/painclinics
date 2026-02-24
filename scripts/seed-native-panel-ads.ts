/**
 * Seed native ad campaigns for the native-panel-bottom placement.
 *
 * Run with: POSTGRES_URL="..." pnpm tsx scripts/seed-native-panel-ads.ts
 * Add --dry-run to preview without making changes
 */

import postgres from "postgres";

const isDryRun = process.argv.includes("--dry-run");

const CAMPAIGNS = [
  {
    name: "ECOM - Self Defense Siren",
    advertiser_name: "ECOM / BetterLivingHacks",
    advertiser_url: "https://siren.betterlivinghacks.com",
    notes: "$42 payout. Affiliate link via ecommmkt.com. {clickId} macro in s2.",
    creatives: [
      {
        name: "Siren — Police Urge",
        headline: "Police Are Urging Everyone to Carry This $14 Device",
        body_text: "A 130dB personal safety siren that fits on your keychain. No training needed — just pull the pin.",
        cta_text: "See Why It Works",
        destination_url: "https://ecommmkt.com/?a=3085&c=126196&s2={clickId}",
      },
      {
        name: "Siren — Crime Surge",
        headline: "Violent Crime Up 30% — This Tiny Device Could Save Your Life",
        body_text: "Trusted by law enforcement experts. The pocket-sized siren and strobe that stops attackers cold.",
        cta_text: "Learn More",
        destination_url: "https://ecommmkt.com/?a=3085&c=126196&s2={clickId}",
      },
    ],
  },
  {
    name: "ECOM - Compressa Neuropathy Socks",
    advertiser_name: "ECOM / BetterLivingHacks",
    advertiser_url: "https://socks.betterlivinghacks.com",
    notes: "$42 payout. Neuropathy angle. Affiliate link via ecommmkt.com. {clickId} macro in s2.",
    creatives: [
      {
        name: "Compressa — Neuropathy Relief",
        headline: "Doctors Shocked: Simple Socks Ease Neuropathy Pain in Days",
        body_text: "7-zone compression technology targets nerve pain at the source. No drugs, no prescriptions needed.",
        cta_text: "Try Them Risk-Free",
        destination_url: "https://ecommmkt.com/?a=3085&c=126216&s2={clickId}",
      },
      {
        name: "Compressa — Tingling Feet",
        headline: "Burning, Tingling Feet? This Neuropathy Fix Sells Out Every Week",
        body_text: "Lightweight compression socks worn by 1M+ Americans to fight numbness and swelling — 30-day guarantee.",
        cta_text: "See How They Work",
        destination_url: "https://ecommmkt.com/?a=3085&c=126216&s2={clickId}",
      },
    ],
  },
  {
    name: "Omni - Clinical Trials",
    advertiser_name: "Omni Clinical Research Services",
    advertiser_url: "https://trials.omnicrs.com",
    notes: "CPA offer via omniclinicalrdr.com. {clickId} macro in s2.",
    creatives: [
      {
        name: "Omni — Get Paid $3000",
        headline: "Get Paid Up to $3,000 for Participating in a Clinical Trial",
        body_text: "Free treatment, no insurance required. Over 500,000 patients matched. Studies near you or online.",
        cta_text: "Check Eligibility",
        destination_url: "https://omniclinicalrdr.com/?a=3085&c=150158&p=r&s2={clickId}",
      },
      {
        name: "Omni — Free Treatment",
        headline: "Local Clinical Trials Offering Free Treatment + Up to $3,000 Pay",
        body_text: "No insurance or credit card needed. Find paid studies within 25 miles of your home.",
        cta_text: "Find Trials Near You",
        destination_url: "https://omniclinicalrdr.com/?a=3085&c=150158&p=r&s2={clickId}",
      },
    ],
  },
];

async function main() {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error("POSTGRES_URL environment variable is required");
    process.exit(1);
  }

  const sql = postgres(connectionString);

  console.log(isDryRun ? "DRY RUN MODE\n" : "");

  // Get the native-panel-bottom placement ID
  const [placement] = await sql`
    SELECT id FROM ad_placements WHERE name = 'native-panel-bottom'
  `;
  if (!placement) {
    console.error("Placement 'native-panel-bottom' not found. Run seed-ad-placements.ts first.");
    await sql.end();
    process.exit(1);
  }
  console.log(`Found placement: native-panel-bottom (${placement.id})\n`);

  for (const c of CAMPAIGNS) {
    console.log(`Campaign: ${c.name}`);

    if (isDryRun) {
      console.log(`  Would insert campaign + ${c.creatives.length} creatives + placement assignment`);
      continue;
    }

    // Insert campaign (status = active)
    const rows = await sql`
      INSERT INTO ad_campaigns (id, name, advertiser_name, advertiser_url, notes, status, created_at, updated_at)
      VALUES (
        gen_random_uuid()::text,
        ${c.name},
        ${c.advertiser_name},
        ${c.advertiser_url},
        ${c.notes},
        'active',
        now(),
        now()
      )
      RETURNING id
    `;
    const campaignId = rows[0]!.id as string;
    console.log(`  Campaign ID: ${campaignId}`);

    // Insert creatives
    for (const cr of c.creatives) {
      const crRows = await sql`
        INSERT INTO ad_creatives (
          id, campaign_id, name, creative_type,
          headline, body_text, cta_text, destination_url,
          aspect_ratio, weight, is_active, created_at, updated_at
        )
        VALUES (
          gen_random_uuid()::text,
          ${campaignId},
          ${cr.name},
          'native',
          ${cr.headline},
          ${cr.body_text},
          ${cr.cta_text},
          ${cr.destination_url},
          'auto',
          1,
          true,
          now(),
          now()
        )
        RETURNING id
      `;
      console.log(`  Creative: ${cr.name} (${crRows[0]!.id})`);
    }

    // Assign campaign to native-panel-bottom placement
    await sql`
      INSERT INTO ad_campaign_placements (id, campaign_id, placement_id, weight, created_at)
      VALUES (
        gen_random_uuid()::text,
        ${campaignId},
        ${placement.id},
        1,
        now()
      )
      ON CONFLICT DO NOTHING
    `;
    console.log(`  Assigned to native-panel-bottom`);
  }

  console.log("\nDone!");
  await sql.end();
}

main().catch(console.error);
