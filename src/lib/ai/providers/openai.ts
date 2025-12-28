import { OpenAI } from "openai";

// ==================== OpenAI Provider ====================
// 支持官方 OpenAI API 和兼容接口（如老张 API 中转站）

/**
 * 图像生成选项
 */
export interface ImageGenerateOptions {
  /** 模型名称 */
  model?: string;
  /** 图像尺寸 (OpenAI 格式) */
  size?: string;
  /** 图像质量 */
  quality?: string;
  /** 生成数量 */
  n?: number;
  /** 宽高比 (Flux 模型使用) */
  aspectRatio?: string;
  /** 额外参数，传递给 extra_body */
  extraBody?: Record<string, unknown>;
}

export class OpenAIProvider {
  private client: OpenAI;
  private readonly baseURL: string;

  /**
   * 创建 OpenAI Provider
   * @param apiKey API 密钥
   * @param baseURL 自定义 API 端点（默认使用 OpenAI 官方）
   */
  constructor(apiKey: string, baseURL?: string) {
    this.baseURL = baseURL || "https://api.openai.com/v1";
    this.client = new OpenAI({
      apiKey,
      baseURL: this.baseURL,
    });
  }

  /**
   * 文本生成 (使用 OpenAI 兼容的 Chat Completions API)
   * 支持官方 OpenAI、火山引擎、智谱等兼容接口
   */
  async generateText(prompt: string, options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }) {
    const model = options?.model || "gpt-3.5-turbo";
    const maxTokens = options?.maxTokens || 2048;
    const temperature = options?.temperature || 0.7;

    console.log(`\n[OpenAIProvider] ==================== LLM 请求 ====================`);
    console.log(`[OpenAIProvider] 🌐 Base URL: ${this.baseURL}`);
    console.log(`[OpenAIProvider] 🤖 Model: ${model}`);
    console.log(`[OpenAIProvider] 📊 Max Tokens: ${maxTokens}`);
    console.log(`[OpenAIProvider] 🌡️ Temperature: ${temperature}`);
    console.log(`[OpenAIProvider] 📤 Prompt 长度: ${prompt.length} 字符`);

    const startTime = Date.now();

    // 使用标准的 Chat Completions API（火山引擎、智谱等均支持）
    const completion = await this.client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature,
    });

    const elapsed = Date.now() - startTime;
    const responseText = completion.choices[0]?.message?.content || "";

    console.log(`\n[OpenAIProvider] ==================== LLM 响应 ====================`);
    console.log(`[OpenAIProvider] ⏱️ 耗时: ${elapsed}ms`);
    console.log(`[OpenAIProvider] 📥 响应长度: ${responseText.length} 字符`);
    console.log(`[OpenAIProvider] 💬 Finish Reason: ${completion.choices[0]?.finish_reason || 'unknown'}`);
    if (completion.usage) {
      console.log(`[OpenAIProvider] 💰 Token 用量: prompt=${completion.usage.prompt_tokens}, completion=${completion.usage.completion_tokens}, total=${completion.usage.total_tokens}`);
    }
    console.log(`[OpenAIProvider] ==================== 响应内容 ====================`);
    console.log(responseText);
    console.log(`[OpenAIProvider] ==================== 响应结束 ====================\n`);

    return responseText;
  }

  /**
   * 图像生成
   * 支持 OpenAI 和 Flux 模型参数
   */
  /**
   * 图像生成
   * 支持 OpenAI 和 Flux 模型参数
   * 同时处理 url 和 b64_json 两种响应格式
   */
  async generateImage(prompt: string, options?: ImageGenerateOptions): Promise<string | Buffer> {
    // 构建请求参数
    const requestParams: Parameters<typeof this.client.images.generate>[0] = {
      model: options?.model || "dall-e-3",
      prompt,
      size: (options?.size as any) || "1024x1024",
      quality: (options?.quality as any) || "standard",
      n: options?.n || 1,
    };

    // 处理 Flux 模型的 extra_body 参数
    if (options?.extraBody || options?.aspectRatio) {
      const extraBody: Record<string, unknown> = {
        ...options?.extraBody,
      };

      // Flux 模型使用 aspect_ratio 而非 size
      if (options?.aspectRatio) {
        extraBody.aspect_ratio = options.aspectRatio;
      }

      // 使用类型断言添加 extra_body
      (requestParams as any).extra_body = extraBody;
    }

    const response = await this.client.images.generate(requestParams);
    const imageData = response.data[0];

    // ==================== 响应校验与格式处理 ====================
    if (!imageData) {
      throw new Error(`Image generation failed: API returned no image data (model: ${requestParams.model})`);
    }

    // 优先使用 URL（大多数模型）
    if (imageData.url && imageData.url.trim() !== "") {
      return imageData.url;
    }

    // 备选：使用 b64_json（某些模型如 Gemini 通过中转站）
    if (imageData.b64_json && imageData.b64_json.trim() !== "") {
      // 将 Base64 转换为 Buffer，供下游 saveImage 直接处理
      return Buffer.from(imageData.b64_json, "base64");
    }

    // 两者都为空，抛出明确错误（不再静默返回空字符串）
    throw new Error(
      `Image generation failed: API returned empty image data ` +
      `(model: ${requestParams.model}, hasUrl: ${!!imageData.url}, hasB64: ${!!imageData.b64_json})`
    );
  }

  /**
   * 内容审核
   */
  async moderateText(content: string) {
    const moderation = await this.client.moderations.create({
      input: content,
    });

    return moderation.results[0];
  }

  /**
   * 获取当前使用的 baseURL
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}

// ==================== 单例管理 ====================

let openAIInstance: OpenAIProvider | null = null;

/**
 * 获取官方 OpenAI Provider 单例
 * @deprecated 推荐使用 createOpenAICompatibleProvider 以支持多端点
 */
export function getOpenAIProvider(): OpenAIProvider {
  if (!openAIInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }
    openAIInstance = new OpenAIProvider(apiKey);
  }
  return openAIInstance;
}

// ==================== 工厂函数 ====================

/**
 * 创建 OpenAI 兼容 Provider（支持自定义端点）
 * 用于连接老张 API 中转站等兼容 API
 * 
 * @param apiKey API 密钥
 * @param baseURL API 端点 URL
 * @returns OpenAIProvider 实例
 * 
 * @example
 * ```typescript
 * const provider = createOpenAICompatibleProvider(
 *   process.env.LAOZHANG_API_KEY!,
 *   "https://api.laozhang.ai/v1"
 * );
 * const imageUrl = await provider.generateImage("A cat", {
 *   model: "flux-kontext-pro",
 *   aspectRatio: "16:9",
 *   extraBody: { prompt_upsampling: true }
 * });
 * ```
 */
export function createOpenAICompatibleProvider(
  apiKey: string,
  baseURL: string
): OpenAIProvider {
  return new OpenAIProvider(apiKey, baseURL);
}