import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for error logging
const ErrorLogSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  timestamp: z.string(),
  userAgent: z.string().optional(),
  url: z.string().optional(),
  context: z.string().optional(),
});

type ErrorLog = z.infer<typeof ErrorLogSchema>;

// In-memory storage for errors (in production, use a proper logging service)
const errorLogs: ErrorLog[] = [];
const MAX_LOGS = 1000; // Prevent memory issues

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const errorData = ErrorLogSchema.parse(body);

    // Add server-side information
    const enrichedError: ErrorLog = {
      ...errorData,
      timestamp: errorData.timestamp || new Date().toISOString(),
    };

    // Store error (in production, send to logging service)
    errorLogs.push(enrichedError);

    // Prevent memory issues by keeping only recent logs
    if (errorLogs.length > MAX_LOGS) {
      errorLogs.splice(0, errorLogs.length - MAX_LOGS);
    }

    // Log to console for development
    if (process.env.NODE_ENV === "development") {
      console.error("Client Error:", enrichedError);
    }

    // In production, you would send to services like:
    // - Sentry
    // - LogRocket
    // - DataDog
    // - AWS CloudWatch
    // - etc.

    // Send to external logging service if configured
    if (process.env.ERROR_LOGGING_WEBHOOK) {
      try {
        await fetch(process.env.ERROR_LOGGING_WEBHOOK, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "client_error",
            data: enrichedError,
          }),
        }).catch(() => {
          // Silently fail if webhook fails
        });
      } catch (e) {
        // Silently fail if webhook fails
      }
    }

    return NextResponse.json({ success: true, id: generateErrorId() });
  } catch (error) {
    // Don't throw errors from error logging
    return NextResponse.json(
      { success: false, error: "Failed to log error" },
      { status: 400 }
    );
  }
}

// Endpoint to retrieve recent errors (for debugging)
export async function GET(request: NextRequest) {
  // Only allow in development or with proper authentication
  if (process.env.NODE_ENV === "production") {
    // In production, require authentication
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.ERROR_LOGGING_TOKEN}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const recentErrors = errorLogs.slice(-limit).reverse();

  return NextResponse.json({
    errors: recentErrors,
    total: errorLogs.length,
  });
}

function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}