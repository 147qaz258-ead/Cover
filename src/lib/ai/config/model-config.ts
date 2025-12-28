// ==================== 图像模型配置类型定义 ====================
// 用于可扩展的图像生成模型架构

/**
 * Provider 类型
 * - openai-compatible: 兼容 OpenAI API 格式（包括老张中转站）
 * - gemini: Google Gemini API
 * - replicate: Replicate API
 */
export type ImageProviderType = "openai-compatible" | "gemini" | "replicate";

/**
 * API 端点配置
 */
export interface EndpointConfig {
    /** API 基础 URL，不含尾部斜杠 */
    baseURL: string;
    /** 环境变量名称，用于获取 API Key */
    apiKeyEnv: string;
}

/**
 * 模型能力配置
 * 不同模型支持不同的能力参数
 */
export interface ModelCapabilities {
    /** 支持的宽高比列表 (Flux 模型使用) */
    aspectRatios?: string[];
    /** 支持的尺寸列表 (OpenAI 模型使用) */
    sizes?: string[];
    /** 最大输出分辨率 (仅 Gemini 3 Pro 支持) */
    maxResolution?: "1K" | "2K" | "4K";
}

/**
 * 图像模型配置
 * 定义单个图像生成模型的完整配置
 */
export interface ImageModelConfig {
    /** 唯一标识，格式: "provider/model-name" */
    id: string;
    /** 显示名称，用于前端展示 */
    name: string;
    /** Provider 类型（API 调用渠道） */
    provider: ImageProviderType;
    /** 显示用的 Provider 名称（用于前端展示模型实际归属，而非 API 渠道）*/
    displayProvider?: "google" | "openai" | "flux" | "replicate";
    /** API 端点配置 */
    endpoint: EndpointConfig;
    /** 模型名称，传递给 API 的实际模型标识 */
    model: string;
    /** 模型能力配置 */
    capabilities: ModelCapabilities;
    /** 模型特有的额外参数，传递给 extra_body */
    extraParams?: Record<string, unknown>;
    /** 展示优先级，数值越小优先级越高 */
    priority: number;
    /** 是否为默认模型 */
    isDefault?: boolean;
    /** 失败时降级到的模型 ID */
    fallbackTo?: string;
}

/**
 * 模型注册表接口
 * 提供模型配置的查询和过滤能力
 */
export interface ModelRegistry {
    /** 根据 ID 获取模型配置 */
    getModel(id: string): ImageModelConfig | undefined;
    /** 获取默认模型配置 */
    getDefaultModel(): ImageModelConfig;
    /**
     * 获取所有可用模型
     * 仅返回已配置 API Key 的模型
     */
    getAvailableModels(): ImageModelConfig[];
}

/**
 * 公开的模型信息（用于 API 响应）
 * 排除敏感字段如 apiKeyEnv
 */
export interface PublicModelInfo {
    id: string;
    name: string;
    provider: ImageProviderType;
    displayProvider?: "google" | "openai" | "flux" | "replicate";
    capabilities: ModelCapabilities;
    priority: number;
    isDefault?: boolean;
}
