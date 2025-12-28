// Rate limiting strategies and implementations
export interface RateLimitConfig {
  identifier: string; // IP, user ID, API key, etc.
  limit: number; // Maximum requests
  windowMs: number; // Time window in milliseconds
  strategy?: 'fixed-window' | 'sliding-window' | 'token-bucket';
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (identifier: string) => string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  totalHits: number;
  retryAfter?: number;
  limit: number;
}

// In-memory storage for rate limiting (fallback for development)
class MemoryStore {
  private store: Map<string, { count: number; resetTime: number; tokens?: number; lastRefill?: number }>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.store = new Map();
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.store.entries()) {
        if (value.resetTime < now) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }

  async increment(key: string, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || existing.resetTime < now) {
      // New window
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return {
        allowed: true,
        remaining: 1,
        resetTime: now + windowMs,
        totalHits: 1,
        limit: 1,
      };
    }

    // Existing window
    const newCount = existing.count + 1;
    this.store.set(key, {
      ...existing,
      count: newCount,
    });

    return {
      allowed: newCount <= 1,
      remaining: Math.max(0, 1 - newCount),
      resetTime: existing.resetTime,
      totalHits: newCount,
      limit: 1,
    };
  }

  async setTokens(key: string, tokens: number, windowMs: number): Promise<void> {
    this.store.set(key, {
      count: 0,
      resetTime: Date.now() + windowMs,
      tokens,
      lastRefill: Date.now(),
    });
  }

  async consumeToken(key: string, tokens: number, refillRate: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing) {
      await this.setTokens(key, tokens, windowMs);
      return {
        allowed: true,
        remaining: tokens - 1,
        resetTime: now + windowMs,
        totalHits: 1,
        limit: tokens,
      };
    }

    // Refill tokens based on time elapsed
    const timeSinceLastRefill = now - (existing.lastRefill || now);
    const tokensToAdd = Math.floor((timeSinceLastRefill / windowMs) * refillRate);
    const currentTokens = Math.min(tokens, (existing.tokens || 0) + tokensToAdd);

    if (currentTokens < tokens) {
      return {
        allowed: false,
        remaining: currentTokens,
        resetTime: now + windowMs,
        totalHits: existing.count,
        limit: tokens,
        retryAfter: Math.ceil((tokens - currentTokens) / refillRate * windowMs),
      };
    }

    // Consume tokens
    const remainingTokens = currentTokens - tokens;
    this.store.set(key, {
      ...existing,
      tokens: remainingTokens,
      lastRefill: now,
      count: existing.count + 1,
    });

    return {
      allowed: true,
      remaining: remainingTokens,
      resetTime: now + windowMs,
      totalHits: existing.count + 1,
      limit: tokens,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Redis store for production (placeholder - would implement actual Redis client)
class RedisStore {
  // This would be implemented with actual Redis client
  async increment(): Promise<RateLimitResult> {
    throw new Error("Redis not implemented in this demo");
  }

  async consumeToken(): Promise<RateLimitResult> {
    throw new Error("Redis not implemented in this demo");
  }
}

// Rate limiter implementation
export class RateLimiter {
  private store: MemoryStore | RedisStore;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      strategy: 'fixed-window',
      ...config,
    };

    // Use memory store for now, would switch to Redis in production
    this.store = new MemoryStore();
  }

  async checkLimit(): Promise<RateLimitResult> {
    const key = this.config.keyGenerator
      ? this.config.keyGenerator(this.config.identifier)
      : `rate-limit:${this.config.identifier}`;

    switch (this.config.strategy) {
      case 'fixed-window':
        return this.checkFixedWindow(key);
      case 'sliding-window':
        return this.checkSlidingWindow(key);
      case 'token-bucket':
        return this.checkTokenBucket(key);
      default:
        throw new Error(`Unknown rate limiting strategy: ${this.config.strategy}`);
    }
  }

  private async checkFixedWindow(key: string): Promise<RateLimitResult> {
    const result = await this.store.increment(key, this.config.windowMs);

    return {
      allowed: result.totalHits <= this.config.limit,
      remaining: Math.max(0, this.config.limit - result.totalHits),
      resetTime: result.resetTime,
      totalHits: result.totalHits,
      limit: this.config.limit,
    };
  }

  private async checkSlidingWindow(key: string): Promise<RateLimitResult> {
    // Simplified sliding window implementation
    // In production, would use Redis with sorted sets for accurate sliding window
    return this.checkFixedWindow(key);
  }

  private async checkTokenBucket(key: string): Promise<RateLimitResult> {
    const tokensPerSecond = this.config.limit / (this.config.windowMs / 1000);
    return this.store.consumeToken(
      key,
      1,
      tokensPerSecond,
      this.config.windowMs
    );
  }

  // Convenience methods
  static create(config: RateLimitConfig): RateLimiter {
    return new RateLimiter(config);
  }

  // Predefined configurations
  static perMinute(identifier: string, limit: number = 10): RateLimiter {
    return RateLimiter.create({
      identifier,
      limit,
      windowMs: 60 * 1000,
      strategy: 'fixed-window',
    });
  }

  static perHour(identifier: string, limit: number = 100): RateLimiter {
    return RateLimiter.create({
      identifier,
      limit,
      windowMs: 60 * 60 * 1000,
      strategy: 'sliding-window',
    });
  }

  static perDay(identifier: string, limit: number = 1000): RateLimiter {
    return RateLimiter.create({
      identifier,
      limit,
      windowMs: 24 * 60 * 60 * 1000,
      strategy: 'sliding-window',
    });
  }

  static apiEndpoint(identifier: string, endpoint: string): RateLimiter {
    const limits: Record<string, { limit: number; windowMs: number }> = {
      '/api/generate': { limit: 5, windowMs: 60 * 1000 }, // 5 requests per minute
      '/api/moderate': { limit: 20, windowMs: 60 * 1000 }, // 20 requests per minute
      '/api/templates': { limit: 30, windowMs: 60 * 1000 }, // 30 requests per minute
      '/api/health': { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
      default: { limit: 10, windowMs: 60 * 1000 }, // 10 requests per minute
    };

    const config = limits[endpoint] || limits.default;

    return RateLimiter.create({
      identifier,
      limit: config.limit,
      windowMs: config.windowMs,
      strategy: 'token-bucket',
      keyGenerator: (id) => `api:${endpoint}:${id}`,
    });
  }
}

// Export singleton instances for common use cases
export const rateLimiters = {
  generate: (identifier: string) => RateLimiter.apiEndpoint(identifier, '/api/generate'),
  moderate: (identifier: string) => RateLimiter.apiEndpoint(identifier, '/api/moderate'),
  templates: (identifier: string) => RateLimiter.apiEndpoint(identifier, '/api/templates'),
  health: (identifier: string) => RateLimiter.apiEndpoint(identifier, '/api/health'),
  analyze: (identifier: string) => RateLimiter.apiEndpoint(identifier, '/api/analyze'),
  imageGen: (identifier: string) => RateLimiter.apiEndpoint(identifier, '/api/image'),
  upload: (identifier: string) => RateLimiter.apiEndpoint(identifier, '/api/upload'),
  api: (identifier: string) => RateLimiter.apiEndpoint(identifier, '/api'),
};

/**
 * Rate limit by IP address from NextRequest
 */
export async function rateLimitByIP(
  request: { headers: { get: (name: string) => string | null }; ip?: string },
  limiterFactory: (identifier: string) => RateLimiter
): Promise<RateLimitResult & { success: boolean }> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || request.ip
    || 'unknown';

  const limiter = limiterFactory(ip);
  const result = await limiter.checkLimit();

  return {
    ...result,
    success: result.allowed,
  };
}

/**
 * Create a rate limit middleware factory
 */
export function createRateLimitMiddleware(
  type: keyof typeof rateLimiters = 'api'
) {
  return async (request: { headers: { get: (name: string) => string | null }; ip?: string }) => {
    const limiterFactory = rateLimiters[type];
    return rateLimitByIP(request, limiterFactory);
  };
}

/**
 * Create a custom rate limit configuration
 */
export function createCustomRateLimit(config: {
  windowMs: number;
  maxRequests: number;
  message: string;
}) {
  return (identifier: string) => RateLimiter.create({
    identifier,
    limit: config.maxRequests,
    windowMs: config.windowMs,
    strategy: 'fixed-window',
  });
}