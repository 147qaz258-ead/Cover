# 封面生成技术规格

> AI 封面生成器技术实现规格文档

---

## 目的 Purpose

描述封面生成的技术实现细节，作为开发与维护参考。

## 适用范围 Scope

- Pipeline 流程
- Agent 实现
- 数据结构

## 当前状态 Status

**Active** - v0.1.0 实现

---

## 1. 技术架构

### 1.1 Pipeline 流程

```
                           CoverGenerationPipeline
                                     │
    ┌────────────────────────────────┼────────────────────────────────┐
    │                                │                                │
    ▼                                ▼                                ▼
┌────────────┐              ┌────────────────┐              ┌─────────────────┐
│  Step 1    │              │    Step 2      │              │    Step 3       │
│ 文本分析   │──────────────▶│  标题生成      │──────────────▶│   图像生成      │
│ 权重: 20%  │              │  权重: 30%     │              │   权重: 45%     │
└────────────┘              └────────────────┘              └─────────────────┘
      │                            │                               │
      ▼                            ▼                               ▼
 TextAnalysisResult          GeneratedTitle[]                   imageUrl
```

> **证据来源**: [src/lib/ai/pipeline/cover-pipeline.ts](file:///d:/C_Projects/Cover/src/lib/ai/pipeline/cover-pipeline.ts)

---

## 2. 核心接口

### 2.1 CoverGenerationPipeline

```typescript
class CoverGenerationPipeline {
  // 同步执行
  async execute(request: CoverGenerationRequest): Promise<CoverGenerationResult[]>
  
  // 带进度回调执行
  async executeWithProgress(
    request: CoverGenerationRequest,
    onProgress?: (step: string, progress: number) => void
  ): Promise<CoverGenerationResult[]>
}
```

### 2.2 请求结构

```typescript
interface CoverGenerationRequest {
  text: string;           // 原文内容
  platforms: string[];    // 目标平台 ID 数组
  styleTemplate: string;  // 风格模板 ID
  customizations?: object; // 自定义配置
}
```

### 2.3 结果结构

```typescript
interface CoverGenerationResult {
  id: string;                    // 结果 UUID
  platform: Platform;            // 平台配置
  imageUrl: string;              // 图像公开 URL
  thumbnailUrl: string;          // 缩略图 URL
  title: string;                 // 生成的标题
  metadata: {
    fileSize: number;            // 文件大小 (bytes)
    format: string;              // 图像格式
    dimensions: {
      width: number;
      height: number;
    };
  };
}
```

> **证据来源**: [src/lib/ai/pipeline/cover-pipeline.ts](file:///d:/C_Projects/Cover/src/lib/ai/pipeline/cover-pipeline.ts) 第 68-86 行

---

## 3. Agent 实现

### 3.1 TextAnalysisAgent

**文件**: `src/lib/ai/agents/text-analyzer.ts`

**职责**: 分析用户输入文本，提取关键信息

**输入**: `text: string`

**输出**:
```typescript
interface TextAnalysisResult {
  keyPoints: string[];    // 关键点列表
  sentiment: string;      // 情感倾向
  topics: string[];       // 主题标签
  keywords: string[];     // 关键词
  summary: string;        // 摘要
}
```

### 3.2 TitleGenerationAgent

**文件**: `src/lib/ai/agents/title-generator.ts`

**职责**: 为每个平台生成标题候选

**输入**: `text`, `analysis`, `platformId`, `count`

**输出**:
```typescript
interface GeneratedTitle {
  text: string;       // 标题文本
  confidence: number; // 置信度 (0-1)
  platform: string;   // 平台 ID
}
```

### 3.3 ImageGenerationAgent

**文件**: `src/lib/ai/agents/image-generator.ts`

**职责**: 生成封面图像并上传到 R2

**输入**:
```typescript
interface ImageGenerationRequest {
  title: string;
  platform: Platform;
  template: StyleTemplate;
  customizations?: object;
}
```

**输出**: `imageUrl: string`

---

## 4. 进度权重

| 步骤 | 名称 | 权重 |
|------|------|------|
| Step 1 | Analyzing text | 20% |
| Step 2 | Generating titles | 30% |
| Step 3 | Creating images | 45% |
| Step 4 | Finalizing results | 5% |

> **证据来源**: [src/lib/ai/pipeline/cover-pipeline.ts](file:///d:/C_Projects/Cover/src/lib/ai/pipeline/cover-pipeline.ts) 第 105-110 行

---

## 5. 错误处理

### 5.1 Pipeline 级错误

```typescript
try {
  // 执行步骤
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  requestLogger.error("Pipeline failed", { error: errorMessage });
  throw error;
}
```

### 5.2 常见错误类型

| 错误 | 原因 | 处理 |
|------|------|------|
| `Style template not found` | 模板 ID 无效 | 返回 400 |
| `Platform not found` | 平台 ID 无效 | 返回 400 |
| AI Provider 错误 | API 调用失败 (OpenAI/Gemini) | 重试或 500 (支持 Fallback) |
| Gemini 429 Error | 免费版配额耗尽 | 自动降级到备选模型 |
| R2 上传错误 | 存储服务异常 | 重试或 500 |

---

## 6. 扩展点

### 6.1 添加新平台

1. 在 `src/lib/platforms/specs.ts` 添加平台配置
2. 在 `ImageGenerationAgent.buildImagePrompt()` 添加平台特定提示词

### 6.2 添加新风格模板

1. 在 `src/data/templates/index.ts` 添加模板配置
2. 在 `ImageGenerationAgent.buildImagePrompt()` 添加风格描述

### 6.3 添加新 AI 提供商

1. 在 `src/lib/ai/providers/` 创建新 Provider
2. 在 Agent 层选择性调用

---

## 7. TODO 项

| 位置 | 描述 | 状态 |
|------|------|------|
| cover-pipeline.ts:78 | 缩略图生成 | ⏳ 待实现 |
| cover-pipeline.ts:81 | 文件大小计算 | ⏳ 待实现 |

> **证据来源**: [src/lib/ai/pipeline/cover-pipeline.ts](file:///d:/C_Projects/Cover/src/lib/ai/pipeline/cover-pipeline.ts) 第 78、81 行

---

## 证据来源 Evidence

| 信息 | 来源文件 |
|------|----------|
| Pipeline 实现 | `src/lib/ai/pipeline/cover-pipeline.ts` |
| Agent 实现 | `src/lib/ai/agents/*.ts` |
| 类型定义 | `src/types/index.ts` |

## 相关链接 Related

- [封面生成 PRD](prd-cover-generation.md)
- [封面生成 API](../integrations/api-generate.md)
- [架构原则](../architecture/principles.md)

---

## Changelog

| 日期 | 变更 |
|------|------|
| 2025-12-22 | 初版创建，覆盖 Pipeline 与 Agent 实现 |
