import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api/response";
import { CacheFactory, CacheConfigPresets } from "@/lib/cache/cache";
import { getStyleTemplate } from "@/data/templates";
import { apiRateLimiters } from "@/middleware/rate-limit-middleware";

// Cache warming strategies
// 注意：text-analysis 和 title-generation 策略已废弃
// 现在使用 CoverCreativeDirector 合并这些功能
const WARMING_STRATEGIES = {
  // Common templates
  templates: [
    "minimal-clean",
    "modern-bold",
    "elegant-gold",
    "nature-fresh",
    "tech-blue",
  ],
} as const;

async function handleWarmCache(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const strategy = searchParams.get("strategy") || "all";

    const results = {
      warmed: 0,
      skipped: 0,
      errors: 0,
      strategies: {} as Record<string, { items: number; errors: number }>,
    };

    console.log("Starting cache warming with strategy:", strategy);

    // Warm template cache
    if (strategy === "all" || strategy === "templates") {
      results.strategies.templates = { items: 0, errors: 0 };

      for (const templateId of WARMING_STRATEGIES.templates) {
        try {
          const template = getStyleTemplate(templateId);
          if (template) {
            const templateCache = CacheFactory.getInstance(CacheConfigPresets.templates);
            await templateCache.set(`template:${templateId}`, template, 86400);
            results.warmed++;
            results.strategies.templates.items++;
          }
        } catch (error) {
          results.errors++;
          results.strategies.templates.errors++;
          console.error(`Failed to warm template: ${templateId}`, error);
        }
      }
    }

    // Warm common AI responses patterns
    if (strategy === "all" || strategy === "patterns") {
      results.strategies.patterns = { items: 0, errors: 0 };

      const patterns = [
        { key: "sentiment:positive", data: { sentiment: "positive", confidence: 0.9 } },
        { key: "sentiment:negative", data: { sentiment: "negative", confidence: 0.9 } },
        { key: "sentiment:neutral", data: { sentiment: "neutral", confidence: 0.9 } },
        { key: "category:lifestyle", data: { category: "lifestyle", keywords: ["生活", "日常"] } },
        { key: "category:technology", data: { category: "technology", keywords: ["科技", "数码"] } },
        { key: "category:food", data: { category: "food", keywords: ["美食", "料理"] } },
      ];

      const aiCache = CacheFactory.getInstance(CacheConfigPresets.aiResponses);

      for (const pattern of patterns) {
        try {
          await aiCache.set(pattern.key, pattern.data, 3600);
          results.warmed++;
          results.strategies.patterns.items++;
        } catch (error) {
          results.errors++;
          results.strategies.patterns.errors++;
          console.error(`Failed to warm pattern: ${pattern.key}`, error);
        }
      }
    }

    console.log("Cache warming completed:", results);

    return ApiResponse.success({
      strategy,
      results,
      timestamp: new Date().toISOString(),
      warmed: results.warmed,
      errors: results.errors,
    });
  } catch (error) {
    console.error("Cache warming failed:", error);
    return ApiResponse.error(
      new Error("Failed to warm cache"),
      500
    );
  }
}

// Get cache warming status
async function handleGetStatus() {
  try {
    const caches = {
      aiResponses: CacheFactory.getInstance(CacheConfigPresets.aiResponses).getStats(),
      images: CacheFactory.getInstance(CacheConfigPresets.images).getStats(),
      templates: CacheFactory.getInstance(CacheConfigPresets.templates).getStats(),
      api: CacheFactory.getInstance(CacheConfigPresets.api).getStats(),
    };

    const totalStats = {
      hits: Object.values(caches).reduce((sum, cache) => sum + cache.hits, 0),
      misses: Object.values(caches).reduce((sum, cache) => sum + cache.misses, 0),
      entries: Object.values(caches).reduce((sum, cache) => sum + cache.entries, 0),
      memoryUsage: Object.values(caches).reduce((sum, cache) => sum + cache.memoryUsage, 0),
      hitRate: 0,
    };

    totalStats.hitRate = totalStats.hits + totalStats.misses > 0
      ? totalStats.hits / (totalStats.hits + totalStats.misses)
      : 0;

    return ApiResponse.success({
      caches,
      total: totalStats,
      strategies: WARMING_STRATEGIES,
      lastWarming: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to get cache status:", error);
    return ApiResponse.error(
      new Error("Failed to get cache status"),
      500
    );
  }
}

export const POST = apiRateLimiters.cache(handleWarmCache);
export const GET = apiRateLimiters.cache(handleGetStatus);