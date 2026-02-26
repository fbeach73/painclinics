import type { MetadataRoute } from "next";

// Revalidate sitemap every hour (3600 seconds)
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com";

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
    {
      url: `${baseUrl}/pain-management`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/treatment-options`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/treatment-options/regenerative-orthopedic-medicine`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/pain-tracking`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
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
    const { getAllBlogPostsForSitemap } = await import("@/lib/blog/blog-queries");

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

    // Blog post pages
    const allBlogPosts = await getAllBlogPostsForSitemap();
    const blogPages: MetadataRoute.Sitemap = allBlogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt || new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    // High-value filter combo URLs for state pages
    // These create indexable landing pages for common specialty searches
    const highValueSpecialties = [
      "injection-therapy",
      "physical-therapy",
      "nerve-blocks",
      "medication-management",
      "spinal-cord-stimulation",
    ];
    const filterPages: MetadataRoute.Sitemap = allStates.flatMap((state) =>
      highValueSpecialties.map((specialty) => ({
        url: `${baseUrl}/pain-management/${state.toLowerCase()}/?specialty=${specialty}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }))
    );

    return [...staticPages, ...statePages, ...cityPages, ...clinicPages, ...blogPages, ...filterPages];
  } catch (error) {
    console.warn("Sitemap: Database unavailable, returning static pages only:", error);
    return staticPages;
  }
}
