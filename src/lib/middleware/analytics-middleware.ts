import { NextRequest } from "next/server";
import { analytics, AnalyticsClient } from "@/lib/analytics/analytics";
import { v4 as uuidv4 } from "uuid";

export interface AnalyticsMiddlewareOptions {
  // Enable/disable tracking
  enabled?: boolean;

  // Track specific events
  trackPerformance?: boolean;
  trackErrors?: boolean;
  trackEndpointUsage?: boolean;

  // Custom event properties
  customProperties?: (req: NextRequest, duration: number, success: boolean) => Record<string, any>;

  // Sampling
  sampleRate?: number;

  // Excluded endpoints
  excludePatterns?: string[];
}

/**
 * Middleware to add analytics tracking to API routes
 */
export function withAnalytics<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  options: AnalyticsMiddlewareOptions = {}
): T {
  const {
    enabled = process.env.ENABLE_ANALYTICS === "true",
    trackPerformance = true,
    trackErrors = true,
    trackEndpointUsage = true,
    customProperties,
    sampleRate = 1,
    excludePatterns = ["/api/health", "/api/cache"],
  } = options;

  return (async function (this: any, ...args: any[]) {
    const req = args[0] as NextRequest;
    const startTime = Date.now();

    // Check if analytics is enabled
    if (!enabled) {
      return handler.apply(this, args);
    }

    // Check sampling rate
    if (Math.random() > sampleRate) {
      return handler.apply(this, args);
    }

    // Check if endpoint should be excluded
    const url = new URL(req.url);
    const shouldExclude = excludePatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      return regex.test(url.pathname);
    });

    if (shouldExclude) {
      return handler.apply(this, args);
    }

    // Extract request metadata
    const requestMetadata = {
      method: req.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      userAgent: req.headers.get("user-agent"),
      referer: req.headers.get("referer"),
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
    };

    let success = true;
    let error: Error | null = null;

    try {
      // Execute the handler
      const result = await handler.apply(this, args);

      // Track successful request
      if (trackEndpointUsage) {
        const duration = Date.now() - startTime;
        const properties = {
          ...requestMetadata,
          duration,
          status: 200,
          ...customProperties?.(req, duration, true),
        };

        analytics.track("api_request", properties);
      }

      if (trackPerformance) {
        const duration = Date.now() - startTime;
        analytics.trackPerformance({
          endpoint: `${req.method} ${url.pathname}`,
          responseTime: duration,
          statusCode: 200,
          cacheHit: false, // This could be detected from response headers
          provider: "api",
          model: "none",
          memoryUsage: 0, // This would need to be measured
        });
      }

      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err : new Error("Unknown error");

      // Track error
      if (trackErrors) {
        const duration = Date.now() - startTime;
        const properties = {
          ...requestMetadata,
          duration,
          status: 500,
          error_name: error.name,
          error_message: error.message,
          ...customProperties?.(req, duration, false),
        };

        analytics.track("api_error", properties);
        analytics.trackError(error, {
          endpoint: `${req.method} ${url.pathname}`,
          ...requestMetadata,
        });
      }

      // Re-throw the error
      throw error;
    }
  }) as T;
}

/**
 * Higher-order function for easy analytics integration
 */
export function createAnalyticsHandler<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  options?: AnalyticsMiddlewareOptions
): T {
  return withAnalytics(handler, options);
}

/**
 * Analytics decorator for class methods
 */
export function trackAnalytics(options: AnalyticsMiddlewareOptions = {}) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (this: any, ...args: any[]) {
      const startTime = Date.now();
      const { enabled = process.env.ENABLE_ANALYTICS === "true" } = options;

      if (!enabled) {
        return method.apply(this, args);
      }

      try {
        const result = await method.apply(this, args);

        // Track successful method execution
        analytics.track("method_called", {
          class: target.constructor.name,
          method: propertyName,
          duration: Date.now() - startTime,
          success: true,
        });

        return result;
      } catch (error) {
        // Track method error
        analytics.track("method_error", {
          class: target.constructor.name,
          method: propertyName,
          duration: Date.now() - startTime,
          success: false,
          error_name: error instanceof Error ? error.name : "Unknown",
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Initialize analytics for the application
 * 支持服务端和客户端初始化
 */
export function initializeAppAnalytics() {
  // 服务端初始化使用控制台输出
  const isServer = typeof window === "undefined";

  const config = {
    provider: (process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER as any) || "console",
    sampleRate: parseFloat(process.env.NEXT_PUBLIC_ANALYTICS_SAMPLE_RATE || "1"),
    apiUrl: process.env.NEXT_PUBLIC_ANALYTICS_API_URL,
    apiKey: process.env.NEXT_PUBLIC_ANALYTICS_API_KEY,
    batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE || "10"),
    flushInterval: parseInt(process.env.ANALYTICS_FLUSH_INTERVAL || "30000"),
    anonymizeIp: process.env.ANALYTICS_ANONYMIZE_IP === "true",
    anonymizeUserAgent: process.env.ANALYTICS_ANONYMIZE_UA === "true",
    excludeBots: process.env.ANALYTICS_EXCLUDE_BOTS === "true",
  };

  // 检查是否是机器人（仅客户端）
  if (!isServer && config.excludeBots) {
    const userAgent = navigator.userAgent.toLowerCase();
    const bots = ["bot", "crawler", "spider", "scraper"];
    const isBot = bots.some(bot => userAgent.includes(bot));

    if (isBot) {
      console.log("Bot detected, analytics disabled");
      return;
    }
  }

  try {
    const { initializeAnalytics } = require("@/lib/analytics/analytics");
    const client = initializeAnalytics(config);

    // 仅在客户端自动追踪页面访问
    if (!isServer) {
      client.track("page_view", {
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer,
      });

      // Track route changes (for SPA)
      let lastPath = window.location.pathname;
      const observer = new MutationObserver(() => {
        const currentPath = window.location.pathname;
        if (currentPath !== lastPath) {
          client.track("page_view", {
            path: currentPath,
            title: document.title,
          });
          lastPath = currentPath;
        }
      });

      observer.observe(document, { subtree: true, childList: true });
    } else {
      console.log("[Analytics] 服务端 Analytics 已初始化");
    }
  } catch (error) {
    console.error("Failed to initialize analytics:", error);
  }
}

/**
 * React hook for analytics tracking
 */
export function useAnalytics() {
  return {
    track: (event: string, properties?: Record<string, any>) => {
      try {
        require("@/lib/analytics/analytics").analytics.track(event, properties);
      } catch (error) {
        console.error("Analytics not available:", error);
      }
    },

    trackFeature: (feature: string, properties?: Record<string, any>) => {
      try {
        require("@/lib/analytics/analytics").analytics.trackFeature(feature, properties);
      } catch (error) {
        console.error("Analytics not available:", error);
      }
    },

    trackExperiment: (experiment: string, variant: string, properties?: Record<string, any>) => {
      try {
        require("@/lib/analytics/analytics").analytics.trackExperiment(experiment, variant, properties);
      } catch (error) {
        console.error("Analytics not available:", error);
      }
    },

    setUserId: (userId: string) => {
      try {
        require("@/lib/analytics/analytics").analytics.setUserId(userId);
      } catch (error) {
        console.error("Analytics not available:", error);
      }
    },
  };
}