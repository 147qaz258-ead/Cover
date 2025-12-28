"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  isLimited: boolean;
}

export interface UseRateLimitOptions {
  // Poll rate limit status
  pollInterval?: number;

  // Custom headers to read
  headers?: {
    limit?: string;
    remaining?: string;
    reset?: string;
    retryAfter?: string;
  };

  // Callback when rate limit is hit
  onRateLimitHit?: (info: RateLimitInfo) => void;

  // Callback when rate limit is recovered
  onRateLimitRecovered?: (info: RateLimitInfo) => void;
}

/**
 * Hook to track rate limiting status for API requests
 */
export function useRateLimit(options: UseRateLimitOptions = {}) {
  const {
    pollInterval = 5000, // Poll every 5 seconds
    headers = {
      limit: "X-RateLimit-Limit",
      remaining: "X-RateLimit-Remaining",
      reset: "X-RateLimit-Reset",
      retryAfter: "Retry-After",
    },
    onRateLimitHit,
    onRateLimitRecovered,
  } = options;

  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestRef = useRef<number | null>(null);

  // Parse rate limit headers from response
  const parseRateLimitHeaders = useCallback((response: Response): RateLimitInfo | null => {
    const limit = response.headers.get(headers.limit || "X-RateLimit-Limit");
    const remaining = response.headers.get(headers.remaining || "X-RateLimit-Remaining");
    const reset = response.headers.get(headers.reset || "X-RateLimit-Reset");
    const retryAfter = response.headers.get(headers.retryAfter || "Retry-After");

    if (!limit || !remaining || !reset) {
      return null;
    }

    return {
      limit: parseInt(limit),
      remaining: parseInt(remaining),
      resetTime: parseInt(reset),
      retryAfter: retryAfter ? parseInt(retryAfter) : undefined,
      isLimited: parseInt(remaining) === 0,
    };
  }, [headers]);

  // Enhanced fetch function with rate limiting
  const fetchWithRateLimit = useCallback(
    async (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> => {
      try {
        const response = await fetch(input, init);
        const info = parseRateLimitHeaders(response);

        if (info) {
          setRateLimitInfo(info);
          lastRequestRef.current = Date.now();

          // Handle rate limit hit
          if (info.isLimited && onRateLimitHit) {
            onRateLimitHit(info);
          }

          // Handle recovery
          if (!info.isLimited && rateLimitInfo?.isLimited && onRateLimitRecovered) {
            onRateLimitRecovered(info);
          }

          // Start polling if limited
          if (info.isLimited && !isPolling) {
            startPolling();
          }
        }

        return response;
      } catch (error) {
        console.error("Fetch error:", error);
        throw error;
      }
    },
    [parseRateLimitHeaders, rateLimitInfo, isPolling, onRateLimitHit, onRateLimitRecovered]
  );

  // Start polling for rate limit recovery
  const startPolling = useCallback(() => {
    setIsPolling(true);

    const poll = () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }

      pollTimeoutRef.current = setTimeout(async () => {
        try {
          // Make a lightweight request to check status
          const response = await fetch("/api/health", {
            method: "GET",
            headers: {
              "Cache-Control": "no-cache",
            },
          });

          if (response.ok) {
            const info = parseRateLimitHeaders(response);
            if (info) {
              setRateLimitInfo(info);

              // Stop polling if no longer limited
              if (!info.isLimited) {
                setIsPolling(false);
                if (onRateLimitRecovered) {
                  onRateLimitRecovered(info);
                }
                return;
              }
            }
          }
        } catch (error) {
          console.error("Rate limit poll error:", error);
        }

        // Continue polling
        poll();
      }, pollInterval);
    };

    poll();
  }, [parseRateLimitHeaders, pollInterval, isPolling, onRateLimitRecovered]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Check if request would be rate limited
  const canMakeRequest = useCallback((): boolean => {
    if (!rateLimitInfo) return true;

    // If limited, check if reset time has passed
    if (rateLimitInfo.isLimited) {
      const now = Date.now();
      return now >= rateLimitInfo.resetTime;
    }

    // If no remaining requests, check if reset time has passed
    if (rateLimitInfo.remaining <= 0) {
      const now = Date.now();
      return now >= rateLimitInfo.resetTime;
    }

    return rateLimitInfo.remaining > 0;
  }, [rateLimitInfo]);

  // Get time until rate limit resets
  const getTimeUntilReset = useCallback((): number => {
    if (!rateLimitInfo || !rateLimitInfo.isLimited) return 0;

    const now = Date.now();
    return Math.max(0, rateLimitInfo.resetTime - now);
  }, [rateLimitInfo]);

  // Get formatted time until reset
  const getFormattedTimeUntilReset = useCallback((): string => {
    const ms = getTimeUntilReset();
    if (ms === 0) return "Now";

    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }

    return `${seconds}s`;
  }, [getTimeUntilReset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    // State
    rateLimitInfo,
    isPolling,

    // Methods
    fetchWithRateLimit,
    canMakeRequest,
    getTimeUntilReset,
    getFormattedTimeUntilReset,

    // Computed values
    isRateLimited: rateLimitInfo?.isLimited ?? false,
    remainingRequests: rateLimitInfo?.remaining ?? 0,
    requestLimit: rateLimitInfo?.limit ?? 0,
    resetTime: rateLimitInfo?.resetTime ?? null,
  };
}

/**
 * Hook to handle rate limiting for specific operations
 */
export function useOperationRateLimit(operationName: string, options?: UseRateLimitOptions) {
  const rateLimit = useRateLimit(options);

  // Operation-specific retry logic
  const executeWithRetry = useCallback(
    async <T>(
      operation: () => Promise<T>,
      maxRetries: number = 3
    ): Promise<T> => {
      let lastError: Error = new Error("Max retries exceeded");

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Check rate limit before attempting
          if (rateLimit.isRateLimited) {
            const waitTime = rateLimit.getTimeUntilReset();
            if (waitTime > 0) {
              console.log(`Rate limited for ${operationName}. Waiting ${waitTime}ms...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }

          return await operation();
        } catch (error) {
          lastError = error as Error;

          // Don't retry on certain errors
          if (error instanceof Error && (
            error.message.includes("400") ||
            error.message.includes("401") ||
            error.message.includes("403") ||
            error.message.includes("404")
          )) {
            throw error;
          }

          if (attempt === maxRetries) {
            console.error(`Max retries exceeded for ${operationName}:`, error);
            throw error;
          }

          const retryDelay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }

      throw lastError;
    },
    [rateLimit, operationName]
  );

  return {
    ...rateLimit,
    executeWithRetry,
  };
}