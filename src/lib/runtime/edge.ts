// Edge runtime configuration for API routes
export const runtime = "edge";

// Edge runtime environment check
export function isEdgeRuntime(): boolean {
  // Check if we're in a Vercel Edge environment
  return typeof (globalThis as any).EdgeRuntime !== "undefined";
}

// Edge-compatible error handling
export class EdgeError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "EdgeError";
  }
}

// Edge runtime utilities for API routes
export const edgeUtils = {
  // Get request IP in edge runtime
  getClientIP: (request: Request): string => {
    return request.headers.get("x-forwarded-for") ||
           request.headers.get("x-real-ip") ||
           "unknown";
  },

  // Get user agent in edge runtime
  getUserAgent: (request: Request): string => {
    return request.headers.get("user-agent") || "unknown";
  },

  // Create edge-compatible response
  createResponse: (data: any, status: number = 200, headers: Record<string, string> = {}): Response => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });
  },
};