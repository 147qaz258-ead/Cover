import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api/response";
import { initializeAnalytics, getAnalytics } from "@/lib/analytics/analytics";
import { z } from "zod";
import { apiRateLimiters } from "@/middleware/rate-limit-middleware";

// Request schema
const EventsRequestSchema = z.object({
  events: z.array(z.object({
    event: z.string(),
    properties: z.record(z.any()).optional(),
    timestamp: z.number().optional(),
  })),
  session: z.object({
    id: z.string(),
    duration: z.number(),
    page_views: z.number(),
    features_used: z.array(z.string()),
  }).optional(),
});

// Initialize analytics on the server
let analyticsInitialized = false;

function ensureAnalyticsInitialized() {
  if (!analyticsInitialized) {
    initializeAnalytics({
      provider: "console", // Default to console for server-side
      sampleRate: parseFloat(process.env.ANALYTICS_SAMPLE_RATE || "1"),
      batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE || "50"),
      flushInterval: parseInt(process.env.ANALYTICS_FLUSH_INTERVAL || "10000"),
    });
    analyticsInitialized = true;
  }
}

async function handleEvents(request: NextRequest) {
  try {
    // Initialize analytics if not already done
    ensureAnalyticsInitialized();

    const body = await request.json();
    const { events, session } = EventsRequestSchema.parse(body);

    const analytics = getAnalytics();

    // Process each event
    for (const event of events) {
      analytics.track(event.event, {
        ...event.properties,
        client_timestamp: event.timestamp,
        server_timestamp: Date.now(),
        session_id: session?.id,
      });
    }

    // Track session data if provided
    if (session) {
      analytics.track("session_update", {
        session_id: session.id,
        session_duration: session.duration,
        page_views: session.page_views,
        features_used: session.features_used,
        features_count: session.features_used.length,
      });
    }

    return ApiResponse.success({
      processed: events.length,
      session_tracked: !!session,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponse.error(
        new Error(`Validation error: ${error.errors.map(e => e.message).join(", ")}`),
        400
      );
    }

    console.error("Analytics events error:", error);
    return ApiResponse.error(
      new Error("Failed to process analytics events"),
      500
    );
  }
}

// Export with rate limiting
export const POST = apiRateLimiters.cache(handleEvents);