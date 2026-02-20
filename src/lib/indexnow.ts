/**
 * IndexNow integration for fast URL indexing on Bing, Yandex, etc.
 * Docs: https://www.indexnow.org/documentation
 */

const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const SITE_URL = "https://painclinics.com";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * Submit URLs to IndexNow for immediate indexing.
 * Fire-and-forget safe — logs errors but never throws.
 * Max 10,000 URLs per call per IndexNow spec.
 */
export async function pingIndexNow(urls: string[]): Promise<void> {
  if (!INDEXNOW_KEY) {
    console.warn("[IndexNow] INDEXNOW_KEY not set, skipping submission");
    return;
  }

  if (urls.length === 0) return;

  // Chunk into batches of 10,000 (IndexNow limit)
  const chunks = chunkArray(urls, 10000);

  for (const chunk of chunks) {
    try {
      const body = {
        host: "painclinics.com",
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: chunk,
      };

      const res = await fetch(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error(
          `[IndexNow] Submission failed: ${res.status} ${res.statusText}`
        );
      } else {
        console.warn(`[IndexNow] Submitted ${chunk.length} URLs (status ${res.status})`);
      }
    } catch (err) {
      console.error("[IndexNow] Network error during submission:", err);
    }
  }
}

/**
 * Build a full URL from a clinic permalink.
 * Permalink format: "pain-management/clinic-slug"
 */
export function clinicUrl(permalink: string): string {
  return `${SITE_URL}/${permalink}`;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
