import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cover-generator.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/generate",
          "/templates",
          "/about",
          "/guides",
          "/platform",
          "/api/health",
          "/sitemap.xml",
        ],
        disallow: [
          "/api/",
          "/admin",
          "/_next",
          "/static",
          "*.json$",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/"],
        disallow: ["/api/", "/admin"],
      },
      {
        userAgent: "Bingbot",
        allow: ["/"],
        disallow: ["/api/", "/admin"],
      },
      {
        userAgent: "Slurp", // Yahoo
        allow: ["/"],
        disallow: ["/api/", "/admin"],
      },
      {
        userAgent: "DuckDuckBot",
        allow: ["/"],
        disallow: ["/api/", "/admin"],
      },
      {
        userAgent: "Baiduspider",
        allow: ["/"],
        disallow: ["/api/", "/admin"],
      },
      // Block aggressive crawlers
      {
        userAgent: [
          "AhrefsBot",
          "MJ12bot",
          "DotBot",
          "AspiegelBot",
          "SemrushBot",
        ],
        disallow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}