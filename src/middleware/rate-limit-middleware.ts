import { NextRequest, NextResponse } from "next/server";
import { rateLimiters, RateLimitResult } from "@/lib/rate-limiting/rate-limiter";

export interface RateLimitMiddlewareOptions {
  // Rate limiting configuration
  limit?: number;
  windowMs?: number;
  strategy?: 'fixed-window' | 'sliding-window' | 'token-bucket';

  // Custom identifier generator
  keyGenerator?: (req: NextRequest) => string;

  // Custom response for rate limit exceeded
  onLimitExceeded?: (result: RateLimitResult, req: NextRequest) => NextResponse;

  // Skip rate limiting for certain conditions
  skip?: (req: NextRequest) => boolean;

  // Add rate limit headers to response
  addHeaders?: boolean;

  // Log rate limit hits
  log?: boolean;
}

// Default identifier generator using IP address
const defaultKeyGenerator = (req: NextRequest): string => {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIP || "unknown";
  return ip;
};

// Default rate limit exceeded response
const defaultOnLimitExceeded = (result: RateLimitResult): NextResponse => {
  return NextResponse.json(
    {
      error: "Rate limit exceeded",
      message: "Too many requests. Please try again later.",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: result.retryAfter,
      limit: result.limit,
      remaining: result.remaining,
      resetTime: result.resetTime,
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.resetTime.toString(),
        "Retry-After": result.retryAfter?.toString() || "60",
      },
    }
  );
};

/**
 * Middleware to apply rate limiting to API routes
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: RateLimitMiddlewareOptions = {},
  customLimiter?: (identifier: string) => any
): (req: NextRequest) => Promise<NextResponse> {
  const {
    limit,
    windowMs,
    strategy = 'token-bucket',
    keyGenerator = defaultKeyGenerator,
    onLimitExceeded = defaultOnLimitExceeded,
    skip,
    addHeaders = true,
    log = process.env.NODE_ENV === 'development',
  } = options;

  return async (req: NextRequest) => {
    try {
      // Check if rate limiting should be skipped
      if (skip && skip(req)) {
        return handler(req);
      }

      // Get identifier for rate limiting
      const identifier = keyGenerator(req);

      // Use custom limiter or create one based on endpoint
      const limiter = customLimiter
        ? customLimiter(identifier)
        : rateLimiters.generate(identifier);

      // Check rate limit
      const result = await limiter.checkLimit();

      // Log rate limit checks in development
      if (log) {
        console.log('Rate limit check:', {
          identifier,
          allowed: result.allowed,
          remaining: result.remaining,
          totalHits: result.totalHits,
        });
      }

      // Add rate limit headers to successful responses
      const addRateLimitHeaders = (response: NextResponse): NextResponse => {
        if (addHeaders) {
          response.headers.set("X-RateLimit-Limit", result.limit.toString());
          response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
          response.headers.set("X-RateLimit-Reset", result.resetTime.toString());

          if (result.retryAfter) {
            response.headers.set("Retry-After", result.retryAfter.toString());
          }
        }
        return response;
      };

      // Handle rate limit exceeded
      if (!result.allowed) {
        const rateLimitResponse = onLimitExceeded(result, req);
        return addRateLimitHeaders(rateLimitResponse);
      }

      // Proceed with request
      const response = await handler(req);
      return addRateLimitHeaders(response);
    } catch (error) {
      console.error("Rate limiting middleware error:", error);
      // If rate limiting fails, allow the request to proceed
      return handler(req);
    }
  };
}

/**
 * Higher-order function to create rate-limited API handlers
 */
export function createRateLimitedHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: RateLimitMiddlewareOptions
) {
  return withRateLimit(handler, options);
}

/**
 * Pre-configured rate limiters for different API endpoints
 */
export const apiRateLimiters = {
  // Generate endpoint - very strict rate limiting
  generate: (handler: (req: NextRequest) => Promise<NextResponse>) =>
    createRateLimitedHandler(handler, {
      limit: 5,
      windowMs: 60 * 1000, // 5 requests per minute
      strategy: 'token-bucket',
      onLimitExceeded: (result) => NextResponse.json(
        {
          error: "Generation rate limit exceeded",
          message: "You can only generate 5 covers per minute. Please wait before trying again.",
          code: "GENERATION_RATE_LIMIT",
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": result.remaining.toString(),
            "X-RateLimit-Reset": result.resetTime.toString(),
            "Retry-After": (result.retryAfter || 60).toString(),
          },
        }
      ),
    }),

  // Moderate endpoint - moderate rate limiting
  moderate: (handler: (req: NextRequest) => Promise<NextResponse>) =>
    createRateLimitedHandler(handler, {
      limit: 20,
      windowMs: 60 * 1000, // 20 requests per minute
      strategy: 'fixed-window',
    }),

  // Templates endpoint - lenient rate limiting
  templates: (handler: (req: NextRequest) => Promise<NextResponse>) =>
    createRateLimitedHandler(handler, {
      limit: 30,
      windowMs: 60 * 1000, // 30 requests per minute
      strategy: 'sliding-window',
    }),

  // Health endpoint - very lenient
  health: (handler: (req: NextRequest) => Promise<NextResponse>) =>
    createRateLimitedHandler(handler, {
      limit: 100,
      windowMs: 60 * 1000, // 100 requests per minute
      strategy: 'fixed-window',
    }),

  // Generic API endpoint
  api: (handler: (req: NextRequest) => Promise<NextResponse>) =>
    createRateLimitedHandler(handler, {
      limit: 10,
      windowMs: 60 * 1000, // 10 requests per minute
      strategy: 'token-bucket',
    }),

  // Cache endpoint - moderate rate limiting
  cache: (handler: (req: NextRequest) => Promise<NextResponse>) =>
    createRateLimitedHandler(handler, {
      limit: 50,
      windowMs: 60 * 1000, // 50 requests per minute
      strategy: 'sliding-window',
    }),
};

/**
 * Rate limit configuration based on user type
 */
export const userBasedRateLimits = {
  // Anonymous users (IP-based)
  anonymous: {
    generate: { limit: 3, windowMs: 60 * 1000 },
    moderate: { limit: 10, windowMs: 60 * 1000 },
    templates: { limit: 20, windowMs: 60 * 1000 },
  },

  // Authenticated users (user ID-based)
  authenticated: {
    generate: { limit: 10, windowMs: 60 * 1000 },
    moderate: { limit: 50, windowMs: 60 * 1000 },
    templates: { limit: 100, windowMs: 60 * 1000 },
  },

  // Premium users
  premium: {
    generate: { limit: 50, windowMs: 60 * 1000 },
    moderate: { limit: 200, windowMs: 60 * 1000 },
    templates: { limit: 500, windowMs: 60 * 1000 },
  },
};

/**
 * Create rate limiter based on user type
 */
export function createUserBasedRateLimiter(
  userType: keyof typeof userBasedRateLimits,
  endpoint: keyof typeof userBasedRateLimits.anonymous
) {
  const config = userBasedRateLimits[userType][endpoint];

  return (identifier: string) => ({
    checkLimit: async () => ({
      allowed: true,
      remaining: config.limit - 1,
      resetTime: Date.now() + config.windowMs,
      totalHits: 1,
      limit: config.limit,
    }),
  });
}