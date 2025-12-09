import { upload } from "@/lib/storage";

/**
 * Result from processing clinic images
 */
export interface ProcessedImages {
  imageUrl: string | null;
  clinicImageUrls: string[];
  errors: string[];
}

/**
 * Download an image from a URL and re-upload to our storage
 * @param url - External image URL to download
 * @param clinicId - Clinic ID for organizing files
 * @param suffix - Filename suffix (e.g., "featured", "gallery-0")
 * @returns New storage URL or null if download failed
 */
async function downloadAndUpload(
  url: string,
  clinicId: string,
  suffix: string
): Promise<string | null> {
  try {
    // Skip invalid URLs
    if (!url || !url.startsWith("http")) {
      return null;
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ClinicImporter/1.0)",
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      console.warn(`Failed to download image: ${url} (${response.status})`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      console.warn(`Not an image: ${url} (${contentType})`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Determine file extension from URL or content-type
    let ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() || "";
    if (!["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
      // Fallback to content-type
      const mimeExt: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "image/webp": "webp",
        "image/svg+xml": "svg",
      };
      ext = mimeExt[contentType] || "jpg";
    }

    const filename = `${clinicId}-${suffix}.${ext}`;
    const result = await upload(buffer, filename, "clinic-images");
    return result.url;
  } catch (error) {
    console.warn(`Error processing image ${url}:`, error);
    return null;
  }
}

/**
 * Process all images for a clinic - download from external URLs and upload to our storage
 * @param imageUrl - Main/featured image URL
 * @param clinicImageUrls - Array of gallery image URLs
 * @param clinicId - Clinic ID for organizing files
 * @returns ProcessedImages with new URLs
 */
export async function processClinicImages(
  imageUrl: string | null,
  clinicImageUrls: string[] | null,
  clinicId: string
): Promise<ProcessedImages> {
  const result: ProcessedImages = {
    imageUrl: null,
    clinicImageUrls: [],
    errors: [],
  };

  // Process featured image
  if (imageUrl) {
    const uploaded = await downloadAndUpload(imageUrl, clinicId, "featured");
    if (uploaded) {
      result.imageUrl = uploaded;
    } else {
      result.errors.push(`Failed to process featured image: ${imageUrl}`);
    }
  }

  // Process gallery images
  if (clinicImageUrls && clinicImageUrls.length > 0) {
    const uploadPromises = clinicImageUrls.map((url, i) =>
      downloadAndUpload(url, clinicId, `gallery-${i}`)
    );

    const uploadedUrls = await Promise.all(uploadPromises);

    uploadedUrls.forEach((url, i) => {
      if (url) {
        result.clinicImageUrls.push(url);
      } else {
        result.errors.push(
          `Failed to process gallery image ${i}: ${clinicImageUrls[i]}`
        );
      }
    });
  }

  return result;
}

/**
 * Batch process images for multiple clinics with rate limiting
 * @param clinics - Array of clinic objects with image URLs
 * @param concurrency - Number of concurrent downloads (default: 5)
 * @param onProgress - Optional callback for progress updates
 */
export async function batchProcessImages<
  T extends {
    id: string;
    imageUrl: string | null;
    clinicImageUrls: string[] | null;
  }
>(
  clinics: T[],
  concurrency: number = 5,
  onProgress?: (completed: number, total: number) => void
): Promise<
  Map<string, { imageUrl: string | null; clinicImageUrls: string[] }>
> {
  const results = new Map<
    string,
    { imageUrl: string | null; clinicImageUrls: string[] }
  >();
  let completed = 0;

  // Process in batches
  for (let i = 0; i < clinics.length; i += concurrency) {
    const batch = clinics.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (clinic) => {
        const processed = await processClinicImages(
          clinic.imageUrl,
          clinic.clinicImageUrls,
          clinic.id
        );
        return {
          id: clinic.id,
          imageUrl: processed.imageUrl,
          clinicImageUrls: processed.clinicImageUrls,
        };
      })
    );

    batchResults.forEach((result) => {
      results.set(result.id, {
        imageUrl: result.imageUrl,
        clinicImageUrls: result.clinicImageUrls,
      });
    });

    completed += batch.length;
    onProgress?.(completed, clinics.length);

    // Small delay between batches to avoid rate limiting
    if (i + concurrency < clinics.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Check if an image URL is accessible
 * @param url - Image URL to check
 * @returns True if the image is accessible
 */
export async function isImageAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
