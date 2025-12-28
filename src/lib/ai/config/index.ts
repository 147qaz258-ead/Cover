// ==================== 模型注册表实现 ====================
// 提供模型配置的查询和过滤能力

import type { ImageModelConfig, ModelRegistry, PublicModelInfo } from "./model-config";
import { IMAGE_MODELS } from "./image-models";

// ==================== 辅助函数 ====================

/**
 * 检查模型是否可用（API Key 已配置）
 */
function isModelAvailable(config: ImageModelConfig): boolean {
    const apiKey = process.env[config.endpoint.apiKeyEnv];
    return !!apiKey && apiKey.trim().length > 0;
}

// ==================== ModelRegistry 实现 ====================

class ModelRegistryImpl implements ModelRegistry {
    private readonly models: ImageModelConfig[];

    constructor(models: ImageModelConfig[]) {
        // 按 priority 排序
        this.models = [...models].sort((a, b) => a.priority - b.priority);
    }

    /**
     * 根据 ID 获取模型配置
     */
    getModel(id: string): ImageModelConfig | undefined {
        return this.models.find(m => m.id === id);
    }

    /**
     * 获取默认模型配置
     * @throws 如果没有可用的默认模型
     */
    getDefaultModel(): ImageModelConfig {
        // 首先尝试找到标记为默认且可用的模型
        const defaultModel = this.models.find(m => m.isDefault && isModelAvailable(m));
        if (defaultModel) {
            return defaultModel;
        }

        // 如果默认模型不可用，返回第一个可用的模型
        const firstAvailable = this.models.find(m => isModelAvailable(m));
        if (firstAvailable) {
            return firstAvailable;
        }

        // 如果没有可用模型，抛出错误
        throw new Error(
            "No image model available. Please configure at least one API key: " +
            "LAOZHANG_API_KEY, GOOGLE_AI_API_KEY, OPENAI_API_KEY, or REPLICATE_API_TOKEN"
        );
    }

    /**
     * 获取所有可用模型
     * 仅返回已配置 API Key 的模型
     */
    getAvailableModels(): ImageModelConfig[] {
        return this.models.filter(isModelAvailable);
    }
}

// ==================== 单例管理 ====================

let registryInstance: ModelRegistry | null = null;

/**
 * 获取模型注册表实例（单例）
 */
export function getModelRegistry(): ModelRegistry {
    if (!registryInstance) {
        registryInstance = new ModelRegistryImpl(IMAGE_MODELS);
    }
    return registryInstance;
}

/**
 * 重置注册表实例（用于测试）
 */
export function resetModelRegistry(): void {
    registryInstance = null;
}

// ==================== 工具函数 ====================

/**
 * 将模型配置转换为公开信息（过滤敏感字段）
 */
export function toPublicModelInfo(config: ImageModelConfig): PublicModelInfo {
    return {
        id: config.id,
        name: config.name,
        provider: config.provider,
        displayProvider: config.displayProvider,
        capabilities: config.capabilities,
        priority: config.priority,
        isDefault: config.isDefault,
    };
}

// ==================== 重导出 ====================

export type {
    ImageModelConfig,
    ModelRegistry,
    ModelCapabilities,
    EndpointConfig,
    ImageProviderType,
    PublicModelInfo,
} from "./model-config";

export { IMAGE_MODELS } from "./image-models";
