import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://painclinics.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pain-management/", "/clinics"],
        disallow: ["/api/", "/admin/", "/dashboard/", "/profile/", "/chat/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
