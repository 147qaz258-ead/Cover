import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, validateRequest } from "@/lib/api/response";
import { ApiSchemas } from "@/lib/validation/schemas";
import { coverPipeline } from "@/lib/ai/pipeline";
import { createRequestLogger } from "@/lib/utils/logger";
import { v4 as uuidv4 } from "uuid";
import { withModeration } from "@/lib/middleware/moderation-middleware";
import { apiRateLimiters } from "@/middleware/rate-limit-middleware";
import { withAnalytics, initializeAppAnalytics } from "@/lib/middleware/analytics-middleware";
import { analytics } from "@/lib/analytics/analytics";

// User authentication and quota
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { QUOTA_LIMITS } from "@/lib/payment/stripe";

// ==================== 调试探针：模块加载检查 ====================
console.log("========================================");
console.log("[DEBUG] /api/generate route.ts 开始加载...");
console.log("[DEBUG] 模块加载状态:");
console.log("  - coverPipeline:", typeof coverPipeline !== "undefined" ? "✅ 已加载" : "❌ 未加载");
console.log("  - ApiResponse:", typeof ApiResponse !== "undefined" ? "✅ 已加载" : "❌ 未加载");
console.log("  - ApiSchemas:", typeof ApiSchemas !== "undefined" ? "✅ 已加载" : "❌ 未加载");
console.log("[DEBUG] Modules loaded successfully ✅");
console.log("========================================");

// ==================== 调试探针：环境变量检查 ====================
console.log("[DEBUG] 环境变量状态（脱敏）:");
console.log("  - OPENAI_API_KEY:", !!process.env.OPENAI_API_KEY ? "✅ 已配置" : "❌ 未配置");
console.log("  - GOOGLE_AI_API_KEY:", !!process.env.GOOGLE_AI_API_KEY ? "✅ 已配置" : "❌ 未配置");
console.log("  - REPLICATE_API_TOKEN:", !!process.env.REPLICATE_API_TOKEN ? "✅ 已配置" : "❌ 未配置");
console.log("  - LAOZHANG_API_KEY:", !!process.env.LAOZHANG_API_KEY ? "✅ 已配置" : "❌ 未配置");
console.log("  - STORAGE_MODE:", process.env.STORAGE_MODE || "未配置");
console.log("========================================");

// Initialize analytics on server start
initializeAppAnalytics();

// In-memory job store (replace with Redis/database in production)
// Export it so the [jobId] route can access it
const jobs = new Map();
(global as any).jobs = jobs;

export const runtime = "nodejs"; // Use Node.js runtime for file operations

// ==================== 调试包装器：捕获中间件链路中的所有错误 ====================
async function debugWrapper(request: NextRequest): Promise<NextResponse> {
  const requestId = uuidv4();
  console.log(`\n[DEBUG][${requestId}] ==================== 新请求 ====================`);
  console.log(`[DEBUG][${requestId}] 时间: ${new Date().toISOString()}`);
  console.log(`[DEBUG][${requestId}] 方法: ${request.method}`);
  console.log(`[DEBUG][${requestId}] URL: ${request.url}`);

  try {
    // 尝试解析请求体
    let bodyText = "";
    try {
      const clonedRequest = request.clone();
      bodyText = await clonedRequest.text();
      console.log(`[DEBUG][${requestId}] 请求体长度: ${bodyText.length} 字符`);
      if (bodyText.length < 500) {
        console.log(`[DEBUG][${requestId}] 请求体内容: ${bodyText}`);
      } else {
        console.log(`[DEBUG][${requestId}] 请求体内容（前500字符）: ${bodyText.substring(0, 500)}...`);
      }
    } catch (bodyError) {
      console.error(`[DEBUG][${requestId}] 解析请求体失败:`, bodyError);
    }

    // 调用实际的处理函数
    console.log(`[DEBUG][${requestId}] 开始调用 handlePostRequest...`);
    const response = await handlePostRequest(request);
    console.log(`[DEBUG][${requestId}] handlePostRequest 返回成功`);
    return response;

  } catch (error: any) {
    // ==================== 关键：捕获并暴露完整错误信息 ====================
    console.error(`\n[DEBUG][${requestId}] ========== 捕获到异常 ==========`);
    console.error(`[DEBUG][${requestId}] 错误类型: ${error?.constructor?.name || typeof error}`);
    console.error(`[DEBUG][${requestId}] 错误消息: ${error?.message || String(error)}`);
    console.error(`[DEBUG][${requestId}] 错误堆栈:\n${error?.stack || "无堆栈信息"}`);
    console.error(`[DEBUG][${requestId}] 完整错误对象:`, error);
    console.error(`[DEBUG][${requestId}] ================================\n`);

    // 返回详细的错误响应，让前端能看到真正的错误
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error?.message || "Unknown error",
          name: error?.constructor?.name || "Error",
          stack: error?.stack || null,
          requestId,
          timestamp: new Date().toISOString(),
        },
        debug: {
          hint: "此错误信息仅在开发环境显示，生产环境请移除调试探针",
          envStatus: {
            OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
            GOOGLE_AI_API_KEY: !!process.env.GOOGLE_AI_API_KEY,
            REPLICATE_API_TOKEN: !!process.env.REPLICATE_API_TOKEN,
            LAOZHANG_API_KEY: !!process.env.LAOZHANG_API_KEY,
            STORAGE_MODE: process.env.STORAGE_MODE || "未配置",
          },
        },
      },
      { status: 500 }
    );
  }
}

// Internal POST handler with moderation
async function handlePostRequest(request: NextRequest) {
  const requestId = uuidv4();
  const logger = createRequestLogger(requestId);

  console.log(`[DEBUG][${requestId}] 进入 handlePostRequest`);
  logger.info("Cover generation request received");

  try {
    // Validate request
    console.log(`[DEBUG][${requestId}] 开始验证请求...`);
    const { data, error } = await validateRequest(request, ApiSchemas.GenerateCover);
    if (error) {
      console.log(`[DEBUG][${requestId}] 请求验证失败:`, error);
      logger.error("Invalid request", { error });
      return error;
    }
    console.log(`[DEBUG][${requestId}] 请求验证通过`);

    logger.info("Request validated", {
      platforms: data.platforms,
      templateId: data.styleTemplate,
      textLength: data.text.length,
    });

    // ==================== Check user quota ====================
    const session = await auth();
    if (session?.user?.id) {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
      });

      if (subscription) {
        const quotaLimit = QUOTA_LIMITS[subscription.planType];

        if (quotaLimit !== -1) {
          const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
          const used = await prisma.usageRecord.count({
            where: {
              subscriptionId: subscription.id,
              type: "COVER_GENERATION",
              createdAt: { gte: monthStart },
            },
          });

          if (used >= quotaLimit) {
            console.log(`[DEBUG][${requestId}] 配额超限: ${used}/${quotaLimit}`);
            return ApiResponse.error(
              new Error(`Monthly quota exceeded (${used}/${quotaLimit}). Please upgrade your plan.`),
              429
            );
          }

          console.log(`[DEBUG][${requestId}] 配额检查通过: ${used}/${quotaLimit} remaining`);
        }
      }
    }

    // Create job
    const jobId = uuidv4();
    console.log(`[DEBUG][${requestId}] 创建任务 jobId=${jobId}`);
    const job = {
      id: jobId,
      status: "pending",
      request: data,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0,
    };

    jobs.set(jobId, job);

    // Start async processing
    console.log(`[DEBUG][${requestId}] 启动异步处理任务...`);
    processJob(jobId, data, logger).catch(error => {
      console.error(`[DEBUG][${requestId}] 异步任务处理失败:`, error);
      logger.error("Job processing failed", { jobId, error: error.message });
      const currentJob = jobs.get(jobId);
      if (currentJob) {
        currentJob.status = "failed";
        currentJob.error = error.message;
        currentJob.updatedAt = new Date();
      }
    });

    logger.info("Job created", { jobId });
    console.log(`[DEBUG][${requestId}] 返回成功响应，jobId=${jobId}`);

    return ApiResponse.success(
      { jobId },
      {
        requestId,
        timestamp: new Date().toISOString(),
      }
    );
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[DEBUG][${requestId}] handlePostRequest 内部异常:`, error);
    console.error(`[DEBUG][${requestId}] 错误堆栈:`, error?.stack);
    logger.error("Unexpected error", { error: errorMessage });

    // 抛出错误让外层 debugWrapper 捕获并返回详细信息
    throw error;
  }
}

// ==================== 直接导出 debugWrapper，绕过中间件链进行调试 ====================
// 注意：调试完成后，请恢复为原来的中间件链
export const POST = debugWrapper;

// 原始中间件链（调试完成后取消注释并删除上面的 debugWrapper 导出）
// export const POST = apiRateLimiters.generate(
//   withAnalytics(
//     withModeration(handlePostRequest, {
//       fields: ['text'], // Moderate the text field
//       mode: 'block', // Block flagged content
//     }),
//     {
//       trackPerformance: true,
//       trackErrors: true,
//       trackEndpointUsage: true,
//       sampleRate: 1, // Track all generation requests for analytics
//       customProperties: (req, duration, success) => ({
//         generation_type: 'cover',
//         platforms: JSON.parse(req.headers.get('x-platforms') || '[]'),
//         template: req.headers.get('x-template'),
//         user_agent: req.headers.get('user-agent'),
//       }),
//     }
//   )
// );

async function processJob(
  jobId: string,
  requestData: any,
  logger: any
) {
  console.log(`[DEBUG][processJob] 开始处理任务 jobId=${jobId}`);
  const job = jobs.get(jobId);
  if (!job) {
    console.log(`[DEBUG][processJob] 任务不存在 jobId=${jobId}`);
    return;
  }

  // Update status to processing
  job.status = "processing";
  job.progress = 0;
  job.updatedAt = new Date();
  jobs.set(jobId, job);

  const processingStartTime = Date.now();
  logger.info("Starting job processing", { jobId });

  try {
    // Track job start
    console.log(`[DEBUG][processJob] 追踪分析事件...`);
    analytics.track("generation_started", {
      job_id: jobId,
      platforms: requestData.platforms,
      template: requestData.styleTemplate,
      text_length: requestData.text.length,
    });

    console.log(`[DEBUG][processJob] 调用 coverPipeline.executeWithProgress...`);
    const results = await coverPipeline.executeWithProgress(
      requestData,
      (step, progress) => {
        // Update job progress
        const currentJob = jobs.get(jobId);
        if (currentJob) {
          currentJob.progress = progress;
          currentJob.updatedAt = new Date();
          jobs.set(jobId, currentJob);
        }

        // Track progress milestones
        if (progress % 25 === 0) { // Every 25%
          analytics.track("generation_progress", {
            job_id: jobId,
            step,
            progress,
          });
        }

        console.log(`[DEBUG][processJob] 进度更新: ${step} - ${progress}%`);
        logger.debug("Job progress", { jobId, step, progress });
      }
    );

    const processingTime = Date.now() - processingStartTime;
    console.log(`[DEBUG][processJob] 任务完成，耗时 ${processingTime}ms，结果数量: ${results.length}`);

    // Mark as completed
    job.status = "completed";
    job.results = results;
    job.progress = 100;
    job.updatedAt = new Date();
    jobs.set(jobId, job);

    // Track successful completion
    analytics.trackGeneration({
      textLength: requestData.text.length,
      language: "zh-CN", // Could be detected
      sentiment: "neutral", // Could be analyzed
      topics: ["general"], // Could be extracted
      platforms: requestData.platforms,
      primaryPlatform: requestData.platforms[0] || "unknown",
      templateId: requestData.styleTemplate,
      templateCategory: "general", // Could be determined
      customizations: [], // Could track user customizations
      processingTime,
      success: true,
      titlesGenerated: results.length,
      imagesGenerated: results.length,
    });

    // Track generation analytics
    analytics.track("generation_completed", {
      job_id: jobId,
      processing_time: processingTime,
      results_count: results.length,
      platforms: requestData.platforms,
      template: requestData.styleTemplate,
    });

    // ==================== Record usage for authenticated users ====================
    const session = await auth();
    if (session?.user?.id) {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
      });
      if (subscription) {
        await prisma.usageRecord.create({
          data: {
            userId: session.user.id,
            subscriptionId: subscription.id,
            type: "COVER_GENERATION",
            quantity: results.length,
            metadata: {
              jobId,
              platforms: requestData.platforms,
              template: requestData.styleTemplate,
            },
          },
        });
        console.log(`[DEBUG][processJob] 使用量已记录: userId=${session.user.id}, quantity=${results.length}`);
      }
    }

    logger.info("Job completed", { jobId, resultsCount: results.length, processingTime });
  } catch (error: any) {
    const processingTime = Date.now() - processingStartTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error(`[DEBUG][processJob] 任务失败 jobId=${jobId}:`, error);
    console.error(`[DEBUG][processJob] 错误堆栈:`, error?.stack);

    // Mark as failed
    job.status = "failed";
    job.error = errorMessage;
    job.updatedAt = new Date();
    jobs.set(jobId, job);

    // Track failure
    analytics.trackGeneration({
      textLength: requestData.text.length,
      topics: [],
      platforms: requestData.platforms,
      primaryPlatform: requestData.platforms[0] || "unknown",
      templateId: requestData.styleTemplate,
      templateCategory: "general",
      customizations: [],
      processingTime,
      success: false,
      errorType: error instanceof Error ? error.name : "Unknown",
      titlesGenerated: 0,
      imagesGenerated: 0,
    });

    analytics.track("generation_failed", {
      job_id: jobId,
      error_name: error instanceof Error ? error.name : "Unknown",
      error_message: errorMessage,
      processing_time: processingTime,
      platforms: requestData.platforms,
    });

    logger.error("Job failed", { jobId, error: errorMessage });
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const requestId = uuidv4();
  const logger = createRequestLogger(requestId);

  try {
    // List all jobs (for development/debugging)
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let allJobs = Array.from(jobs.values());

    if (status) {
      allJobs = allJobs.filter(job => job.status === status);
    }

    // Sort by creation date (newest first)
    allJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Add CORS headers
    const response = ApiResponse.paginated(
      allJobs,
      {
        page: 1,
        limit: allJobs.length,
        total: allJobs.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
      { requestId }
    );

    logger.info("Jobs listed", { count: allJobs.length });
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to list jobs", { error: errorMessage });
    return ApiResponse.error(
      error instanceof Error ? error : new Error(errorMessage),
      500,
      { requestId }
    );
  }
}