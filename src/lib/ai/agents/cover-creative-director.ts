/**
 * CoverCreativeDirector Agent
 * 
 * 核心目标：将 3 次 LLM 调用合并为 1 次
 * - 替代 TextAnalyzer（分析用户内容）
 * - 替代 TitleGenerator（生成标题）
 * - 替代 buildImagePrompt 中的设计师 LLM（生成图片提示词）
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { OpenAIProvider } from '@/lib/ai/providers/openai';
import { Platform } from '@/types';
import { loadAndInterpolate } from '../prompts/loader';
import { logger } from '@/lib/utils/logger';

// ==================== 类型定义 ====================

/**
 * CreativeDirector 输入参数
 */
export interface CreativeDirectorInput {
    /** 用户原始文本内容 */
    userContent: string;

    /** 目标平台 */
    platform: Platform;

    /** 视觉风格提示词（可选，来自 visual-styles 配置） */
    visualStylePrompt?: string;
}

/**
 * CreativeDirector 输出结构
 * 一次 LLM 调用完成所有工作
 * 2025-12-25: 改为纯文本输出格式
 */
export interface CreativeDirectorOutput {
    /** LLM 输出的完整纯文本（包含【内容理解】【标题建议】【图片生成提示词】） */
    fullText: string;

    /** 提取的标题建议（从纯文本中解析） */
    titleSuggestions: Array<{
        text: string;
        confidence: number;
    }>;
}

// ==================== LLM Provider 配置 ====================

/**
 * LLM Provider 配置
 */
interface LLMProviderConfig {
    /** Provider 标识 */
    id: string;
    /** Provider 类型 */
    type: "gemini" | "zhipuai" | "openai";
    /** API 基础 URL（Gemini SDK 不需要） */
    baseURL?: string;
    /** 模型名称 */
    model: string;
    /** API Key 环境变量名 */
    apiKeyEnv: string;
    /** 显示名称 */
    displayName: string;
}

/**
 * 可用的 LLM Provider 配置
 * 按优先级排列（自动选择时使用）
 */
const LLM_PROVIDERS: LLMProviderConfig[] = [
    {
        id: "volcengine_deepseek_v32",
        type: "zhipuai",  // 使用 OpenAI 兼容模式
        baseURL: "https://ark.cn-beijing.volces.com/api/v3",
        model: "ep-20251225090147-hgwlz",  // 使用 Endpoint ID
        apiKeyEnv: "VOLCENGINE_API_KEY",
        displayName: "火山引擎 DeepSeek V3.2",
    },
    {
        id: "zhipu_glm46",
        type: "zhipuai",
        baseURL: "https://open.bigmodel.cn/api/paas/v4",
        model: "glm-4-flash",
        apiKeyEnv: "ZHIPUAI_API_KEY",
        displayName: "智谱 GLM-4.6 Flash",
    },
    {
        id: "gemini_flash",
        type: "gemini",
        model: "gemini-3.0-flash",
        apiKeyEnv: "GOOGLE_AI_API_KEY",
        displayName: "Gemini 3.0 Flash",
    },
    {
        id: "openai_gpt4o",
        type: "openai",
        baseURL: "https://api.openai.com/v1",
        model: "gpt-4o",
        apiKeyEnv: "OPENAI_API_KEY",
        displayName: "GPT-4o",
    },
];

// ==================== Agent 实现 ====================

const DIRECTOR_PROMPT_FILE = 'creative-director-prompt.txt';
const DEFAULT_MODEL = 'gemini-2.0-flash';
const MAX_RETRIES = 2;

export class CoverCreativeDirector {
    private readonly agentLogger = logger.child({ agent: 'CreativeDirector' });
    private genAI: GoogleGenerativeAI | null = null;
    private openaiProvider: OpenAIProvider | null = null;
    private readonly currentProvider: LLMProviderConfig;

    constructor() {
        // 选择可用的 Provider（按优先级）
        this.currentProvider = this.selectProvider();
        this.agentLogger.info('Provider selected', {
            provider: this.currentProvider.displayName,
            model: this.currentProvider.model,
        });
    }

    /**
     * 综合分析：一次 LLM 调用完成内容分析 + 标题生成 + 图片提示词
     */
    async analyze(input: CreativeDirectorInput): Promise<CreativeDirectorOutput> {
        this.agentLogger.info('Starting creative analysis', {
            contentLength: input.userContent.length,
            platform: input.platform.name,
            hasVisualStyle: !!input.visualStylePrompt,
        });

        console.log('\n[CreativeDirector] ==================== 开始分析 ====================');
        console.log(`[CreativeDirector] 📄 内容长度: ${input.userContent.length} 字符`);
        console.log(`[CreativeDirector] 📱 目标平台: ${input.platform.name}`);
        console.log(`[CreativeDirector] 🎨 视觉风格: ${input.visualStylePrompt ? '已选择' : '未选择'}`);

        try {
            // 加载并插值提示词
            const prompt = this.buildPrompt(input);

            // 调用 LLM
            const response = await this.callLLM(prompt);

            // 解析输出
            const output = this.parseOutput(response, input);

            console.log(`[CreativeDirector] ✅ 分析完成`);
            console.log(`[CreativeDirector] 📝 标题数量: ${output.titleSuggestions.length}`);
            console.log(`[CreativeDirector] 🖼️ 输出文本长度: ${output.fullText.length} 字符`);

            this.agentLogger.info('Creative analysis completed', {
                titlesCount: output.titleSuggestions.length,
                outputLength: output.fullText.length,
            });

            return output;
        } catch (error) {
            this.agentLogger.error('Creative analysis failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            console.error('[CreativeDirector] ❌ 分析失败，使用 fallback');
            return this.buildFallbackOutput(input);
        }
    }

    /**
     * 选择可用的 LLM Provider
     * 按优先级自动检测可用的 API Key
     */
    private selectProvider(): LLMProviderConfig {
        // 支持通过环境变量强制指定
        const preferredProvider = process.env.LLM_PROVIDER;
        if (preferredProvider) {
            const found = LLM_PROVIDERS.find(p => p.id === preferredProvider);
            if (found && process.env[found.apiKeyEnv]) {
                console.log(`[CreativeDirector] 使用指定 Provider: ${found.displayName}`);
                return found;
            }
            console.warn(`[CreativeDirector] 指定的 Provider "${preferredProvider}" 不可用，自动选择其他可用 Provider`);
        }

        // 按优先级查找可用的 API Key
        for (const provider of LLM_PROVIDERS) {
            if (process.env[provider.apiKeyEnv]) {
                console.log(`[CreativeDirector] 自动选择 Provider: ${provider.displayName}`);
                return provider;
            }
        }

        // 无可用 Provider，使用默认 Gemini 配置（让后续调用自然失败并给出明确错误）
        console.warn('[CreativeDirector] 未检测到任何 LLM API Key，将使用默认配置 Gemini 2.0 Flash');
        return LLM_PROVIDERS[1]; // gemini_flash
    }

    /**
     * 构建 LLM 提示词
     * 2025-12-25: 将尺寸和平台信息直接拼接到用户文本前
     */
    private buildPrompt(input: CreativeDirectorInput): string {
        // 将尺寸和平台信息直接拼接到用户文本前
        const prefix = `目标平台：${input.platform.name}（${input.platform.dimensions.width}x${input.platform.dimensions.height}）
视觉风格：${input.visualStylePrompt || '由 AI 决定'}
用户内容：`;

        const fullContent = `${prefix}\n${input.userContent}`;

        try {
            return loadAndInterpolate(DIRECTOR_PROMPT_FILE, {
                user_content: fullContent,
                platform: input.platform.name,
                dimensions: `${input.platform.dimensions.width}x${input.platform.dimensions.height}`,
                visual_style: input.visualStylePrompt || '由你根据内容自行决定合适的风格',
            });
        } catch (error) {
            // 提示词文件不存在时使用内联提示词
            console.warn('[CreativeDirector] 提示词文件不存在，使用内联提示词');
            return this.buildInlinePrompt(input);
        }
    }

    /**
     * 内联提示词（当文件不存在时使用）
     * 2025-12-25: 改为纯文本输出格式
     */
    private buildInlinePrompt(input: CreativeDirectorInput): string {
        return `你是一位世界顶级的社交媒体封面设计师和文案专家。请根据以下信息进行综合分析并输出结果。

# 输入信息
目标平台：${input.platform.name}（${input.platform.dimensions.width}x${input.platform.dimensions.height}）
视觉风格：${input.visualStylePrompt || '由 AI 决定'}
用户内容：
${input.userContent}

# 输出要求
请严格按照以下格式输出纯文本（不要 JSON，不要 markdown 代码块）：

【内容理解】
简要总结用户输入的核心内容（1-2 句话，20字以内）

【标题建议】
1. 标题1（带 emoji，符合${input.platform.name}平台特色）
2. 标题2（带 emoji）
3. 标题3（带 emoji）

【图片生成提示词】
[完整的英文图片生成提示词，100-200 单词]

只输出纯文本，不要 JSON 格式，不要任何其他废话`;
    }

    /**
     * 调用 LLM
     */
    private async callLLM(prompt: string): Promise<string> {
        const config = this.currentProvider;
        const apiKey = process.env[config.apiKeyEnv];

        if (!apiKey) {
            throw new Error(`${config.apiKeyEnv} 未配置。请配置 ${config.apiKeyEnv} 环境变量。`);
        }

        console.log(`[CreativeDirector] 🤖 调用 LLM (Provider: ${config.displayName}, Model: ${config.model})`);
        console.log(`[CreativeDirector] ==================== 发送给 LLM 的提示词 ====================`);
        console.log(prompt);
        console.log(`[CreativeDirector] ==================== 提示词结束 ====================`);

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                let response: string;

                if (config.type === "gemini") {
                    // 使用 Gemini SDK
                    if (!this.genAI) {
                        this.genAI = new GoogleGenerativeAI(apiKey);
                    }
                    const model = this.genAI.getGenerativeModel({
                        model: config.model,
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 2048,
                        },
                    });
                    const result = await model.generateContent(prompt);
                    response = result.response.text().trim();
                } else {
                    // 使用 OpenAI 兼容 SDK（智谱、OpenAI 等）
                    if (!this.openaiProvider) {
                        const { createOpenAICompatibleProvider } = await import("@/lib/ai/providers/openai");
                        this.openaiProvider = createOpenAICompatibleProvider(apiKey, config.baseURL!);
                    }
                    response = await this.openaiProvider.generateText(prompt, {
                        model: config.model,
                        maxTokens: 2048,
                        temperature: 0.7,
                    });
                }

                return response;
            } catch (error) {
                if (attempt === MAX_RETRIES) throw error;
                await this.delay(Math.pow(2, attempt) * 1000);
            }
        }

        throw new Error('LLM 调用失败');
    }

    /**
     * 解析 LLM 输出
     * 2025-12-25: 从 JSON 解析改为纯文本解析
     */
    private parseOutput(response: string, input: CreativeDirectorInput): CreativeDirectorOutput {
        const fullText = response.trim();

        // 提取【标题建议】部分
        const titleMatch = fullText.match(/【标题建议】\n([\s\S]+?)(?=\n【|$)/);
        const titles = titleMatch
            ? this.parseTitlesFromText(titleMatch[1])
            : [{ text: input.userContent.substring(0, 20), confidence: 0.5 }];

        return { fullText, titleSuggestions: titles };
    }

    /**
     * 从纯文本中解析标题列表
     * 2025-12-25: 新增辅助方法
     */
    private parseTitlesFromText(text: string): Array<{ text: string; confidence: number }> {
        const lines = text.split('\n').filter(l => l.trim());
        return lines
            .map((line, index) => {
                const match = line.match(/^\d+\.\s*(.+)/);
                return match
                    ? { text: match[1].trim(), confidence: 1 - index * 0.1 }
                    : null;
            })
            .filter((t): t is { text: string; confidence: number } => t !== null);
    }

    /**
     * Fallback 输出
     * 2025-12-25: 改为纯文本格式
     */
    private buildFallbackOutput(input: CreativeDirectorInput): CreativeDirectorOutput {
        const contentPreview = input.userContent.substring(0, 30);

        let imagePromptText = `Professional social media cover image for ${input.platform.name}. Clean modern design with bold typography. Suitable for ${input.platform.dimensions.width}x${input.platform.dimensions.height} pixels. High quality, professional aesthetic.`;

        if (input.visualStylePrompt) {
            imagePromptText += ` ${input.visualStylePrompt}`;
        }

        const fullText = `【内容理解】
${contentPreview}

【标题建议】
1. ${contentPreview}

【图片生成提示词】
${imagePromptText}`;

        return {
            fullText,
            titleSuggestions: [
                { text: contentPreview, confidence: 0.5 },
            ],
        };
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ==================== 单例 ====================

let instance: CoverCreativeDirector | null = null;

export function getCoverCreativeDirector(): CoverCreativeDirector {
    if (!instance) {
        instance = new CoverCreativeDirector();
    }
    return instance;
}

export function resetCoverCreativeDirector(): void {
    instance = null;
}
