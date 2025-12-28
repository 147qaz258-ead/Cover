interface AnalyticsEvent {
  // Core event properties
  event: string;
  timestamp: number;
  sessionId: string;
  userId?: string;

  // Event-specific data
  properties: Record<string, any>;

  // Technical properties
  userAgent?: string;
  ip?: string;
  url?: string;
  referrer?: string;
}

interface GenerationAnalytics {
  // Text analytics
  textLength: number;
  language?: string;
  sentiment?: string;
  topics: string[];

  // Platform analytics
  platforms: string[];
  primaryPlatform: string;

  // Template analytics
  templateId: string;
  templateCategory: string;
  customizations: string[];

  // Generation analytics
  processingTime: number;
  success: boolean;
  errorType?: string;

  // Quality metrics
  titlesGenerated: number;
  imagesGenerated: number;
  userRating?: number;
}

interface UserBehaviorAnalytics {
  // Session analytics
  sessionDuration: number;
  pagesViewed: number;
  generationsAttempted: number;
  generationsCompleted: number;

  // Feature usage
  features: {
    textInput: boolean;
    styleSelector: boolean;
    platformSelector: boolean;
    infiniteCanvas: boolean;
    multiPlatform: boolean;
    batchGeneration: boolean;
  };

  // Drop-off points
  abandonedAt?: string;
  lastAction: string;
}

interface PerformanceAnalytics {
  // API performance
  endpoint: string;
  responseTime: number;
  statusCode: number;
  cacheHit: boolean;

  // AI performance
  provider: string;
  model: string;
  tokensUsed?: number;
  cost?: number;

  // System performance
  memoryUsage: number;
  cpuUsage?: number;
  concurrentUsers?: number;
}

export interface AnalyticsConfig {
  // Analytics provider
  provider: "console" | "file" | "api" | "ga4" | "mixpanel";

  // API configuration
  apiUrl?: string;
  apiKey?: string;

  // File configuration
  logFile?: string;
  maxFileSize?: number;

  // Sampling
  sampleRate?: number;

  // Batching
  batchSize?: number;
  flushInterval?: number;

  // Privacy
  anonymizeIp?: boolean;
  anonymizeUserAgent?: boolean;
  excludeBots?: boolean;
}

/**
 * Analytics client for tracking user interactions and system performance
 */
export class AnalyticsClient {
  private config: AnalyticsConfig;
  private sessionId: string;
  private userId?: string;
  private eventQueue: AnalyticsEvent[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();

    // Set up periodic flushing
    if (config.flushInterval) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, config.flushInterval);
    }

    // Track page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        this.flush();
      });
    }
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  track(event: string, properties: Record<string, any> = {}): void {
    // Check sampling rate
    if (this.config.sampleRate && Math.random() > this.config.sampleRate) {
      return;
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      properties,
    };

    // Add technical properties
    if (typeof window !== "undefined") {
      analyticsEvent.userAgent = navigator.userAgent;
      analyticsEvent.url = window.location.href;
      analyticsEvent.referrer = document.referrer;
    }

    this.eventQueue.push(analyticsEvent);

    // Auto-flush if batch size reached
    if (this.config.batchSize && this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  // Generation analytics
  trackGeneration(data: GenerationAnalytics): void {
    this.track("cover_generated", {
      text_length: data.textLength,
      language: data.language,
      sentiment: data.sentiment,
      topics: data.topics.slice(0, 5), // Limit to 5 topics
      platforms: data.platforms,
      primary_platform: data.primaryPlatform,
      template_id: data.templateId,
      template_category: data.templateCategory,
      has_customizations: data.customizations.length > 0,
      processing_time: data.processingTime,
      success: data.success,
      error_type: data.errorType,
      titles_generated: data.titlesGenerated,
      images_generated: data.imagesGenerated,
      user_rating: data.userRating,
    });
  }

  // User behavior analytics
  trackUserBehavior(data: UserBehaviorAnalytics): void {
    this.track("user_behavior", {
      session_duration: data.sessionDuration,
      pages_viewed: data.pagesViewed,
      generations_attempted: data.generationsAttempted,
      generations_completed: data.generationsCompleted,
      completion_rate: data.generationsAttempted > 0
        ? data.generationsCompleted / data.generationsAttempted
        : 0,
      features_used: Object.entries(data.features)
        .filter(([_, used]) => used)
        .map(([feature]) => feature),
      abandoned_at: data.abandonedAt,
      last_action: data.lastAction,
    });
  }

  // Performance analytics
  trackPerformance(data: PerformanceAnalytics): void {
    this.track("performance", {
      endpoint: data.endpoint,
      response_time: data.responseTime,
      status_code: data.statusCode,
      cache_hit: data.cacheHit,
      ai_provider: data.provider,
      ai_model: data.model,
      tokens_used: data.tokensUsed,
      cost: data.cost,
      memory_usage: data.memoryUsage,
      cpu_usage: data.cpuUsage,
      concurrent_users: data.concurrentUsers,
    });
  }

  // Error tracking
  trackError(error: Error, context?: Record<string, any>): void {
    this.track("error", {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      context,
    });
  }

  // Feature usage
  trackFeature(feature: string, properties: Record<string, any> = {}): void {
    this.track("feature_used", {
      feature,
      ...properties,
    });
  }

  // A/B testing
  trackExperiment(experiment: string, variant: string, properties: Record<string, any> = {}): void {
    this.track("experiment", {
      experiment,
      variant,
      ...properties,
    });
  }

  // Flush events to destination
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      switch (this.config.provider) {
        case "console":
          this.flushToConsole(events);
          break;

        case "file":
          await this.flushToFile(events);
          break;

        case "api":
          await this.flushToAPI(events);
          break;

        case "ga4":
          await this.flushToGA4(events);
          break;

        case "mixpanel":
          await this.flushToMixpanel(events);
          break;

        default:
          console.warn("Unknown analytics provider:", this.config.provider);
      }
    } catch (error) {
      console.error("Failed to flush analytics events:", error);
      // Re-queue events for retry
      this.eventQueue.unshift(...events);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private flushToConsole(events: AnalyticsEvent[]): void {
    console.group("Analytics Events");
    events.forEach(event => {
      console.log(event.event, event.properties);
    });
    console.groupEnd();
  }

  private async flushToFile(events: AnalyticsEvent[]): Promise<void> {
    // This would typically write to a log file
    // In Node.js environment, you'd use fs
    // In browser, you might use IndexedDB or send to server
    console.log("Writing events to file:", this.config.logFile, events.length);
  }

  private async flushToAPI(events: AnalyticsEvent[]): Promise<void> {
    if (!this.config.apiUrl) return;

    const response = await fetch(this.config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
  }

  private async flushToGA4(events: AnalyticsEvent[]): Promise<void> {
    // GA4 measurement protocol implementation
    if (!this.config.apiKey) return;

    for (const event of events) {
      const gaEvent = {
        client_id: this.sessionId,
        user_id: this.userId,
        events: [{
          name: event.event,
          params: event.properties,
        }],
      };

      await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${this.config.apiKey}&api_secret=YOUR_SECRET`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gaEvent),
      });
    }
  }

  private async flushToMixpanel(events: AnalyticsEvent[]): Promise<void> {
    // Mixpanel API implementation
    if (!this.config.apiKey) return;

    for (const event of events) {
      const mpEvent = {
        event: event.event,
        properties: {
          ...event.properties,
          distinct_id: event.userId || event.sessionId,
          time: new Date(event.timestamp).toISOString(),
          ip: event.ip,
          $user_agent: event.userAgent,
        },
      };

      await fetch("https://api.mixpanel.com/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([mpEvent]),
      });
    }
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Default analytics client instance
let defaultAnalyticsClient: AnalyticsClient | null = null;

export function initializeAnalytics(config: AnalyticsConfig): AnalyticsClient {
  defaultAnalyticsClient = new AnalyticsClient(config);
  return defaultAnalyticsClient;
}

export function getAnalytics(): AnalyticsClient {
  if (!defaultAnalyticsClient) {
    throw new Error("Analytics not initialized. Call initializeAnalytics() first.");
  }
  return defaultAnalyticsClient;
}

// Convenience functions
export const analytics = {
  track: (event: string, properties?: Record<string, any>) =>
    getAnalytics().track(event, properties),

  trackGeneration: (data: GenerationAnalytics) =>
    getAnalytics().trackGeneration(data),

  trackUserBehavior: (data: UserBehaviorAnalytics) =>
    getAnalytics().trackUserBehavior(data),

  trackPerformance: (data: PerformanceAnalytics) =>
    getAnalytics().trackPerformance(data),

  trackError: (error: Error, context?: Record<string, any>) =>
    getAnalytics().trackError(error, context),

  trackFeature: (feature: string, properties?: Record<string, any>) =>
    getAnalytics().trackFeature(feature, properties),

  trackExperiment: (experiment: string, variant: string, properties?: Record<string, any>) =>
    getAnalytics().trackExperiment(experiment, variant, properties),

  setUserId: (userId: string) =>
    getAnalytics().setUserId(userId),
};