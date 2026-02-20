/**
 * One-time bulk IndexNow submission for all published clinics.
 * Run with: pnpm tsx scripts/indexnow-bulk-submit.ts
 *
 * Submits all published clinic URLs to Bing/Yandex via IndexNow.
 * Safe to re-run — IndexNow ignores duplicates.
 */

import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/lib/schema";

config({ path: ".env.local" });

const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const POSTGRES_URL = process.env.POSTGRES_URL;
const SITE_URL = "https://painclinics.com";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const BATCH_SIZE = 10000;
const DELAY_MS = 2000; // 2s between batches to be polite

async function main() {
  if (!INDEXNOW_KEY) {
    console.error("❌ INDEXNOW_KEY is not set in .env.local");
    process.exit(1);
  }
  if (!POSTGRES_URL) {
    console.error("❌ POSTGRES_URL is not set in .env.local");
    process.exit(1);
  }

  console.log("🔗 Connecting to database...");
  const client = postgres(POSTGRES_URL);
  const db = drizzle(client, { schema });

  console.log("📋 Fetching all published clinic URLs...");
  const publishedClinics = await db
    .select({ permalink: schema.clinics.permalink })
    .from(schema.clinics)
    .where(eq(schema.clinics.status, "published"));

  const urls = publishedClinics
    .filter((c) => c.permalink)
    .map((c) => `${SITE_URL}/${c.permalink}`);

  console.log(`✅ Found ${urls.length} published clinics`);

  if (urls.length === 0) {
    console.log("Nothing to submit.");
    return;
  }

  // Split into batches of 10,000
  const batches: string[][] = [];
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    batches.push(urls.slice(i, i + BATCH_SIZE));
  }

  console.log(`📤 Submitting in ${batches.length} batch(es) of up to ${BATCH_SIZE}...\n`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]!;
    const batchNum = i + 1;

    console.log(`  Batch ${batchNum}/${batches.length}: ${batch.length} URLs...`);

    const body = {
      host: "painclinics.com",
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: batch,
    };

    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      console.log(`  ✅ Batch ${batchNum} accepted (HTTP ${res.status})`);
    } else {
      const text = await res.text().catch(() => "");
      console.error(`  ❌ Batch ${batchNum} failed: ${res.status} ${res.statusText} — ${text}`);
    }

    // Delay between batches
    if (i < batches.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\n🎉 Done! Submitted ${urls.length} URLs to IndexNow.`);
  console.log("Bing typically processes submissions within a few hours.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
