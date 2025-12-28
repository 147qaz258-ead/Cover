import { ICache, CacheKeyGenerator, CacheFactory, CacheConfigPresets } from "./cache";

// Cache configuration for decorators
export interface CacheDecoratorOptions {
  ttl?: number;
  keyPrefix?: string;
  version?: string;
  tags?: string[];
  condition?: (...args: any[]) => boolean;
  invalidateOn?: string[];
}

/**
 * Decorator to cache function results
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
  options: CacheDecoratorOptions = {}
) {
  const {
    ttl,
    keyPrefix = "fn",
    version = "v1",
    tags = [],
    condition,
    invalidateOn = [],
  } = options;

  // Get appropriate cache instance
  const cache = CacheFactory.getInstance(CacheConfigPresets.api);

  return function (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;

    descriptor.value = (async function (this: any, ...args: any[]) {
      // Check condition if provided
      if (condition && !condition.call(this, ...args)) {
        return method.apply(this, args);
      }

      // Generate cache key
      const cacheKey = CacheKeyGenerator.generate(
        { args },
        {
          prefix: `${keyPrefix}:${propertyName}`,
          version,
          tags,
        }
      );

      // Try to get from cache
      const cached = await cache.get(cacheKey);
      if (cached !== null) {
        console.debug(`Cache hit: ${cacheKey}`);
        return cached;
      }

      // Execute function
      console.debug(`Cache miss: ${cacheKey}`);
      const result = await method.apply(this, args);

      // Cache the result
      await cache.set(cacheKey, result, ttl);

      return result;
    }) as T;

    return descriptor;
  };
}

/**
 * Decorator for AI model calls with smart caching
 */
export function aiCached(options: {
  provider: string;
  model: string;
  ttl?: number;
  cacheResults?: boolean;
} = { provider: "openai", model: "gpt-4", cacheResults: true }) {
  const { provider, model, ttl, cacheResults = true } = options;

  if (!cacheResults) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      // No caching - just add logging
      const method = descriptor.value;
      descriptor.value = async function (this: any, ...args: any[]) {
        console.debug(`AI call (no cache): ${provider}/${model}`);
        return method.apply(this, args);
      };
      return descriptor;
    };
  }

  const cache = CacheFactory.getInstance(CacheConfigPresets.aiResponses);

  return function (
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<(prompt: string, ...args: any[]) => Promise<any>>
  ) {
    const method = descriptor.value!;

    descriptor.value = async function (this: any, prompt: string, ...args: any[]) {
      // Generate cache key based on prompt and model
      const cacheKey = CacheKeyGenerator.aiResponse(provider, model, prompt, {
        args,
      });

      // Try to get from cache
      const cached = await cache.get(cacheKey);
      if (cached !== null) {
        console.debug(`AI response cache hit: ${cacheKey}`);
        return cached;
      }

      // Execute AI call
      console.debug(`AI response cache miss: ${cacheKey}`);
      const result = await method.call(this, prompt, ...args);

      // Cache the result
      await cache.set(cacheKey, result, ttl || 3600); // Default 1 hour

      return result;
    };

    return descriptor;
  };
}

/**
 * Cache invalidation utilities
 */
export class CacheInvalidator {
  private cache: ICache;
  private patterns: Map<string, RegExp> = new Map();

  constructor(cache: ICache) {
    this.cache = cache;
  }

  // Register invalidation patterns
  registerPattern(name: string, pattern: string): void {
    this.patterns.set(name, new RegExp(pattern.replace(/\*/g, ".*")));
  }

  // Invalidate by pattern
  async invalidateByPattern(patternName: string): Promise<number> {
    const regex = this.patterns.get(patternName);
    if (!regex) return 0;

    const keys = await this.cache.keys();
    const matchingKeys = keys.filter(key => regex.test(key));

    for (const key of matchingKeys) {
      await this.cache.delete(key);
    }

    return matchingKeys.length;
  }

  // Invalidate by tags
  async invalidateByTag(tag: string): Promise<number> {
    const keys = await this.cache.keys(`*:${tag}:*`);
    let count = 0;

    for (const key of keys) {
      if (await this.cache.delete(key)) {
        count++;
      }
    }

    return count;
  }

  // Invalidate specific entry
  async invalidate(key: string): Promise<boolean> {
    return await this.cache.delete(key);
  }

  // Clear all cache
  async clear(): Promise<void> {
    await this.cache.clear();
  }
}

// Global cache invalidator instance
export const globalInvalidator = new CacheInvalidator(
  CacheFactory.getInstance(CacheConfigPresets.api)
);

// Register common invalidation patterns
globalInvalidator.registerPattern("ai-responses", "ai:v1:*");
globalInvalidator.registerPattern("images", "img:v1:*");
globalInvalidator.registerPattern("templates", "template:v1:*");
globalInvalidator.registerPattern("specs", "specs:v1:*");

/**
 * Middleware for Next.js API routes with caching
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  options: {
    ttl?: number;
    keyGenerator?: (req: Request) => string;
    condition?: (req: Request) => boolean;
    invalidateOn?: string[];
  } = {}
): T {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => {
      const url = new URL(req.url);
      return `api:${url.pathname}:${url.search}`;
    },
    condition = () => true,
    invalidateOn = [],
  } = options;

  const cache = CacheFactory.getInstance(CacheConfigPresets.api);

  return (async function (this: any, ...args: any[]) {
    const req = args[0] as Request;

    // Check condition
    if (!condition(req)) {
      return handler.apply(this, args);
    }

    // Only cache GET requests
    if (req.method !== "GET") {
      return handler.apply(this, args);
    }

    const cacheKey = keyGenerator(req);

    // Try cache
    const cached = await cache.get(cacheKey) as { body?: string; status?: number; headers?: Record<string, string> } | null;
    if (cached !== null && cached.body) {
      console.debug(`API cache hit: ${cacheKey}`);
      // Clone the cached response to avoid issues
      return new Response(cached.body, cached as ResponseInit);
    }

    // Execute handler
    console.debug(`API cache miss: ${cacheKey}`);
    const response = await handler.apply(this, args);

    // Cache successful responses
    if (response.ok && response.status === 200) {
      const clonedResponse = response.clone();
      const cacheData = {
        body: await clonedResponse.text(),
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };

      await cache.set(cacheKey, cacheData, ttl);
    }

    return response;
  }) as T;
}

/**
 * Cache warming utilities
 */
export class CacheWarmer {
  private cache: ICache;

  constructor(cache: ICache) {
    this.cache = cache;
  }

  // Warm cache with predefined data
  async warmWithPatterns(patterns: Array<{
    key: string;
    data: any;
    ttl?: number;
  }>): Promise<void> {
    for (const pattern of patterns) {
      await this.cache.set(pattern.key, pattern.data, pattern.ttl);
    }
  }

  // Warm AI responses with common prompts
  async warmAIResponses(): Promise<void> {
    const aiCache = CacheFactory.getInstance(CacheConfigPresets.aiResponses);

    // Common text analysis prompts
    const commonPrompts = [
      "Extract key topics from this text",
      "Generate a title for social media",
      "Analyze the sentiment of this content",
      "Summarize the main points",
    ];

    for (const prompt of commonPrompts) {
      const key = CacheKeyGenerator.aiResponse("openai", "gpt-4", prompt);
      // Cache empty results - they'll be populated on first use
      await aiCache.set(key, { cached: true, warming: true }, 3600);
    }
  }

  // Warm template cache
  async warmTemplates(): Promise<void> {
    const templateCache = CacheFactory.getInstance(CacheConfigPresets.templates);

    // Common template analyses
    const commonTemplates = [
      { templateId: "xiaohongshu-default", text: "Sample text" },
      { templateId: "instagram-square", text: "Sample text" },
      { templateId: "wechat-moments", text: "Sample text" },
    ];

    for (const template of commonTemplates) {
      const key = CacheKeyGenerator.templateAnalysis(
        template.templateId,
        template.text
      );
      await templateCache.set(key, { cached: true, warming: true }, 86400);
    }
  }
}