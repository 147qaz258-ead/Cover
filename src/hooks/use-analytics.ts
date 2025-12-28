"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

interface UserBehaviorData {
  sessionId: string;
  pageViews: number;
  sessionStart: number;
  lastActivity: number;
  features: Record<string, boolean>;
  events: AnalyticsEvent[];
}

export function useAnalytics() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);
  const behaviorDataRef = useRef<UserBehaviorData>({
    sessionId: "",
    pageViews: 0,
    sessionStart: Date.now(),
    lastActivity: Date.now(),
    features: {},
    events: [],
  });

  // Initialize analytics
  useEffect(() => {
    // Check if analytics is enabled
    if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== "true") {
      return;
    }

    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem("analytics_session_id");
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("analytics_session_id", sessionId);
    }

    setSessionId(sessionId);
    behaviorDataRef.current.sessionId = sessionId;

    // Track initial page view
    trackPageView();

    // Set up activity tracking
    const updateActivity = () => {
      behaviorDataRef.current.lastActivity = Date.now();
    };

    // Track user interactions
    const events = ["click", "scroll", "keydown", "mousemove"];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Set up session tracking
    const sessionTimer = setInterval(() => {
      checkSessionTimeout();
    }, 30000); // Check every 30 seconds

    // Track page unload
    const handleUnload = () => {
      flushEvents();
    };

    window.addEventListener("beforeunload", handleUnload);

    setIsInitialized(true);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      clearInterval(sessionTimer);
      window.removeEventListener("beforeunload", handleUnload);
      flushEvents();
    };
  }, []);

  const checkSessionTimeout = useCallback(() => {
    const now = Date.now();
    const lastActivity = behaviorDataRef.current.lastActivity;
    const sessionTimeout = 30 * 60 * 1000; // 30 minutes

    if (now - lastActivity > sessionTimeout) {
      // Session timed out, start new session
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      behaviorDataRef.current.sessionId = newSessionId;
      behaviorDataRef.current.pageViews = 0;
      behaviorDataRef.current.sessionStart = now;
      sessionStorage.setItem("analytics_session_id", newSessionId);

      // Track session timeout
      track("session_timeout", {
        session_duration: now - behaviorDataRef.current.sessionStart,
        page_views: behaviorDataRef.current.pageViews,
      });
    }
  }, []);

  const track = useCallback((event: string, properties: Record<string, any> = {}) => {
    if (!isInitialized || process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== "true") {
      return;
    }

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        session_id: sessionId,
        user_id: userId,
        timestamp: Date.now(),
        url: window.location.href,
        user_agent: navigator.userAgent,
      },
    };

    behaviorDataRef.current.events.push(analyticsEvent);

    // Flush events if buffer is full
    if (behaviorDataRef.current.events.length >= 10) {
      flushEvents();
    }
  }, [isInitialized, sessionId, userId]);

  const trackPageView = useCallback(() => {
    const path = window.location.pathname;
    const title = document.title;

    track("page_view", {
      path,
      title,
      referrer: document.referrer,
    });

    behaviorDataRef.current.pageViews++;
  }, [track]);

  const trackFeature = useCallback((feature: string, properties: Record<string, any> = {}) => {
    // Track feature usage
    behaviorDataRef.current.features[feature] = true;

    track("feature_used", {
      feature,
      ...properties,
    });
  }, [track]);

  const trackGeneration = useCallback((data: {
    textLength: number;
    platforms: string[];
    templateId: string;
    processingTime: number;
    success: boolean;
    resultsCount: number;
  }) => {
    track("cover_generation", {
      text_length: data.textLength,
      platforms: data.platforms,
      primary_platform: data.platforms[0],
      template_id: data.templateId,
      processing_time: data.processingTime,
      success: data.success,
      results_count: data.resultsCount,
      platform_count: data.platforms.length,
    });

    // Track template usage
    trackFeature("template_selector", { template_id: data.templateId });

    // Track multi-platform usage
    if (data.platforms.length > 1) {
      trackFeature("multi_platform_generation", {
        platform_count: data.platforms.length,
        platforms: data.platforms,
      });
    }

    // Track individual platform usage
    data.platforms.forEach(platform => {
      trackFeature(`platform_${platform}`);
    });
  }, [track]);

  const trackUserInteraction = useCallback((element: string, action: string, properties: Record<string, any> = {}) => {
    track("user_interaction", {
      element,
      action,
      ...properties,
    });
  }, [track]);

  const trackError = useCallback((error: Error, context: Record<string, any> = {}) => {
    track("error", {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }, [track]);

  const trackExperiment = useCallback((experiment: string, variant: string, properties: Record<string, any> = {}) => {
    // Store experiment variant in localStorage for consistency
    const key = `exp_${experiment}`;
    localStorage.setItem(key, variant);

    track("experiment", {
      experiment,
      variant,
      ...properties,
    });
  }, [track]);

  const getExperimentVariant = useCallback((experiment: string): string | null => {
    const key = `exp_${experiment}`;
    return localStorage.getItem(key);
  }, []);

  const flushEvents = useCallback(() => {
    if (behaviorDataRef.current.events.length === 0) {
      return;
    }

    const events = [...behaviorDataRef.current.events];
    behaviorDataRef.current.events = [];

    // Send events to analytics endpoint
    if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true") {
      fetch("/api/analytics/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          events,
          session: {
            id: sessionId,
            duration: Date.now() - behaviorDataRef.current.sessionStart,
            page_views: behaviorDataRef.current.pageViews,
            features_used: Object.keys(behaviorDataRef.current.features),
          },
        }),
        keepalive: true, // Ensure request completes even if page is unloading
      }).catch(error => {
        console.error("Failed to send analytics events:", error);
        // Re-add events to buffer if send failed
        behaviorDataRef.current.events.unshift(...events);
      });
    }
  }, [sessionId]);

  // Track specific UI interactions
  const trackButtonClick = useCallback((buttonName: string, properties: Record<string, any> = {}) => {
    trackUserInteraction("button", "click", {
      button_name: buttonName,
      ...properties,
    });
  }, [trackUserInteraction]);

  const trackFormSubmit = useCallback((formName: string, properties: Record<string, any> = {}) => {
    trackUserInteraction("form", "submit", {
      form_name: formName,
      ...properties,
    });
  }, [trackUserInteraction]);

  const trackModalView = useCallback((modalName: string, properties: Record<string, any> = {}) => {
    track("modal_view", {
      modal_name: modalName,
      ...properties,
    });
  }, [track]);

  const trackFileUpload = useCallback((fileType: string, fileSize: number, properties: Record<string, any> = {}) => {
    track("file_upload", {
      file_type: fileType,
      file_size: fileSize,
      ...properties,
    });
  }, [track]);

  // Performance tracking
  const trackPageLoad = useCallback(() => {
    if (typeof window !== "undefined" && window.performance) {
      const navigation = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;

      track("page_load", {
        load_time: loadTime,
        dom_content_loaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        first_contentful_paint: 0, // Would need PerformanceObserver for this
      });
    }
  }, [track]);

  // Track performance when page loads
  useEffect(() => {
    if (isInitialized) {
      // Track page load performance
      setTimeout(trackPageLoad, 0);
    }
  }, [isInitialized, trackPageLoad]);

  return {
    // Core tracking
    track,
    trackPageView,
    trackFeature,
    trackGeneration,
    trackUserInteraction,
    trackError,
    trackExperiment,

    // UI interaction tracking
    trackButtonClick,
    trackFormSubmit,
    trackModalView,
    trackFileUpload,

    // Utilities
    getExperimentVariant,
    setUserId,
    flushEvents,

    // State
    isInitialized,
    sessionId,
    userId,
  };
}

/**
 * Hook for A/B testing experiments
 */
export function useExperiment(experimentName: string, variants: string[], weights?: number[]) {
  const { trackExperiment, getExperimentVariant } = useAnalytics();
  const [variant, setVariant] = useState<string | null>(null);

  useEffect(() => {
    // Check if variant already exists
    const existingVariant = getExperimentVariant(experimentName);
    if (existingVariant) {
      setVariant(existingVariant);
      return;
    }

    // Select variant based on weights (or equal probability if no weights)
    let selectedVariant: string = variants[0];
    if (weights && weights.length === variants.length) {
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      let random = Math.random() * totalWeight;

      for (let i = 0; i < variants.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          selectedVariant = variants[i];
          break;
        }
      }
    } else {
      selectedVariant = variants[Math.floor(Math.random() * variants.length)];
    }

    setVariant(selectedVariant);
    trackExperiment(experimentName, selectedVariant, {
      variants_count: variants.length,
      weights: weights || variants.map(() => 1),
    });
  }, [experimentName, variants, weights, trackExperiment, getExperimentVariant]);

  return {
    variant,
    isInExperiment: variant !== null,
    isControl: variant === variants[0],
    isVariant: (name: string) => variant === name,
  };
}