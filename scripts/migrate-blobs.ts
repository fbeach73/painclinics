/**
 * Migrate Vercel Blob images from one store to another.
 *
 * Usage:
 *   SOURCE_BLOB_TOKEN=vercel_blob_xxx DEST_BLOB_TOKEN=vercel_blob_yyy npx tsx scripts/migrate-blobs.ts
 *
 * Both tokens need read/write access to their respective stores.
 */

import { list, put } from "@vercel/blob";

const SOURCE_TOKEN = process.env.SOURCE_BLOB_TOKEN as string;
const DEST_TOKEN = process.env.DEST_BLOB_TOKEN as string;

if (!SOURCE_TOKEN || !DEST_TOKEN) {
  console.error(
    "Set SOURCE_BLOB_TOKEN and DEST_BLOB_TOKEN environment variables"
  );
  process.exit(1);
}

async function migrate() {
  let cursor: string | undefined;
  let total = 0;
  let migrated = 0;
  let failed = 0;

  do {
    const listing = await list({
      ...(cursor ? { cursor } : {}),
      limit: 100,
      token: SOURCE_TOKEN,
    });

    for (const blob of listing.blobs) {
      total++;
      const { pathname, url } = blob;

      try {
        // Fetch the image from the source store
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`  SKIP ${pathname} — fetch failed (${response.status})`);
          failed++;
          continue;
        }

        const contentType =
          response.headers.get("content-type") || "application/octet-stream";

        // Upload to the destination store with the same pathname
        const result = await put(pathname, response.body!, {
          access: "public",
          contentType,
          token: DEST_TOKEN,
          addRandomSuffix: false,
        });

        console.log(`  OK ${pathname} → ${result.url}`);
        migrated++;
      } catch (err) {
        console.error(`  FAIL ${pathname}:`, (err as Error).message);
        failed++;
      }
    }

    cursor = listing.hasMore ? listing.cursor : undefined;
  } while (cursor);

  console.log(
    `\nDone. ${migrated} migrated, ${failed} failed, ${total} total.`
  );
}

migrate();
