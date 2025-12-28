"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home, MessageCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showRetry?: boolean;
  showHome?: boolean;
  showSupport?: boolean;
  title?: string;
  description?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === "production") {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // In production, you would send this to your error logging service
    // For example: Sentry, LogRocket, DataDog, etc.
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // Example: Send to your logging endpoint
      fetch("/api/errors/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorData),
      }).catch(() => {
        // Silently fail if logging fails
      });
    } catch (e) {
      // Silently fail if error logging fails
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleContactSupport = () => {
    // Open email client or redirect to support page
    const subject = encodeURIComponent("Error Report - AI Cover Generator");
    const body = encodeURIComponent(
      `Error Details:\n${this.state.error?.message}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`
    );
    window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[200px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-destructive">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <CardTitle className="text-destructive">
                {this.props.title || "Something went wrong"}
              </CardTitle>
              <CardDescription>
                {this.props.description || "An unexpected error occurred. Please try again or contact support if the problem persists."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-4 rounded border border-border p-3">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <span className="text-sm font-medium">Message:</span>
                      <p className="mt-1 text-xs text-muted-foreground break-all">
                        {this.state.error.message}
                      </p>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <span className="text-sm font-medium">Stack Trace:</span>
                        <pre className="mt-1 text-xs text-muted-foreground overflow-auto max-h-32 whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <span className="text-sm font-medium">Component Stack:</span>
                        <pre className="mt-1 text-xs text-muted-foreground overflow-auto max-h-32 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col gap-2">
                {this.props.showRetry !== false && (
                  <Button onClick={this.handleRetry} variant="default" className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                )}

                {this.props.showHome !== false && (
                  <Button onClick={this.handleGoHome} variant="outline" className="w-full">
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Button>
                )}

                {this.props.showSupport && (
                  <Button onClick={this.handleContactSupport} variant="ghost" className="w-full">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contact Support
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for different use cases

export function CoverGeneratorErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      title="Cover Generation Failed"
      description="There was an error generating your cover. Please check your input and try again."
      showRetry={true}
      showHome={false}
      showSupport={true}
    >
      {children}
    </ErrorBoundary>
  );
}

export function CanvasErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      title="Canvas Error"
      description="The canvas editor encountered an error. Your work may not be saved."
      showRetry={true}
      showHome={false}
      showSupport={true}
    >
      {children}
    </ErrorBoundary>
  );
}

export function APIErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      title="API Error"
      description="Failed to connect to the server. Please check your internet connection and try again."
      showRetry={true}
      showHome={true}
      showSupport={false}
    >
      {children}
    </ErrorBoundary>
  );
}

export function FormErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      title="Form Error"
      description="There was an error with the form. Please refresh and try again."
      showRetry={true}
      showHome={false}
      showSupport={false}
    >
      {children}
    </ErrorBoundary>
  );
}

// Simple inline error fallback for minimal disruption
export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="border-destructive bg-destructive/5">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="text-sm text-destructive">{message}</span>
        </div>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Hook to report errors programmatically
export function useErrorReporter() {
  const reportError = React.useCallback((error: Error, context?: string) => {
    console.error("Reported error:", error, context);

    if (process.env.NODE_ENV === "production") {
      try {
        const errorData = {
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        };

        fetch("/api/errors/log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(errorData),
        }).catch(() => {
          // Silently fail if logging fails
        });
      } catch (e) {
        // Silently fail if error logging fails
      }
    }
  }, []);

  return { reportError };
}