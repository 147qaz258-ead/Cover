import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api/response";
import { CacheFactory, CacheConfigPresets } from "@/lib/cache/cache";
import { z } from "zod";
import { apiRateLimiters } from "@/middleware/rate-limit-middleware";

// Request schemas
const GetCacheRequestSchema = z.object({
  key: z.string().min(1, "Key is required"),
  namespace: z.string().optional().default("default"),
});

const SetCacheRequestSchema = z.object({
  key: z.string().min(1, "Key is required"),
  data: z.any(),
  ttl: z.number().optional().default(3600),
  namespace: z.string().optional().default("default"),
});

const DeleteCacheRequestSchema = z.object({
  key: z.string().min(1, "Key is required"),
  namespace: z.string().optional().default("default"),
});

const ClearCacheRequestSchema = z.object({
  namespace: z.string().optional().default("default"),
  pattern: z.string().optional(),
});

// Get cache instance by namespace
function getCacheInstance(namespace: string) {
  const config = { ...CacheConfigPresets.api };
  return CacheFactory.getInstance(config);
}

// GET - Retrieve from cache
async function handleGet(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { key, namespace } = GetCacheRequestSchema.parse({
      key: searchParams.get("key"),
      namespace: searchParams.get("namespace") || "default",
    });

    const cache = getCacheInstance(namespace);
    const data = await cache.get(key);

    if (data === null) {
      return ApiResponse.error(
        new Error("Cache entry not found or expired"),
        404
      );
    }

    return ApiResponse.success({
      key,
      namespace,
      data,
      found: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponse.error(
        new Error(`Validation error: ${error.errors.map(e => e.message).join(", ")}`),
        400
      );
    }

    console.error("Cache GET error:", error);
    return ApiResponse.error(
      new Error("Failed to retrieve from cache"),
      500
    );
  }
}

// POST - Store in cache
async function handlePost(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, data, ttl, namespace } = SetCacheRequestSchema.parse(body);

    const cache = getCacheInstance(namespace);
    await cache.set(key, data, ttl);

    return ApiResponse.success({
      key,
      namespace,
      ttl,
      cached: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponse.error(
        new Error(`Validation error: ${error.errors.map(e => e.message).join(", ")}`),
        400
      );
    }

    console.error("Cache SET error:", error);
    return ApiResponse.error(
      new Error("Failed to store in cache"),
      500
    );
  }
}

// DELETE - Remove from cache
async function handleDelete(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { key, namespace } = DeleteCacheRequestSchema.parse({
      key: searchParams.get("key"),
      namespace: searchParams.get("namespace") || "default",
    });

    const cache = getCacheInstance(namespace);
    const deleted = await cache.delete(key);

    if (!deleted) {
      return ApiResponse.error(
        new Error("Cache entry not found"),
        404
      );
    }

    return ApiResponse.success({
      key,
      namespace,
      deleted: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponse.error(
        new Error(`Validation error: ${error.errors.map(e => e.message).join(", ")}`),
        400
      );
    }

    console.error("Cache DELETE error:", error);
    return ApiResponse.error(
      new Error("Failed to delete from cache"),
      500
    );
  }
}

// PUT - Clear cache
async function handlePut(request: NextRequest) {
  try {
    const body = await request.json();
    const { namespace, pattern } = ClearCacheRequestSchema.parse(body);

    if (pattern) {
      // Clear by pattern (not implemented in basic cache)
      return ApiResponse.error(
        new Error("Pattern-based clearing not supported"),
        400
      );
    }

    const cache = getCacheInstance(namespace);
    await cache.clear();

    return ApiResponse.success({
      namespace,
      cleared: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponse.error(
        new Error(`Validation error: ${error.errors.map(e => e.message).join(", ")}`),
        400
      );
    }

    console.error("Cache CLEAR error:", error);
    return ApiResponse.error(
      new Error("Failed to clear cache"),
      500
    );
  }
}

// Export with rate limiting
export const GET = apiRateLimiters.cache(handleGet);
export const POST = apiRateLimiters.cache(handlePost);
export const DELETE = apiRateLimiters.cache(handleDelete);
export const PUT = apiRateLimiters.cache(handlePut);