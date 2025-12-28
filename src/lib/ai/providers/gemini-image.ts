// ==================== Gemini Image Provider ====================
// 使用 @google/genai SDK 实现 Gemini 图像生成

import { GoogleGenAI } from "@google/genai";

/**
 * Gemini 图像生成选项
 */
export interface GeminiImageOptions {
    /** 模型名称 */
    model?: "gemini-2.5-flash-image" | "gemini-3-pro-image-preview" | string;
    /** 宽高比 */
    aspectRatio?: string;
    /** 输出分辨率（仅 gemini-3-pro-image-preview 支持） */
    imageSize?: "1K" | "2K" | "4K";
}

/**
 * Gemini 图像生成 Provider
 * 
 * 支持的模型：
 * - gemini-2.5-flash-image (Nano Banana): 速度快，1024px 分辨率
 * - gemini-3-pro-image-preview (Nano Banana Pro): 专业级，支持最高 4K 分辨率
 */
export class GeminiImageProvider {
    private client: GoogleGenAI;

    /**
     * 创建 Gemini Image Provider 
     * @param apiKey Google AI API 密钥
     */
    constructor(apiKey: string) {
        this.client = new GoogleGenAI({ apiKey });
    }

    /**
     * 生成图像
     * @param prompt 提示词
     * @param options 生成选项
     * @returns 图像 Buffer
     */
    async generateImage(
        prompt: string,
        options?: GeminiImageOptions
    ): Promise<Buffer> {
        const model = options?.model || "gemini-2.5-flash-image";

        // 构建配置
        const config: Record<string, unknown> = {
            responseModalities: ["Image"],
        };

        // 添加图像配置
        const imageConfig: Record<string, unknown> = {};

        if (options?.aspectRatio) {
            imageConfig.aspectRatio = options.aspectRatio;
        }

        // imageSize 仅 gemini-3-pro-image-preview 支持
        if (options?.imageSize && model.includes("gemini-3-pro")) {
            imageConfig.imageSize = options.imageSize;
        }

        if (Object.keys(imageConfig).length > 0) {
            config.imageConfig = imageConfig;
        }

        // 调用 API
        const response = await this.client.models.generateContent({
            model,
            contents: prompt,
            config,
        });

        // 解析响应
        const candidates = response.candidates;
        if (!candidates || candidates.length === 0) {
            throw new Error("Gemini did not return any candidates");
        }

        const content = candidates[0]?.content;
        if (!content || !content.parts) {
            throw new Error("Gemini response has no content parts");
        }

        // 查找包含图像数据的 part
        for (const part of content.parts) {
            // @ts-ignore - inlineData 在类型中可能未定义
            if (part.inlineData?.data) {
                // @ts-ignore
                const base64Data = part.inlineData.data as string;
                return Buffer.from(base64Data, "base64");
            }
        }

        throw new Error(
            "Gemini response does not contain image data. " +
            "The model may have returned text instead of an image."
        );
    }
}

// ==================== 单例管理 ====================

let geminiImageInstance: GeminiImageProvider | null = null;

/**
 * 获取 Gemini Image Provider 单例
 */
export function getGeminiImageProvider(): GeminiImageProvider {
    if (!geminiImageInstance) {
        const apiKey = process.env.GOOGLE_AI_API_KEY;
        if (!apiKey) {
            throw new Error("Google AI API key not configured (GOOGLE_AI_API_KEY)");
        }
        geminiImageInstance = new GeminiImageProvider(apiKey);
    }
    return geminiImageInstance;
}

/**
 * 创建 Gemini Image Provider（用于自定义场景）
 */
export function createGeminiImageProvider(apiKey: string): GeminiImageProvider {
    return new GeminiImageProvider(apiKey);
}
