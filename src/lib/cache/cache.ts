import { createHash } from "crypto";

// Cache configuration
export interface CacheConfig {
  // Default TTL in seconds
  defaultTtl?: number;

  // Maximum cache size (number of entries)
  maxSize?: number;

  // Cache backend
  backend: "memory" | "redis" | "file";

  // Redis configuration (if using Redis)
  redis?: {
    url: string;
    keyPrefix: string;
  };

  // File cache configuration (if using file backend)
  file?: {
    cacheDir: string;
    maxFileSize: number; // bytes
  };
}

// Cache entry with metadata
export interface CacheEntry<T = any> {
  data: T;
  createdAt: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  tags?: string[];
}

// Cache statistics
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  entries: number;
  hitRate: number;
  memoryUsage: number;
  evictions: number;
}

// Cache key generation options
export interface CacheKeyOptions {
  prefix?: string;
  version?: string;
  tags?: string[];
  hash?: boolean;
}

/**
 * Generic cache interface
 */
export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, data: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
  keys(pattern?: string): Promise<string[]>;
  getStats(): CacheStats;
}

/**
 * In-memory cache implementation with LRU eviction
 */
export class MemoryCache implements ICache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    entries: 0,
    hitRate: 0,
    memoryUsage: 0,
    evictions: 0,
  };

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;

    // Set up periodic cleanup
    setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (Date.now() - entry.createdAt > entry.ttl * 1000) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.entries--;
      this.updateHitRate();
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.stats.hits++;
    this.updateHitRate();

    return entry.data;
  }

  async set<T>(key: string, data: T, ttl: number = 3600): Promise<void> {
    const size = this.calculateSize(data);

    // Evict if necessary
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      createdAt: Date.now(),
      ttl,
      accessCount: 1,
      lastAccessed: Date.now(),
      size,
    };

    this.cache.set(key, entry);
    this.updateStats();
  }

  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateStats();
    }
    return deleted;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.resetStats();
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.createdAt > entry.ttl * 1000) {
      this.cache.delete(key);
      this.updateStats();
      return false;
    }

    return true;
  }

  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys());

    if (!pattern) return allKeys;

    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    return allKeys.filter(key => regex.test(key));
  }

  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.stats.entries--;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.createdAt > entry.ttl * 1000) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.cache.delete(key);
      this.stats.evictions++;
      this.stats.entries--;
    }
  }

  private updateStats(): void {
    this.stats.entries = this.cache.size;
    this.stats.memoryUsage = this.calculateMemoryUsage();
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private resetStats(): void {
    this.stats.entries = 0;
    this.stats.memoryUsage = 0;
  }

  private calculateSize(data: any): number {
    return JSON.stringify(data).length * 2; // Rough estimate
  }

  private calculateMemoryUsage(): number {
    let total = 0;
    for (const entry of Array.from(this.cache.values())) {
      total += entry.size;
    }
    return total;
  }
}

/**
 * Cache key generator with hashing support
 */
export class CacheKeyGenerator {
  static generate(
    params: Record<string, any>,
    options: CacheKeyOptions = {}
  ): string {
    const { prefix = "cache", version = "v1", tags = [], hash = true } = options;

    // Sort params for consistent key generation
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);

    const paramString = JSON.stringify(sortedParams);
    const dataString = `${prefix}:${version}:${paramString}`;

    if (tags.length > 0) {
      return `${dataString}:${tags.join(",")}`;
    }

    // Use hash for long keys to avoid issues with cache systems
    if (hash || dataString.length > 200) {
      return `${prefix}:${version}:${createHash("md5").update(paramString).digest("hex")}`;
    }

    return dataString;
  }

  // Specific generators for different types of data
  static aiResponse(provider: string, model: string, prompt: string, options?: any): string {
    return this.generate(
      { provider, model, prompt, options },
      { prefix: "ai", version: "v1" }
    );
  }

  static imageGeneration(
    provider: string,
    prompt: string,
    style: string,
    dimensions: { width: number; height: number }
  ): string {
    return this.generate(
      { provider, prompt, style, dimensions },
      { prefix: "img", version: "v1" }
    );
  }

  static templateAnalysis(templateId: string, text: string): string {
    return this.generate(
      { templateId, text },
      { prefix: "template", version: "v1" }
    );
  }

  static platformSpecs(platform: string, version: string): string {
    return this.generate(
      { platform, version },
      { prefix: "specs", version: "v1" }
    );
  }
}

/**
 * Cache factory for creating different cache instances
 */
export class CacheFactory {
  private static instances = new Map<string, ICache>();

  static getInstance(config: CacheConfig): ICache {
    const instanceKey = `${config.backend}:${JSON.stringify(config)}`;

    if (!this.instances.has(instanceKey)) {
      const cache = this.createCache(config);
      this.instances.set(instanceKey, cache);
    }

    return this.instances.get(instanceKey)!;
  }

  private static createCache(config: CacheConfig): ICache {
    switch (config.backend) {
      case "memory":
        return new MemoryCache(config.maxSize);

      case "redis":
        // TODO: Implement Redis cache
        throw new Error("Redis cache not implemented yet");

      case "file":
        // TODO: Implement file cache
        throw new Error("File cache not implemented yet");

      default:
        throw new Error(`Unknown cache backend: ${config.backend}`);
    }
  }
}

// Default cache configurations
export const CacheConfigPresets = {
  // Cache for AI responses (longer TTL, higher priority)
  aiResponses: {
    backend: "memory" as const,
    defaultTtl: 3600, // 1 hour
    maxSize: 500,
  },

  // Cache for generated images (shorter TTL due to size)
  images: {
    backend: "memory" as const,
    defaultTtl: 1800, // 30 minutes
    maxSize: 100,
  },

  // Cache for templates and specs (very long TTL)
  templates: {
    backend: "memory" as const,
    defaultTtl: 86400, // 24 hours
    maxSize: 1000,
  },

  // Cache for API responses (short TTL)
  api: {
    backend: "memory" as const,
    defaultTtl: 300, // 5 minutes
    maxSize: 200,
  },
} as const;