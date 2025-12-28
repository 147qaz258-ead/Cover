import { MetadataRoute } from "next";
import { getPlatforms } from "@/lib/platforms/specs";
import { getTemplates } from "@/data/templates";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cover-generator.com";
  const currentDate = new Date();

  // Get all platforms
  const platforms = getPlatforms();

  // Get all templates
  const templates = getTemplates();

  // Base routes
  const routes = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/generate`,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/templates`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ];

  // Platform-specific pages
  const platformPages = platforms.map(platform => ({
    url: `${baseUrl}/platform/${platform.id}`,
    lastModified: currentDate,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Template category pages
  const templateCategories = [
    "minimal",
    "modern",
    "elegant",
    "nature",
    "tech",
    "warm",
    "vintage",
    "gradient",
    "business",
    "artistic",
  ];

  const templateCategoryPages = templateCategories.map(category => ({
    url: `${baseUrl}/templates/${category}`,
    lastModified: currentDate,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Individual template pages (if you have them)
  const templatePages = templates.map(template => ({
    url: `${baseUrl}/templates/${template.id}`,
    lastModified: currentDate,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // Blog/Guide pages (if you have them)
  const guidePages = [
    {
      url: `${baseUrl}/guides/getting-started`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/guides/xiaohongshu-covers`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/guides/wechat-covers`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/guides/douyin-covers`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/guides/image-optimization`,
      lastModified: currentDate,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    },
  ];

  // Combine all routes
  return [
    ...routes,
    ...platformPages,
    ...templateCategoryPages,
    ...templatePages,
    ...guidePages,
  ];
}