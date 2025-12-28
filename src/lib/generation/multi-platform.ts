import { CoverGenerationRequest, CoverGenerationResult } from "@/types";
import { getPlatform } from "@/lib/platforms/specs";
import { adaptTemplateForPlatform } from "@/data/templates/platform-templates";
import { generateCover } from "@/lib/ai/pipeline/cover-pipeline";

export interface MultiPlatformRequest extends Omit<CoverGenerationRequest, "platforms"> {
  platforms: string[];
  applyPlatformAdaptations?: boolean;
}

export interface MultiPlatformGenerationOptions {
  parallel?: boolean;
  maxConcurrency?: number;
  failFast?: boolean;
}

export interface MultiPlatformResult {
  results: CoverGenerationResult[];
  errors: Array<{
    platformId: string;
    error: string;
  }>;
  totalPlatforms: number;
  successCount: number;
  failureCount: number;
}

/**
 * Generate covers for multiple platforms with platform-specific adaptations
 */
export async function generateMultiPlatformCovers(
  request: MultiPlatformRequest,
  options: MultiPlatformGenerationOptions = {}
): Promise<MultiPlatformResult> {
  const {
    platforms,
    applyPlatformAdaptations = true,
  } = request;

  const {
    parallel = true,
    maxConcurrency = 3,
    failFast = false,
  } = options;

  const results: CoverGenerationResult[] = [];
  const errors: Array<{ platformId: string; error: string }> = [];

  // Validate all platforms exist
  const validPlatforms = platforms.filter(platformId => {
    const platform = getPlatform(platformId);
    if (!platform) {
      errors.push({
        platformId,
        error: `Platform ${platformId} not found`,
      });
      return false;
    }
    return true;
  });

  if (validPlatforms.length === 0) {
    return {
      results: [],
      errors,
      totalPlatforms: platforms.length,
      successCount: 0,
      failureCount: platforms.length,
    };
  }

  // Generate covers for each platform
  if (parallel) {
    // Parallel generation with concurrency limit
    const chunks = chunkArray(validPlatforms, maxConcurrency);

    for (const chunk of chunks) {
      const promises = chunk.map(async (platformId) => {
        try {
          const platform = getPlatform(platformId)!;

          // Apply platform-specific adaptations
          let adaptedRequest: CoverGenerationRequest;
          if (applyPlatformAdaptations) {
            adaptedRequest = await adaptRequestForPlatform(request, platformId);
          } else {
            adaptedRequest = {
              ...request,
              platforms: [platformId],
            };
          }

          const result = await generateCover(adaptedRequest);
          return result;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";

          if (failFast) {
            throw new Error(`Failed to generate for platform ${platformId}: ${errorMessage}`);
          }

          errors.push({
            platformId,
            error: errorMessage,
          });
          return null;
        }
      });

      const chunkResults = await Promise.all(promises);
      results.push(...chunkResults.filter(Boolean) as CoverGenerationResult[]);
    }
  } else {
    // Sequential generation
    for (const platformId of validPlatforms) {
      try {
        const platform = getPlatform(platformId)!;

        // Apply platform-specific adaptations
        let adaptedRequest: CoverGenerationRequest;
        if (applyPlatformAdaptations) {
          adaptedRequest = await adaptRequestForPlatform(request, platformId);
        } else {
          adaptedRequest = {
            ...request,
            platforms: [platformId],
          };
        }

        const result = await generateCover(adaptedRequest);
        results.push(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        if (failFast) {
          throw new Error(`Failed to generate for platform ${platformId}: ${errorMessage}`);
        }

        errors.push({
          platformId,
          error: errorMessage,
        });
      }
    }
  }

  return {
    results,
    errors,
    totalPlatforms: platforms.length,
    successCount: results.length,
    failureCount: errors.length,
  };
}

/**
 * Adapt a generation request for a specific platform
 */
async function adaptRequestForPlatform(
  request: Omit<MultiPlatformRequest, "platforms">,
  platformId: string
): Promise<CoverGenerationRequest> {
  const platform = getPlatform(platformId);
  if (!platform) {
    throw new Error(`Platform ${platformId} not found`);
  }

  // Get platform-specific template adaptations
  const platformTemplate = adaptTemplateForPlatform(platformId, request.styleTemplate);

  // Adjust text content for platform constraints
  const adaptedText = adaptTextForPlatform(request.text, platform);

  // Apply platform-specific customizations
  const customizations = {
    ...request.customizations,
    ...(platformTemplate?.adaptations || {}),
    platformSpecific: {
      aspectRatio: platform.aspectRatio,
      dimensions: platform.dimensions,
      maxFileSize: platform.maxFileSize,
    },
  };

  return {
    text: adaptedText,
    platforms: [platformId],
    styleTemplate: request.styleTemplate,
    customizations,
  };
}

/**
 * Adapt text content for platform-specific constraints
 */
function adaptTextForPlatform(text: string, platform: any): string {
  // Adjust text length based on platform
  const maxLength = getMaxTextLength(platform.id);
  if (text.length > maxLength) {
    // Truncate text while preserving complete sentences
    const sentences = text.split(/[。！？.!?]/);
    let adaptedText = "";

    for (const sentence of sentences) {
      if (adaptedText.length + sentence.length + 1 <= maxLength) {
        adaptedText += (adaptedText ? "。" : "") + sentence;
      } else {
        break;
      }
    }

    return adaptedText || text.substring(0, maxLength) + "...";
  }

  return text;
}

/**
 * Get maximum text length for a platform
 */
function getMaxTextLength(platformId: string): number {
  const limits: Record<string, number> = {
    "xiaohongshu": 500,
    "xiaohongshu-vertical": 800,
    "wechat": 300,
    "wechat-banner": 100,
    "taobao": 200,
    "taobao-banner": 150,
    "douyin": 600,
    "weibo": 280,
    "bilibili": 400,
    "zhihu": 350,
  };

  return limits[platformId] || 500;
}

/**
 * Batch optimize images for multiple platforms
 */
export async function optimizeForMultiPlatform(
  baseImage: string,
  platforms: string[]
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  for (const platformId of platforms) {
    const platform = getPlatform(platformId);
    if (!platform) continue;

    // Here you would implement platform-specific image optimization
    // For now, return the base image for all platforms
    results[platformId] = baseImage;
  }

  return results;
}

/**
 * Validate multi-platform request
 */
export function validateMultiPlatformRequest(
  request: MultiPlatformRequest
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!request.platforms || request.platforms.length === 0) {
    errors.push("At least one platform must be specified");
  }

  if (request.platforms.length > 10) {
    errors.push("Cannot generate for more than 10 platforms at once");
  }

  // Check for duplicate platforms
  const uniquePlatforms = new Set(request.platforms);
  if (uniquePlatforms.size !== request.platforms.length) {
    errors.push("Duplicate platforms specified");
  }

  // Validate each platform exists
  for (const platformId of request.platforms) {
    const platform = getPlatform(platformId);
    if (!platform) {
      errors.push(`Platform ${platformId} is not supported`);
    }
  }

  if (request.text.length < 10) {
    errors.push("Text must be at least 10 characters long");
  }

  if (request.text.length > 10000) {
    errors.push("Text cannot exceed 10000 characters");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get platform generation priorities
 */
export function getPlatformGenerationOrder(platformIds: string[]): string[] {
  // Sort platforms by typical generation time (fastest first)
  const priorities: Record<string, number> = {
    "xiaohongshu": 1,
    "wechat-banner": 2,
    "taobao": 3,
    "zhihu": 4,
    "weibo": 5,
    "wechat": 6,
    "bilibili": 7,
    "douyin": 8,
    "xiaohongshu-vertical": 9,
    "taobao-banner": 10,
  };

  return platformIds.sort((a, b) => {
    const aPriority = priorities[a] || 999;
    const bPriority = priorities[b] || 999;
    return aPriority - bPriority;
  });
}

/**
 * Utility function to chunk array into smaller arrays
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}