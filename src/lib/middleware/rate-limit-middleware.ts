import { NextRequest, NextResponse } from "next/server";
import { rateLimitByIP, rateLimiters, createRateLimitMiddleware, createCustomRateLimit } from "@/lib/rate-limiting/rate-limiter";

// Rate limiting configuration for different route patterns
export const RATE_LIMIT_RULES = [
  {
    pattern: /^\/api\/generate/,
    limiter: rateLimiters.generate,
    enabled: true,
  },
  {
    pattern: /^\/api\/moderate/,
    limiter: rateLimiters.moderate,
    enabled: true,
  },
  {
    pattern: /^\/api\/analyze/,
    limiter: rateLimiters.analyze,
    enabled: true,
  },
  {
    pattern: /^\/api\/image/,
    limiter: rateLimiters.imageGen,
    enabled: true,
  },
  {
    pattern: /^\/api\/upload/,
    limiter: rateLimiters.upload,
    enabled: true,
  },
  {
    pattern: /^\/api\//, // Catch-all for other API routes
    limiter: rateLimiters.api,
    enabled: true,
  },
];

/**
 * Apply rate limiting to a handler function
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: {
    limiter?: any; // Custom rate limiter
    skipPaths?: string[]; // Paths to skip rate limiting
    enabled?: boolean; // Override global enable flag
  }
) {
  const {
    limiter,
    skipPaths = [],
    enabled: routeEnabled = true,
  } = options || {};

  return async (request: NextRequest) => {
    // Check if rate limiting is globally disabled
    if (process.env.ENABLE_RATE_LIMITING === 'false') {
      return handler(request);
    }

    // Check if route-specific rate limiting is disabled
    if (!routeEnabled) {
      return handler(request);
    }

    // Check if path should be skipped
    const pathname = new URL(request.url).pathname;
    if (skipPaths.some(path => pathname.startsWith(path))) {
      return handler(request);
    }

    try {
      // Apply rate limiting
      const rateLimitResult = await rateLimitByIP(
        request,
        limiter || rateLimiters.api
      );

      if (!rateLimitResult.success) {
        const error = new Error('Rate limit exceeded');
        (error as any).code = 'RATE_LIMIT_EXCEEDED';
        (error as any).retryAfter = rateLimitResult.retryAfter;

        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            retryAfter: rateLimitResult.retryAfter,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimitResult.limit.toString(),
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
              'Retry-After': rateLimitResult.retryAfter?.toString() || '',
            },
          }
        );
      }

      // Call the original handler
      const response = await handler(request);

      // Add rate limit headers to successful response
      response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString());

      return response;
    } catch (error) {
      // Handle rate limit errors
      if ((error as any).code === 'RATE_LIMIT_EXCEEDED') {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: (error as any).message,
            retryAfter: (error as any).retryAfter,
          },
          {
            status: 429,
            headers: {
              'Retry-After': (error as any).retryAfter?.toString() || '',
            },
          }
        );
      }

      // Re-throw other errors
      throw error;
    }
  };
}

/**
 * Middleware factory for API routes
 */
export function createRateLimitedHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
  type: 'generate' | 'moderate' | 'analyze' | 'imageGen' | 'upload' | 'api' = 'api',
  options?: {
    customLimit?: number;
    customWindowMs?: number;
    skipIf?: (req: NextRequest) => boolean;
  }
) {
  const limiter = options?.customLimit
    ? createCustomRateLimit({
      windowMs: options.customWindowMs || 60 * 1000,
      maxRequests: options.customLimit,
      message: 'Rate limit exceeded',
    })
    : rateLimiters[type];

  return withRateLimit(handler, {
    limiter,
    skipPaths: [],
  });
}

/**
 * Rate limiting middleware for API routes
 * Usage in route files:
 * export const { GET, POST } = createRateLimitedRoutes({
 *   GET: generateHandler,
 *   POST: createHandler,
 *   type: 'generate'
 * });
 */
export function createRateLimitedRoutes(
  handlers: {
    GET?: (req: NextRequest) => Promise<NextResponse>;
    POST?: (req: NextRequest) => Promise<NextResponse>;
    PUT?: (req: NextRequest) => Promise<NextResponse>;
    DELETE?: (req: NextRequest) => Promise<NextResponse>;
    PATCH?: (req: NextRequest) => Promise<NextResponse>;
  },
  options?: {
    type?: 'generate' | 'moderate' | 'analyze' | 'imageGen' | 'upload' | 'api';
    customLimit?: number;
    customWindowMs?: number;
    skipIf?: (req: NextRequest) => boolean;
  }
) {
  const wrappedHandlers: Record<string, (req: NextRequest) => Promise<NextResponse>> = {};

  for (const [method, handler] of Object.entries(handlers)) {
    if (handler) {
      wrappedHandlers[method] = createRateLimitedHandler(handler, options?.type, options);
    }
  }

  return wrappedHandlers;
}

/**
 * Check if rate limiting should be applied based on request
 */
export function shouldApplyRateLimit(request: NextRequest): boolean {
  // Skip rate limiting for health checks
  if (new URL(request.url).pathname === '/api/health') {
    return false;
  }

  // Skip if disabled
  if (process.env.ENABLE_RATE_LIMITING === 'false') {
    return false;
  }

  // Skip for internal requests (e.g., from Vercel)
  const userAgent = request.headers.get('user-agent');
  if (userAgent?.includes('vercel')) {
    return false;
  }

  return true;
}

/**
 * Get rate limit information for a specific IP
 */
export async function getRateLimitInfo(
  request: NextRequest,
  type: 'generate' | 'moderate' | 'analyze' | 'imageGen' | 'upload' | 'api' = 'api'
) {
  if (!shouldApplyRateLimit(request)) {
    return null;
  }

  const limiter = rateLimiters[type];
  const status = await rateLimitByIP(request, limiter);

  return {
    limit: status.limit,
    remaining: status.remaining,
    resetTime: status.resetTime,
    resetTimeISO: new Date(status.resetTime).toISOString(),
    retryAfter: status.retryAfter,
  };
}

/**
 * Rate limiting headers utility
 */
export function addRateLimitHeaders(
  response: NextResponse,
  status: {
    limit: number;
    remaining: number;
    resetTime: Date;
  }
): NextResponse {
  response.headers.set('X-RateLimit-Limit', status.limit.toString());
  response.headers.set('X-RateLimit-Remaining', status.remaining.toString());
  response.headers.set('X-RateLimit-Reset', status.resetTime.toISOString());

  return response;
}