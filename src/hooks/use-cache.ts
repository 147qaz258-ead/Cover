"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CacheStats } from "@/lib/cache/cache";

export interface UseCacheOptions {
  // Cache instance configuration
  namespace?: string;

  // Local storage options
  useLocalStorage?: boolean;
  storageKey?: string;

  // Expiration time in seconds (default: 5 minutes)
  defaultTtl?: number;

  // Max cache size (default: 50 entries)
  maxSize?: number;

  // Enable debug logging
  debug?: boolean;
}

export interface CacheEntry<T = any> {
  data: T;
  createdAt: number;
  ttl: number;
  accessCount: number;
}

/**
 * Client-side cache hook for React components
 */
export function useCache<T = any>(options: UseCacheOptions = {}) {
  const {
    namespace = "app",
    useLocalStorage = true,
    storageKey = `cache_${namespace}`,
    defaultTtl = 300, // 5 minutes
    maxSize = 50,
    debug = process.env.NODE_ENV === "development",
  } = options;

  const [stats, setStats] = useState<CacheStats>({
    hits: 0,
    misses: 0,
    size: 0,
    entries: 0,
    hitRate: 0,
    memoryUsage: 0,
    evictions: 0,
  });

  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());

  // Load cache from localStorage on mount
  useEffect(() => {
    if (useLocalStorage && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          // Restore cache entries that haven't expired
          const now = Date.now();
          for (const [key, entry] of Object.entries(data.entries || {})) {
            if ((entry as any).createdAt + (entry as any).ttl * 1000 > now) {
              cacheRef.current.set(key, entry as CacheEntry<T>);
            }
          }
          updateStats();
        }
      } catch (error) {
        if (debug) {
          console.error("Failed to load cache from localStorage:", error);
        }
      }
    }
  }, [useLocalStorage, storageKey, debug]);

  // Save cache to localStorage periodically
  useEffect(() => {
    if (useLocalStorage && typeof window !== "undefined") {
      const interval = setInterval(() => {
        saveToStorage();
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [useLocalStorage]);

  const saveToStorage = useCallback(() => {
    try {
      const data = {
        entries: Object.fromEntries(cacheRef.current),
        stats,
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      if (debug) {
        console.error("Failed to save cache to localStorage:", error);
      }
    }
  }, [storageKey, stats, debug]);

  const updateStats = useCallback(() => {
    const cache = cacheRef.current;
    let hits = stats.hits;
    let misses = stats.misses;

    // Calculate memory usage (rough estimate)
    let memoryUsage = 0;
    for (const entry of Array.from(cache.values())) {
      memoryUsage += JSON.stringify(entry).length * 2; // Rough estimate in bytes
    }

    setStats(prev => ({
      ...prev,
      size: memoryUsage,
      entries: cache.size,
      hitRate: hits + misses > 0 ? hits / (hits + misses) : 0,
    }));
  }, [stats.hits, stats.misses]);

  const get = useCallback((key: string): T | null => {
    const entry = cacheRef.current.get(key);

    if (!entry) {
      setStats(prev => ({ ...prev, misses: prev.misses + 1, hitRate: 0 }));
      if (debug) console.log(`Cache miss: ${key}`);
      return null;
    }

    // Check if expired
    if (Date.now() - entry.createdAt > entry.ttl * 1000) {
      cacheRef.current.delete(key);
      setStats(prev => ({
        ...prev,
        misses: prev.misses + 1,
        entries: cacheRef.current.size
      }));
      if (debug) console.log(`Cache expired: ${key}`);
      return null;
    }

    // Update access count
    entry.accessCount++;
    cacheRef.current.set(key, entry);

    setStats(prev => ({
      ...prev,
      hits: prev.hits + 1,
      hitRate: (prev.hits + 1) / ((prev.hits + 1) + prev.misses)
    }));

    if (debug) console.log(`Cache hit: ${key}`);
    return entry.data;
  }, [debug]);

  const set = useCallback((key: string, data: T, ttl?: number): void => {
    // Evict if cache is full
    if (cacheRef.current.size >= maxSize && !cacheRef.current.has(key)) {
      evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      createdAt: Date.now(),
      ttl: ttl || defaultTtl,
      accessCount: 1,
    };

    cacheRef.current.set(key, entry);
    updateStats();

    if (debug) console.log(`Cache set: ${key} (TTL: ${ttl || defaultTtl}s)`);
  }, [maxSize, defaultTtl, updateStats, debug]);

  const del = useCallback((key: string): boolean => {
    const deleted = cacheRef.current.delete(key);
    if (deleted) {
      updateStats();
      if (debug) console.log(`Cache delete: ${key}`);
    }
    return deleted;
  }, [updateStats, debug]);

  const clear = useCallback((): void => {
    const size = cacheRef.current.size;
    cacheRef.current.clear();
    setStats(prev => ({
      ...prev,
      entries: 0,
      size: 0,
      evictions: prev.evictions + size
    }));

    // Clear localStorage
    if (useLocalStorage && typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }

    if (debug) console.log("Cache cleared");
  }, [useLocalStorage, storageKey, debug]);

  const evictLRU = useCallback((): void => {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    let lowestAccess = Infinity;

    for (const [key, entry] of Array.from(cacheRef.current.entries())) {
      // Prefer entries with lowest access count, then oldest
      if (entry.accessCount < lowestAccess ||
        (entry.accessCount === lowestAccess && entry.createdAt < oldestTime)) {
        lowestAccess = entry.accessCount;
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      cacheRef.current.delete(oldestKey);
      setStats(prev => ({
        ...prev,
        evictions: prev.evictions + 1,
        entries: cacheRef.current.size
      }));
      if (debug) console.log(`Cache evicted LRU: ${oldestKey}`);
    }
  }, [debug]);

  const cleanup = useCallback((): number => {
    const now = Date.now();
    const toDelete: string[] = [];
    let count = 0;

    for (const [key, entry] of Array.from(cacheRef.current.entries())) {
      if (now - entry.createdAt > entry.ttl * 1000) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      cacheRef.current.delete(key);
      count++;
    }

    if (count > 0) {
      setStats(prev => ({
        ...prev,
        evictions: prev.evictions + count,
        entries: cacheRef.current.size
      }));
      if (debug) console.log(`Cache cleanup: removed ${count} expired entries`);
    }

    return count;
  }, [debug]);

  const keys = useCallback((): string[] => {
    return Array.from(cacheRef.current.keys());
  }, []);

  const has = useCallback((key: string): boolean => {
    const entry = cacheRef.current.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.createdAt > entry.ttl * 1000) {
      cacheRef.current.delete(key);
      updateStats();
      return false;
    }

    return true;
  }, [updateStats]);

  // Clean up expired entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      cleanup();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [cleanup]);

  return {
    // Cache operations
    get,
    set,
    delete: del,
    clear,
    cleanup,
    keys,
    has,

    // Cache statistics
    stats,
    isReady: true,

    // Debug methods
    saveToStorage,
    evictLRU,
  };
}

/**
 * Hook for cached data fetching with automatic stale-while-revalidate
 */
export function useCachedFetch<T = any>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    revalidateOnFocus?: boolean;
    revalidateOnReconnect?: boolean;
    initialData?: T;
  } = {}
) {
  const { ttl = 300, revalidateOnFocus = true, revalidateOnReconnect = true, initialData } = options;
  const cache = useCache<T>({ defaultTtl: ttl });

  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const fetch = useCallback(async (force = false) => {
    // Try cache first unless forced refresh
    if (!force) {
      const cached = cache.get(key);
      if (cached !== null) {
        setData(cached);
        setLastFetched(Date.now());
        return cached;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();

      // Update cache
      cache.set(key, result, ttl);

      setData(result);
      setLastFetched(Date.now());
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [cache, key, fetcher, ttl]);

  // Initial fetch
  useEffect(() => {
    fetch().catch(() => { }); // Ignore errors on initial load
  }, []);

  // Revalidate on window focus
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      // Check if data is stale (older than half TTL)
      if (lastFetched && Date.now() - lastFetched > (ttl * 1000) / 2) {
        fetch(true).catch(() => { });
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetch, revalidateOnFocus, lastFetched, ttl]);

  // Revalidate on reconnect
  useEffect(() => {
    if (!revalidateOnReconnect) return;

    const handleOnline = () => {
      fetch(true).catch(() => { });
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [fetch, revalidateOnReconnect]);

  const mutate = useCallback(async (newData?: T, shouldRevalidate = false) => {
    if (newData !== undefined) {
      // Update cache with new data
      cache.set(key, newData, ttl);
      setData(newData);
    }

    if (shouldRevalidate) {
      return fetch(true);
    }
  }, [cache, fetch, key, ttl]);

  return {
    data,
    loading,
    error,
    fetch,
    mutate,
    revalidate: () => fetch(true),
    cache,
  };
}