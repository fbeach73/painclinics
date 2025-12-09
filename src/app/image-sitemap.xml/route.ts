import { NextResponse } from "next/server";
import { getClinicsWithImages } from "@/lib/clinic-queries";

/**
 * Google Image Sitemap
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
 */
export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";
  const clinicsData = await getClinicsWithImages();

  // Filter to clinics that have at least one image
  const clinicsWithImages = clinicsData.filter(
    (c) => c.imageFeatured || c.imageUrl || c.featImage
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${clinicsWithImages
  .map((clinic) => {
    const imageUrl = clinic.imageFeatured || clinic.imageUrl || clinic.featImage;
    const geoLocation = clinic.city && clinic.stateAbbreviation
      ? `${clinic.city}, ${clinic.stateAbbreviation}, USA`
      : null;

    return `  <url>
    <loc>${baseUrl}/${clinic.permalink}/</loc>
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:title>${escapeXml(clinic.title)}</image:title>${geoLocation ? `
      <image:geo_location>${escapeXml(geoLocation)}</image:geo_location>` : ""}
    </image:image>
  </url>`;
  })
  .join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
