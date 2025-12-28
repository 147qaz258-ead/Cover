import {
  CoverGenerationRequest,
  CoverGenerationResult,
} from "@/types";
import { imageGenerator } from "@/lib/ai/agents/image-generator";
import { getCoverCreativeDirector } from "@/lib/ai/agents/cover-creative-director";
import { getPlatform } from "@/lib/platforms/specs";
import { getStyleTemplate } from "@/data/templates";
import { getVisualStyleTemplate } from "@/lib/ai/prompts/visual-styles";
import { logger } from "@/lib/utils/logger";
import { v4 as uuidv4 } from "uuid";

// ==================== 架构说明 ====================
// 本 Pipeline 使用 CoverCreativeDirector 实现 1 次 LLM 调用
// 合并了文本分析、标题生成、图片提示词生成
// 旧的 TextAnalyzer + TitleGenerator 已废弃（2025-12-23）

export class CoverGenerationPipeline {
  private readonly pipelineLogger = logger.child({ component: "CoverPipeline" });

  async execute(request: CoverGenerationRequest): Promise<CoverGenerationResult[]> {
    console.log('[CoverPipeline] 🚀 使用 CreativeDirector（1 次 LLM 调用）');
    return this.executeWithDirector(request);
  }

  /**
   * 新逻辑：使用 CoverCreativeDirector（1 次 LLM 调用）
   */
  private async executeWithDirector(request: CoverGenerationRequest): Promise<CoverGenerationResult[]> {
    const jobId = uuidv4();
    const requestLogger = logger.child({ jobId });

    requestLogger.info("Starting cover generation with CreativeDirector");

    console.log(`\n[CoverPipeline] ==================== 新的生成请求 ====================`);
    console.log(`[CoverPipeline] 📄 文本长度: ${request.text.length} 字符`);
    console.log(`[CoverPipeline] 🎨 风格模板: ${request.styleTemplate}`);
    console.log(`[CoverPipeline] 📱 目标平台: ${request.platforms.join(', ')}`);
    console.log(`[CoverPipeline] 🤖 指定模型: ${request.modelId || '(未指定，使用默认)'}`);
    console.log(`[CoverPipeline] ⚡ 模式: CreativeDirector（1 次 LLM）`);
    console.log(`[CoverPipeline] ========================================================\n`);

    try {
      const template = getStyleTemplate(request.styleTemplate);
      if (!template) {
        throw new Error(`Style template not found: ${request.styleTemplate}`);
      }

      // 获取视觉风格提示词
      let visualStylePrompt: string | undefined;
      if (request.visualStyleId) {
        const visualStyle = getVisualStyleTemplate(request.visualStyleId);
        if (visualStyle) {
          visualStylePrompt = visualStyle.promptFragment;
          console.log(`[CoverPipeline] 🎨 已选择视觉风格: ${visualStyle.name}`);
        }
      }

      const director = getCoverCreativeDirector();
      const results: CoverGenerationResult[] = [];

      for (const platformId of request.platforms) {
        const platform = getPlatform(platformId);
        if (!platform) {
          throw new Error(`Platform not found: ${platformId}`);
        }

        // Step 1: 调用 CreativeDirector（一次获取分析 + 标题 + 提示词）
        requestLogger.info(`Analyzing and generating for ${platform.name}`);
        const directorOutput = await director.analyze({
          userContent: request.text,
          platform,
          visualStylePrompt,
        });

        // Step 2: 使用 Director 输出的标题和提示词生成图片
        // 2025-12-25: directorOutput.fullText 包含完整纯文本（【内容理解】【标题建议】【图片生成提示词】）
        const bestTitle = directorOutput.titleSuggestions[0]?.text || request.text.substring(0, 20);

        const imageUrl = await imageGenerator.generateImage({
          title: bestTitle,
          platform,
          template,
          modelId: request.modelId,
          visualStylePrompt,
          externalImagePrompt: directorOutput.fullText,
          customizations: request.customizations,
        });

        results.push({
          id: uuidv4(),
          platform,
          imageUrl,
          thumbnailUrl: imageUrl,
          title: bestTitle,
          metadata: {
            fileSize: 0,
            format: "png",
            dimensions: platform.dimensions,
          },
        });
      }

      requestLogger.info("Pipeline (Director) completed", { resultsCount: results.length });
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      requestLogger.error("Pipeline (Director) failed", { error: errorMessage });
      throw error;
    }
  }


  /**
   * 带进度回调的执行方法
   * 进度分配：
   *   0-5%:   初始化/加载配置
   *   5-10%:  准备 CreativeDirector
   *   10-40%: LLM 分析（CreativeDirector）
   *   40-45%: 解析分析结果
   *   45-90%: 图像生成
   *   90-95%: 后处理
   *   95-100%: 完成
   */
  async executeWithProgress(
    request: CoverGenerationRequest,
    onProgress?: (step: string, progress: number) => void
  ): Promise<CoverGenerationResult[]> {
    const jobId = uuidv4();
    const requestLogger = logger.child({ jobId });

    // ==================== 0%: 开始 ====================
    onProgress?.("Starting", 0);
    requestLogger.info("Starting cover generation with progress tracking");

    console.log(`\n[CoverPipeline] ==================== 新的生成请求 ====================`);
    console.log(`[CoverPipeline] 📄 文本长度: ${request.text.length} 字符`);
    console.log(`[CoverPipeline] 🎨 风格模板: ${request.styleTemplate}`);
    console.log(`[CoverPipeline] 📱 目标平台: ${request.platforms.join(', ')}`);
    console.log(`[CoverPipeline] 🤖 指定模型: ${request.modelId || '(未指定，使用默认)'}`);
    console.log(`[CoverPipeline] ⚡ 模式: CreativeDirector（1 次 LLM）`);
    console.log(`[CoverPipeline] ========================================================\n`);

    try {
      // ==================== 5%: 加载模板配置 ====================
      onProgress?.("Loading template", 5);
      const template = getStyleTemplate(request.styleTemplate);
      if (!template) {
        throw new Error(`Style template not found: ${request.styleTemplate}`);
      }

      // 获取视觉风格提示词
      let visualStylePrompt: string | undefined;
      if (request.visualStyleId) {
        const visualStyle = getVisualStyleTemplate(request.visualStyleId);
        if (visualStyle) {
          visualStylePrompt = visualStyle.promptFragment;
          console.log(`[CoverPipeline] 🎨 已选择视觉风格: ${visualStyle.name}`);
        }
      }

      // ==================== 10%: 准备分析 ====================
      onProgress?.("Preparing analysis", 10);
      const director = getCoverCreativeDirector();
      const results: CoverGenerationResult[] = [];
      const totalPlatforms = request.platforms.length;

      for (let i = 0; i < totalPlatforms; i++) {
        const platformId = request.platforms[i];
        const platform = getPlatform(platformId);
        if (!platform) {
          throw new Error(`Platform not found: ${platformId}`);
        }

        // ==================== 10-40%: LLM 分析 ====================
        // 每个平台占用 (40-10)/totalPlatforms 的进度
        const analysisStartProgress = 10 + (i * 30 / totalPlatforms);
        onProgress?.(`Analyzing content for ${platform.name}`, Math.round(analysisStartProgress));

        requestLogger.info(`Analyzing and generating for ${platform.name}`);
        const directorOutput = await director.analyze({
          userContent: request.text,
          platform,
          visualStylePrompt,
        });

        // ==================== 40-45%: 解析结果 ====================
        const analysisEndProgress = 40 + (i * 5 / totalPlatforms);
        onProgress?.(`Analysis complete for ${platform.name}`, Math.round(analysisEndProgress));

        const bestTitle = directorOutput.titleSuggestions[0]?.text || request.text.substring(0, 20);

        // ==================== 45-90%: 图像生成 ====================
        const imageStartProgress = 45 + (i * 45 / totalPlatforms);
        onProgress?.(`Generating image for ${platform.name}`, Math.round(imageStartProgress));

        const imageUrl = await imageGenerator.generateImage({
          title: bestTitle,
          platform,
          template,
          modelId: request.modelId,
          visualStylePrompt,
          externalImagePrompt: directorOutput.fullText,
          customizations: request.customizations,
        });

        // ==================== 90%: 图像完成 ====================
        const imageEndProgress = 90 + (i * 5 / totalPlatforms);
        onProgress?.(`Image generated for ${platform.name}`, Math.round(imageEndProgress));

        results.push({
          id: uuidv4(),
          platform,
          imageUrl,
          thumbnailUrl: imageUrl,
          title: bestTitle,
          metadata: {
            fileSize: 0,
            format: "png",
            dimensions: platform.dimensions,
          },
        });
      }

      // ==================== 95%: 后处理 ====================
      onProgress?.("Processing results", 95);

      // ==================== 100%: 完成 ====================
      onProgress?.("Completed", 100);
      requestLogger.info("Pipeline completed", { resultsCount: results.length });

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      requestLogger.error("Pipeline failed", { error: errorMessage });
      throw error;
    }
  }
}

// ==================== 导出 ====================

export const coverPipeline = new CoverGenerationPipeline();

/**
 * 便捷函数：生成单个封面
 */
export async function generateCover(request: CoverGenerationRequest): Promise<CoverGenerationResult> {
  const results = await coverPipeline.execute(request);
  return results[0];
}