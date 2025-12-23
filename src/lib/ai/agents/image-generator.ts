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
import { loadAndInterpolate } from "@/lib/ai/prompts/loader";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
        console.log(`[ImageGenerator] 🔌 Provider: ${modelConfig.provider}`);
        console.log(`[ImageGenerator] 💰 价格: $${modelConfig.pricing?.perImage || 'N/A'}/张`);
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
   * 支持：1) 外部提示词（来自 CreativeDirector）  2) LLM 设计师生成  3) Fallback 硬编码
   */
  private async buildImagePrompt(request: ImageGenerationRequest): Promise<string> {
    const { title, platform, visualStylePrompt, externalImagePrompt } = request;

    // 优先使用外部提供的提示词（来自 CreativeDirector）
    if (externalImagePrompt) {
      console.log('[ImageGenerator] 🎯 使用 CreativeDirector 生成的提示词');
      return externalImagePrompt.trim().replace(/\s+/g, ' ');
    }

    try {
      // 1. 加载设计师系统提示词
      const designerPrompt = loadAndInterpolate('designer-prompt.txt', {
        user_content: title,
        platform: platform.name,
        dimensions: `${platform.dimensions.width}x${platform.dimensions.height}`,
      });

      // 2. 调用 LLM 生成基础提示词
      console.log('[ImageGenerator] 🎨 调用设计师 LLM...');
      let imagePrompt = await this.callDesignerLLM(designerPrompt);
      console.log(`[ImageGenerator] 📝 生成提示词: ${imagePrompt.substring(0, 100)}...`);

      // 3. 风格注入
      if (visualStylePrompt) {
        imagePrompt = imagePrompt.replace('[STYLE_PLACEHOLDER]', visualStylePrompt);
        console.log('[ImageGenerator] 🖌️ 已注入风格模板');
      } else {
        // 移除占位符（不替换时删除）
        imagePrompt = imagePrompt.replace('[STYLE_PLACEHOLDER]', '');
      }

      // 清理多余空格
      return imagePrompt.trim().replace(/\s+/g, ' ');
    } catch (error) {
      // LLM 调用失败时，使用简化的硬编码 fallback
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn('[ImageGenerator] ⚠️ LLM 调用失败，使用 fallback 提示词');
      console.warn('[ImageGenerator] ⚠️ 错误详情:', errorMsg);
      return this.buildFallbackPrompt(request);
    }
  }

  /**
   * 调用设计师 LLM 生成提示词
   */
  private async callDesignerLLM(prompt: string): Promise<string> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY 未配置');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }

  /**
   * Fallback 提示词生成（当 LLM 不可用时）
   */
  private buildFallbackPrompt(request: ImageGenerationRequest): string {
    const { title, platform, template, visualStylePrompt, customizations } = request;

    let prompt = `Create a professional social media cover image with the title: "${title}".`;

    const platformPrompts: Record<string, string> = {
      xiaohongshu: "minimalist design, clean layout, lifestyle photography, soft colors",
      wechat: "professional design, corporate colors, clean typography",
      taobao: "product-focused, bright colors, promotional design, e-commerce style",
      douyin: "dynamic composition, vibrant colors, trending aesthetics",
      weibo: "social media style, hashtag-friendly, shareable design",
      bilibili: "anime-inspired or tech aesthetic, bold typography, gaming culture",
      zhihu: "intellectual design, blue color scheme, knowledge-based imagery",
    };

    prompt += ` Style: ${platformPrompts[platform.id] || "professional social media design"}.`;

    // 注入视觉风格
    if (visualStylePrompt) {
      prompt += ` ${visualStylePrompt}.`;
    }

    prompt += ` Color scheme: ${template.backgroundColor} background, ${template.textColor} text.`;

    if (customizations?.backgroundColor) {
      prompt += ` Background color: ${customizations.backgroundColor}.`;
    }

    prompt += ` High resolution, professional quality, suitable for ${platform.dimensions.width}x${platform.dimensions.height} pixels.`;

    return prompt;
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

    // 生成 WebP URL
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