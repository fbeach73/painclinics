import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";

  // Static pages (always included)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/clinics`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Try to get dynamic pages from database
  // If database is unavailable (e.g., CI build), return only static pages
  try {
    const {
      getAllClinicPermalinks,
      getAllStatesWithClinics,
      getAllCityPermalinks,
    } = await import("@/lib/clinic-queries");

    // State landing pages
    const allStates = await getAllStatesWithClinics();
    const statePages: MetadataRoute.Sitemap = allStates.map((state) => ({
      url: `${baseUrl}/pain-management/${state.toLowerCase()}/`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));

    // City landing pages
    const allCities = await getAllCityPermalinks();
    const cityPages: MetadataRoute.Sitemap = allCities
      .filter((c) => c.state && c.city)
      .map((c) => ({
        url: `${baseUrl}/pain-management/${c.state}/${c.city}/`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));

    // Dynamic clinic pages from database
    const allClinics = await getAllClinicPermalinks();
    const clinicPages: MetadataRoute.Sitemap = allClinics.map((clinic) => ({
      url: `${baseUrl}/${clinic.permalink}/`,
      lastModified: clinic.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...statePages, ...cityPages, ...clinicPages];
  } catch (error) {
    console.warn("Sitemap: Database unavailable, returning static pages only:", error);
    return staticPages;
  }
}
