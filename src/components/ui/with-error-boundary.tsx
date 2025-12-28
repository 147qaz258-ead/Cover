"use client";

import React from "react";
import { ErrorBoundary } from "./error-boundary";

// Higher-order component to wrap any component with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: {
    title?: string;
    description?: string;
    showRetry?: boolean;
    showHome?: boolean;
    showSupport?: boolean;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  }
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  // Set display name for debugging
  const displayName = Component.displayName || Component.name || "Component";
  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;

  return WrappedComponent;
}

// HOC for specific component types
export function withCoverGeneratorErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
) {
  return withErrorBoundary(Component, {
    title: "Cover Generation Failed",
    description: "There was an error generating your cover. Please check your input and try again.",
    showRetry: true,
    showHome: false,
    showSupport: true,
  });
}

export function withCanvasErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
) {
  return withErrorBoundary(Component, {
    title: "Canvas Error",
    description: "The canvas editor encountered an error. Your work may not be saved.",
    showRetry: true,
    showHome: false,
    showSupport: true,
  });
}

export function withAPIErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
) {
  return withErrorBoundary(Component, {
    title: "API Error",
    description: "Failed to connect to the server. Please check your internet connection and try again.",
    showRetry: true,
    showHome: true,
    showSupport: false,
  });
}

// React hook version for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  // Simulate error boundary behavior
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}