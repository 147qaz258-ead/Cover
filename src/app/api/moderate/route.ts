import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api/response";
import { moderationService } from "@/lib/moderation/moderation-service";
import { z } from "zod";
import { apiRateLimiters } from "@/middleware/rate-limit-middleware";

// Request schema for content moderation
const ModerateRequestSchema = z.object({
  content: z.string().min(1, "Content is required").max(10000, "Content too long"),
  batch: z.boolean().default(false),
  strict: z.boolean().default(false),
});

// Response schema for moderation results
const ModerateResponseSchema = z.object({
  safe: z.boolean(),
  flagged: z.boolean(),
  categories: z.record(z.boolean()),
  scores: z.record(z.number()),
  reason: z.string().optional(),
  alternative: z.string().optional(),
});

// Internal handler
async function handleModerateRequest(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { content, batch, strict } = ModerateRequestSchema.parse(body);

    // Batch moderation
    if (batch) {
      const texts = Array.isArray(content) ? content : [content];
      const results = await moderationService.moderateBatch(texts);

      return ApiResponse.success({
        results,
        safe: !results.some(r => r.flagged),
      });
    }

    // Single content moderation
    const result = await moderationService.moderateText(content);
    const { safe, reason } = await moderationService.isContentSafe(content);

    // Generate alternative if content is flagged and strict mode is off
    let alternative;
    if (result.flagged && !strict) {
      alternative = await moderationService.generateSafeAlternative(content);
    }

    return ApiResponse.success({
      safe,
      flagged: result.flagged,
      categories: result.categories,
      scores: result.category_scores,
      reason,
      alternative,
    }, {
      requestId: crypto.randomUUID(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiResponse.error(
        new Error(`Validation error: ${error.errors.map(e => e.message).join(", ")}`),
        400
      );
    }

    console.error("Moderation API error:", error);
    return ApiResponse.error(
      new Error("Content moderation failed. Please try again."),
      500
    );
  }
}

// GET endpoint to check moderation status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const content = searchParams.get("content");

    if (!content) {
      return ApiResponse.error(
        new Error("Content parameter is required"),
        400
      );
    }

    const { safe, reason } = await moderationService.isContentSafe(content);

    return ApiResponse.success({
      safe,
      reason,
    });
  } catch (error) {
    console.error("Moderation status check error:", error);
    return ApiResponse.error(
      new Error("Failed to check content status"),
      500
    );
  }
}

// Export with rate limiting middleware
export const POST = apiRateLimiters.moderate(handleModerateRequest);