import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/api/response";
import { createRequestLogger } from "@/lib/utils/logger";
import { v4 as uuidv4 } from "uuid";

// Import the same job store from the parent route
// In production, this should be replaced with a proper database
const jobs = (global as any).jobs || new Map();
if (!(global as any).jobs) {
  (global as any).jobs = jobs;
}

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const requestId = uuidv4();
  const logger = createRequestLogger(requestId);

  try {
    const { jobId } = params;

    logger.info("Job status request", { jobId });

    // Find job
    const job = jobs.get(jobId);
    if (!job) {
      logger.warn("Job not found", { jobId });
      return ApiResponse.error(
        new Error(`Job with ID ${jobId} not found`),
        404,
        { requestId }
      );
    }

    // Transform job data for response
    const jobResponse = {
      id: job.id,
      status: job.status,
      progress: job.progress || 0,
      request: {
        text: job.request.text,
        platforms: job.request.platforms,
        styleTemplate: job.request.styleTemplate,
        customizations: job.request.customizations,
      },
      results: job.results || null,
      error: job.error || null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      estimatedTimeRemaining: job.status === "processing" ? estimateTimeRemaining(job) : null,
    };

    logger.info("Job status retrieved", { jobId, status: job.status });

    return ApiResponse.success(jobResponse, {
      requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to get job status", { error: errorMessage });
    return ApiResponse.error(
      error instanceof Error ? error : new Error(errorMessage),
      500,
      { requestId }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const requestId = uuidv4();
  const logger = createRequestLogger(requestId);

  try {
    const { jobId } = params;

    logger.info("Job delete request", { jobId });

    // Find and delete job
    const job = jobs.get(jobId);
    if (!job) {
      logger.warn("Job not found for deletion", { jobId });
      return ApiResponse.error(
        new Error(`Job with ID ${jobId} not found`),
        404,
        { requestId }
      );
    }

    // Can only delete completed or failed jobs
    if (job.status === "pending" || job.status === "processing") {
      logger.warn("Attempted to delete active job", { jobId, status: job.status });
      return ApiResponse.error(
        new Error("Cannot delete job that is currently processing"),
        400,
        { requestId }
      );
    }

    // Delete the job
    jobs.delete(jobId);

    logger.info("Job deleted", { jobId });

    return ApiResponse.success(
      { message: "Job deleted successfully" },
      {
        requestId,
        timestamp: new Date().toISOString(),
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to delete job", { error: errorMessage });
    return ApiResponse.error(
      error instanceof Error ? error : new Error(errorMessage),
      500,
      { requestId }
    );
  }
}

function estimateTimeRemaining(job: any): number {
  // Simple estimation based on current progress
  // In production, this could be more sophisticated
  const elapsed = Date.now() - new Date(job.createdAt).getTime();
  const progress = job.progress || 0;

  if (progress <= 0) return 120; // 2 minutes estimate
  if (progress >= 100) return 0;

  const totalEstimated = (elapsed / progress) * 100;
  const remaining = totalEstimated - elapsed;

  // Cap at 5 minutes
  return Math.min(remaining, 300000);
}