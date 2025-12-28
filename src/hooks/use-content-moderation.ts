"use client";

import { useState, useCallback } from "react";

export interface ModerationResult {
  safe: boolean;
  flagged: boolean;
  categories: Record<string, boolean>;
  scores: Record<string, number>;
  reason?: string;
  alternative?: string;
}

export interface UseContentModerationOptions {
  enabled?: boolean;
  strict?: boolean;
  autoRetry?: boolean;
  debounceMs?: number;
}

export function useContentModeration(options: UseContentModerationOptions = {}) {
  const {
    enabled = true,
    strict = false,
    autoRetry = true,
    debounceMs = 500,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ModerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Moderate single content
  const moderateContent = useCallback(async (
    content: string,
    options?: { strict?: boolean }
  ): Promise<ModerationResult | null> => {
    if (!enabled) {
      return {
        safe: true,
        flagged: false,
        categories: {},
        scores: {},
      };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/moderate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          strict: options?.strict ?? strict,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Moderation failed");
      }

      const result = data.data;
      setLastResult(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Content moderation error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enabled, strict]);

  // Batch moderate multiple content pieces
  const moderateBatch = useCallback(async (
    contents: string[],
    options?: { strict?: boolean }
  ): Promise<ModerationResult[] | null> => {
    if (!enabled) {
      return contents.map(() => ({
        safe: true,
        flagged: false,
        categories: {},
        scores: {},
      }));
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/moderate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: contents,
          batch: true,
          strict: options?.strict ?? strict,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Batch moderation failed");
      }

      const results = data.data.results;
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Batch content moderation error:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enabled, strict]);

  // Quick check without detailed results
  const checkSafety = useCallback(async (content: string): Promise<boolean> => {
    if (!enabled) return true;

    try {
      const params = new URLSearchParams({ content });
      const response = await fetch(`/api/moderate?${params}`);
      const data = await response.json();

      if (!response.ok) {
        console.error("Safety check failed:", data.error);
        return true; // Default to safe if check fails
      }

      return data.data.safe;
    } catch (err) {
      console.error("Safety check error:", err);
      return true; // Default to safe if check fails
    }
  }, [enabled]);

  // Debounced moderation for text input
  const debouncedModerate = useCallback(
    (content: string) => {
      if (!content.trim()) {
        setLastResult(null);
        return;
      }

      const timeoutId = setTimeout(() => {
        moderateContent(content);
      }, debounceMs);

      return () => clearTimeout(timeoutId);
    },
    [moderateContent, debounceMs]
  );

  // Generate safe alternative
  const generateAlternative = useCallback(
    async (content: string): Promise<string | null> => {
      if (!enabled) return content;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/moderate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            strict: false,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "Failed to generate alternative");
        }

        return data.data.alternative || null;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("Alternative generation error:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [enabled]
  );

  // Clear results
  const clearResults = useCallback(() => {
    setLastResult(null);
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    lastResult,
    error,

    // Methods
    moderateContent,
    moderateBatch,
    checkSafety,
    debouncedModerate,
    generateAlternative,
    clearResults,

    // Helpers
    isFlagged: lastResult?.flagged ?? false,
    isSafe: lastResult?.safe ?? true,
    flaggedCategories: lastResult?.flagged ?
      Object.entries(lastResult.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category) : [],
  };
}

// Predefined category descriptions
export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  sexual: "Sexually explicit content",
  hate: "Hate speech or discriminatory content",
  harassment: "Harassment or bullying content",
  self_harm: "Self-harm related content",
  sexual_minors: "Sexual content involving minors",
  hate_threatening: "Hate content with violent threats",
  violence_graphic: "Graphic violence content",
  self_harm_intent: "Content expressing intent to self-harm",
  self_harm_instructions: "Instructions for self-harm",
  harassment_threatening: "Harassment with threats",
  violence: "Violent content",
};

// Helper function to get user-friendly error messages
export function getModerationErrorMessage(
  result: ModerationResult,
  options?: { showCategories?: boolean }
): string {
  if (!result.flagged) return "";

  const baseMessage = "Content flagged for inappropriate material";
  const categories = Object.entries(result.categories)
    .filter(([_, flagged]) => flagged)
    .map(([category]) => CATEGORY_DESCRIPTIONS[category] || category);

  if (categories.length === 0) {
    return baseMessage;
  }

  const categoryList = options?.showCategories
    ? `: ${categories.join(", ")}`
    : "";

  return `${baseMessage}${categoryList}`;
}