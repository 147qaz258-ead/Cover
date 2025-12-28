import { StyleTemplate, Platform } from "@/types";
import {
  getOpenAIProvider,
  getReplicateProvider,
  createOpenAICompatibleProvider,
  GeminiImageProvider,
} from "@/lib/ai/providers";
import { getModelRegistry, ImageModelConfig, toPublicModelInfo } from "@/lib/ai/config";
import { uploadImage } from "@/lib/storage";
import { logger } from "@/lib/utils/logger";
import { v4 as uuidv4 } from "uuid";
import { CacheKeyGenerator, CacheFactory, CacheConfigPresets } from "@/lib/cache/cache";
import { optimizeImage, generateWebPUrl } from "@/lib/image/optimization";

// 注意：LLM 提示词生成已移至 CoverCreativeDirector
// 本 Agent 仅负责调用图片生成 API

// ==================== 常量配置 ====================

/** 最大重试次数 */
const MAX_RETRIES = 3;

/** 基础重试延迟（毫秒） */
const BASE_RETRY_DELAY = 1000;

// ==================== 类型定义 ====================

export interface ImageGenerationRequest {
  title: string;
  platform: Platform;
  template: StyleTemplate;
  /** 指定的模型 ID（可选，默认使用注册表中的默认模型） */
  modelId?: string;
  /** 视觉风格提示词片段（可选，用于替换 [STYLE_PLACEHOLDER]） */
  visualStylePrompt?: string;
  /** 外部提供的图片提示词（可选，由 CreativeDirector 生成） */
  externalImagePrompt?: string;
  customizations?: {
    backgroundColor?: string;
    textColor?: string;
  };
}

// ==================== 辅助函数 ====================

/**
 * 延迟执行
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 获取平台对应的宽高比
 */
function getAspectRatio(platform: Platform): string {
  // 直接使用 platform 中的 aspectRatio
  return platform.aspectRatio || "1:1";
}

/**
 * 将宽高比转换为 OpenAI 尺寸格式
 */
function getSizeForAspectRatio(aspectRatio: string): string {
  const sizeMap: Record<string, string> = {
    "1:1": "1024x1024",
    "9:16": "1024x1792",
    "16:9": "1792x1024",
    "3:2": "1024x1024", // 近似
    "2:3": "1024x1792", // 近似
    "4:3": "1024x1024", // 近似
    "3:4": "1024x1792", // 近似
  };
  return sizeMap[aspectRatio] || "1024x1024";
}

// ==================== ImageGenerationAgent ====================

export class ImageGenerationAgent {
  private readonly agentLogger = logger.child({ agent: "ImageGenerator" });
  private readonly imageCache = CacheFactory.getInstance(CacheConfigPresets.images);
  private readonly registry = getModelRegistry();

  /**
   * 生成图像
   */
  async generateImage(request: ImageGenerationRequest): Promise<string> {
    this.agentLogger.info("Starting image generation", {
      title: request.title,
      platformId: request.platform.id,
      templateId: request.template.id,
      modelId: request.modelId || "default",
    });

    try {
      // 获取模型配置
      let modelConfig: ImageModelConfig;
      if (request.modelId) {
        const config = this.registry.getModel(request.modelId);
        if (!config) {
          throw new Error(`Model not found: ${request.modelId}`);
        }
        modelConfig = config;
        console.log(`\n[ImageGenerator] ==================== 模型选择 ====================`);
        console.log(`[ImageGenerator] 📌 用户指定模型: ${request.modelId}`);
        console.log(`[ImageGenerator] ✅ 使用模型: ${modelConfig.name} (${modelConfig.id})`);
        console.log(`[ImageGenerator] 🔌 Provider: ${modelConfig.displayProvider || modelConfig.provider}`);
      } else {
        modelConfig = this.registry.getDefaultModel();
        console.log(`\n[ImageGenerator] ==================== 模型选择 ====================`);
        console.log(`[ImageGenerator] 📌 用户未指定模型，使用默认`);
        console.log(`[ImageGenerator] ✅ 默认模型: ${modelConfig.name} (${modelConfig.id})`);
        console.log(`[ImageGenerator] 🔌 Provider: ${modelConfig.provider}`);
      }

      // 检查缓存
      const cacheKey = CacheKeyGenerator.imageGeneration(
        modelConfig.id,
        request.title,
        request.template.id,
        {
          width: request.platform.dimensions.width,
          height: request.platform.dimensions.height,
        }
      );

      const cachedUrl = await this.imageCache.get(cacheKey) as string | undefined;
      if (cachedUrl) {
        this.agentLogger.info("Image found in cache", { url: cachedUrl });
        return cachedUrl;
      }

      // 生成提示词（使用 LLM 设计师）
      const prompt = await this.buildImagePrompt(request);

      // 使用重试和降级逻辑生成图像
      const imageResult = await this.generateWithFallback(prompt, modelConfig, request);

      // 保存到存储（本地或 R2，由环境变量决定）
      const imageUrl = await this.saveImage(imageResult, request);

      // 缓存结果
      await this.imageCache.set(cacheKey, imageUrl, 1800); // 30 分钟

      this.agentLogger.info("Image generation completed", {
        imageUrl,
        platformId: request.platform.id,
        modelId: modelConfig.id,
      });

      return imageUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.agentLogger.error("Image generation failed", {
        error: errorMessage,
        title: request.title,
      });
      throw new Error(`Failed to generate image: ${errorMessage}`);
    }
  }

  /**
   * 带重试和降级的图像生成
   */
  private async generateWithFallback(
    prompt: string,
    config: ImageModelConfig,
    request: ImageGenerationRequest,
    attempt: number = 1
  ): Promise<string | Buffer> {
    try {
      return await this.generateWithModel(prompt, config, request);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      this.agentLogger.warn("Generation failed, attempting recovery", {
        model: config.id,
        attempt,
        error: errorMessage,
      });

      // 重试逻辑
      if (attempt < MAX_RETRIES) {
        const delayMs = BASE_RETRY_DELAY * Math.pow(2, attempt - 1);
        this.agentLogger.info(`Retrying in ${delayMs}ms...`, { model: config.id, attempt });
        await delay(delayMs);
        return this.generateWithFallback(prompt, config, request, attempt + 1);
      }

      // 降级逻辑
      if (config.fallbackTo) {
        const fallbackConfig = this.registry.getModel(config.fallbackTo);
        if (fallbackConfig) {
          this.agentLogger.info("Falling back to alternative model", {
            from: config.id,
            to: fallbackConfig.id,
          });
          return this.generateWithFallback(prompt, fallbackConfig, request, 1);
        }
      }

      // 无法恢复，抛出错误
      throw error;
    }
  }

  /**
   * 根据模型配置调用对应的 Provider
   */
  private async generateWithModel(
    prompt: string,
    config: ImageModelConfig,
    request: ImageGenerationRequest
  ): Promise<string | Buffer> {
    const aspectRatio = getAspectRatio(request.platform);

    switch (config.provider) {
      case "openai-compatible": {
        const apiKey = process.env[config.endpoint.apiKeyEnv];
        if (!apiKey) {
          throw new Error(`API key not configured: ${config.endpoint.apiKeyEnv}`);
        }

        const provider = createOpenAICompatibleProvider(apiKey, config.endpoint.baseURL);

        // 判断是使用 aspectRatio 还是 size
        const useAspectRatio = config.capabilities.aspectRatios &&
          config.capabilities.aspectRatios.length > 0;

        console.log(`\n[ImageGenerator] ==================== API 请求详情 ====================`);
        console.log(`[ImageGenerator] 🎯 模型: ${config.model}`);
        console.log(`[ImageGenerator] 🌐 Endpoint: ${config.endpoint.baseURL}`);
        console.log(`[ImageGenerator] 📐 宽高比: ${aspectRatio}`);
        console.log(`[ImageGenerator] 📏 尺寸: ${useAspectRatio ? '(使用宽高比)' : getSizeForAspectRatio(aspectRatio)}`);
        console.log(`[ImageGenerator] 📝 Prompt 长度: ${prompt.length} 字符`);
        console.log(`[ImageGenerator] 📝 Prompt 内容:\n${prompt}`);
        console.log(`[ImageGenerator] ======================================================\n`);

        const imageUrl = await provider.generateImage(prompt, {
          model: config.model,
          size: useAspectRatio ? undefined : getSizeForAspectRatio(aspectRatio),
          aspectRatio: useAspectRatio ? aspectRatio : undefined,
          quality: request.platform.id === "taobao" || request.platform.id === "wechat" ? "hd" : "standard",
          extraBody: config.extraParams,
        });

        console.log(`[ImageGenerator] ✅ 图像生成成功，URL: ${typeof imageUrl === 'string' ? imageUrl.substring(0, 80) : '[Buffer]'}...`);
        return imageUrl;
      }

      case "gemini": {
        const apiKey = process.env[config.endpoint.apiKeyEnv];
        if (!apiKey) {
          throw new Error(`API key not configured: ${config.endpoint.apiKeyEnv}`);
        }

        const provider = new GeminiImageProvider(apiKey);

        const buffer = await provider.generateImage(prompt, {
          model: config.model,
          aspectRatio,
          imageSize: config.capabilities.maxResolution,
        });

        return buffer;
      }

      case "replicate": {
        // 使用现有的 Replicate Provider
        const provider = getReplicateProvider();
        const images = await provider.generateImage(prompt, {
          width: request.platform.dimensions.width,
          height: request.platform.dimensions.height,
          num_inference_steps: 30,
          guidance_scale: 7.5,
        });

        // 校验：Provider 必须返回有效图片
        if (!images || images.length === 0 || !images[0]) {
          throw new Error("Replicate provider returned no images");
        }
        return images[0];
      }

      default:
        throw new Error(`Unsupported provider type: ${(config as any).provider}`);
    }
  }

  /**
   * 构建图像提示词
   *
   * 重构说明（2025-12-24 → 2025-12-25）：
   * - 提示词生成已统一由 CoverCreativeDirector 完成
   * - 2025-12-25: LLM 输出改为纯文本格式，需要提取【图片生成提示词】部分
   * - 本方法负责从纯文本中提取图片生成提示词
   * - 如果没有外部提示词，则抛出错误（必须先调用 CreativeDirector）
   */
  private async buildImagePrompt(request: ImageGenerationRequest): Promise<string> {
    const { externalImagePrompt, visualStylePrompt } = request;

    // 必须有外部提示词（来自 CreativeDirector）
    if (!externalImagePrompt) {
      this.agentLogger.error('Missing externalImagePrompt - CreativeDirector must be called first');
      throw new Error('ImagePrompt is required. CreativeDirector must be called first.');
    }

    console.log('[ImageGenerator] 📄 使用 CreativeDirector 输出的纯文本提示词');

    // 提取【图片生成提示词】部分
    // 注意：【核心内容】【视觉设计】【排版设计】【技术规格】是图片提示词的子级结构
    // 只在遇到顶级标记（【内容理解】【标题建议】或文本末尾）时停止
    const promptMatch = externalImagePrompt.match(/【图片生成提示词】\n([\s\S]+?)(?=\n【内容理解】|\n【标题建议】|$)/);
    let finalPrompt = promptMatch ? promptMatch[1].trim() : '';

    // 如果正则没有匹配到，尝试获取【图片生成提示词】之后的所有内容
    if (!finalPrompt) {
      const startIndex = externalImagePrompt.indexOf('【图片生成提示词】');
      if (startIndex !== -1) {
        finalPrompt = externalImagePrompt.substring(startIndex + '【图片生成提示词】'.length).trim();
      }
    }

    // 如果仍然没有提取到，使用完整的纯文本（fallback）
    if (!finalPrompt) {
      console.warn('[ImageGenerator] ⚠️ 无法提取【图片生成提示词】，使用完整文本');
      finalPrompt = externalImagePrompt.trim();
    }

    console.log(`[ImageGenerator] 📄 提取的图片提示词长度: ${finalPrompt.length} 字符`);
    console.log(`[ImageGenerator] 📄 提取的图片提示词内容:\n${finalPrompt}`);

    // 风格注入（如果提取的提示词包含占位符）
    if (finalPrompt.includes('[STYLE_PLACEHOLDER]')) {
      if (visualStylePrompt) {
        finalPrompt = finalPrompt.replace('[STYLE_PLACEHOLDER]', visualStylePrompt);
        console.log('[ImageGenerator] 🖌️ 已注入风格模板');
      } else {
        // 移除占位符
        finalPrompt = finalPrompt.replace('[STYLE_PLACEHOLDER]', '');
      }
    }

    // 清理多余空格（但保留换行结构）
    return finalPrompt.replace(/[ \t]+/g, ' ').trim();
  }

  /**
   * 保存图像到存储
   * 支持 URL 和 Buffer 两种输入
   * 依赖：Flydrive 存储适配层
   */
  private async saveImage(
    imageData: string | Buffer,
    request: ImageGenerationRequest
  ): Promise<string> {
    let imageBuffer: Uint8Array;

    if (typeof imageData === "string") {
      // ==================== 输入校验 ====================
      if (!imageData || imageData.trim() === "") {
        throw new Error("Image URL is empty");
      }
      // URL 格式校验
      try {
        new URL(imageData);
      } catch {
        throw new Error(`Invalid image URL format: ${imageData}`);
      }

      // URL 输入：下载图像
      const response = await fetch(imageData);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      imageBuffer = new Uint8Array(await response.arrayBuffer());
    } else {
      // Buffer 输入：直接使用
      imageBuffer = Buffer.isBuffer(imageData)
        ? new Uint8Array(imageData)
        : new Uint8Array(imageData as ArrayBuffer);
    }

    // 优化图像
    const optimized = await optimizeImage(Buffer.from(imageBuffer), {
      format: "webp",
      quality: 85,
      width: request.platform.dimensions.width,
      height: request.platform.dimensions.height,
      fit: "inside",
      stripMetadata: true,
    });

    // 生成文件名
    const filename = `covers/${request.platform.id}/${uuidv4()}.webp`;

    // 上传到存储（依赖 Flydrive 存储适配层）
    const result = await uploadImage(filename, optimized.buffer, "image/webp");

    this.agentLogger.info("Image optimized and uploaded", {
      key: result.key,
      url: result.url,
      originalSize: imageBuffer.length,
      optimizedSize: optimized.size,
      compressionRatio: optimized.compressionRatio,
      format: optimized.format,
    });

    // 生成最终 URL
    // 注意：generateWebPUrl 仅用于 Cloudflare R2 Image Resizing
    // 本地存储模式直接返回原始 URL
    const isLocalStorage = process.env.STORAGE_MODE !== 'r2';
    if (isLocalStorage) {
      return result.url;
    }

    // R2 模式：添加 Image Resizing 参数
    const webpUrl = generateWebPUrl(result.url, {
      width: request.platform.dimensions.width,
      height: request.platform.dimensions.height,
      quality: 85,
    });

    return webpUrl;
  }

  /**
   * 获取可用模型列表（供 API 使用）
   */
  getAvailableModels() {
    return this.registry.getAvailableModels().map(toPublicModelInfo);
  }
}

// ==================== 导出单例 ====================

export const imageGenerator = new ImageGenerationAgent();