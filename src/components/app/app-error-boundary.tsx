"use client";

import React from "react";
import { ErrorBoundary } from "@/components/ui/error-boundary";

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  return (
    <ErrorBoundary
      title="Application Error"
      description="Something went wrong with the application. Please refresh the page or contact support if the problem persists."
      showRetry={true}
      showHome={false}
      showSupport={true}
    >
      {children}
    </ErrorBoundary>
  );
}