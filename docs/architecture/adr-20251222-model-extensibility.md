# ADR-20251222: 可扩展图像模型架构

> **状态**: 已采纳
> **日期**: 2025-12-22
> **决策者**: 开发团队

---

## 上下文 Context

现有的 `ImageGenerationAgent` 硬编码了 `openai` 和 `replicate` 两个 Provider，模型选择逻辑使用 `if/else` 实现。这导致：

- 添加新模型需要修改 Agent 源码
- 违反开闭原则 (OCP)
- 前端无法动态选择模型
- 无法同时支持官方 API 和中转站 API

## 决策 Decision

采用**配置驱动**的 `ModelRegistry` 模式：

1. **模型配置层** (`src/lib/ai/config/`):
   - `ImageModelConfig` 接口定义模型元数据
   - `IMAGE_MODELS` 静态配置数组
   - `getModelRegistry()` 单例注册表

2. **Provider 扩展**:
   - `OpenAIProvider` 支持自定义 `baseURL` 和 `extra_body`
   - 新增 `GeminiImageProvider` 支持图像生成

3. **Agent 重构**:
   - 根据 `modelId` 从注册表获取配置
   - 实现指数退避重试（1s → 2s → 4s）
   - 实现自动降级到 `fallbackTo` 模型

## 后果 Consequences

### 正面影响

- ✅ 添加新模型只需修改 `image-models.ts` 配置
- ✅ 前端可通过 `/api/models` 获取可用模型
- ✅ 支持老张 API 中转站降低成本
- ✅ 自动重试和降级提高可用性

### 负面影响

- ⚠️ 增加了配置复杂度
- ⚠️ 运行时依赖环境变量过滤模型

## 证据来源 Evidence

| 组件 | 文件路径 |
|------|----------|
| 类型定义 | `src/lib/ai/config/model-config.ts` |
| 模型列表 | `src/lib/ai/config/image-models.ts` |
| 注册表 | `src/lib/ai/config/index.ts` |
| OpenAI Provider | `src/lib/ai/providers/openai.ts` |
| Gemini Provider | `src/lib/ai/providers/gemini-image.ts` |
| Agent | `src/lib/ai/agents/image-generator.ts` |
| API | `src/app/api/models/route.ts` |
| 前端组件 | `src/components/forms/model-selector.tsx` |

---

## 相关链接

- [OpenAI 集成](../integrations/openai-integration.md)
- [老张 API 集成](../integrations/laozhang-api.md)
- [Gemini 图像生成](../integrations/gemini-image-generation.md)
