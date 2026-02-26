import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.painclinics.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pain-management/", "/clinics"],
        disallow: ["/api/", "/admin/", "/dashboard/", "/profile/", "/chat/"],
      },
      {
        userAgent: "GPTBot",
        allow: ["/"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/"],
      },
      {
        userAgent: "Google-Extended",
        allow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
