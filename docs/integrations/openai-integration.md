# OpenAI 集成文档

> 本文档描述 Cover 项目与 OpenAI API 的集成方式。

---

## 目的 Purpose

说明 OpenAI API 的集成架构、配置方式与使用模式。

## 适用范围 Scope

- OpenAI Provider 适配层
- 文本生成、图像生成、内容审核能力
- 错误处理与重试策略

## 当前状态 Status

**Active** - 核心 AI 能力依赖

---

## 1. 架构概览

```
业务层 (Agent)
     │
     └──► OpenAIProvider
              │
              ├── generateText()  ──► GPT-3.5/GPT-4
              ├── generateImage() ──► DALL-E 3
              └── moderateText()  ──► Moderation API
```

> **证据来源**: [src/lib/ai/providers/openai.ts](file:///d:/C_Projects/Cover/src/lib/ai/providers/openai.ts)

---

## 2. 环境配置

### 2.1 必需环境变量

```bash
OPENAI_API_KEY=sk-xxx...
```

> **证据来源**: [.env.local.example](file:///d:/C_Projects/Cover/.env.local.example) 第 2 行

### 2.2 API 密钥获取

1. 访问 [OpenAI Platform](https://platform.openai.com/api-keys)
2. 创建新的 API Key
3. 将密钥添加到 `.env.local`

---

## 3. Provider 实现

### 3.1 文件位置

```
src/lib/ai/providers/openai.ts
```

### 3.2 核心接口

```typescript
class OpenAIProvider {
  // 构造函数支持自定义 baseURL
  constructor(apiKey: string, baseURL?: string)

  // 文本生成
  async generateText(prompt: string, options?: {
    model?: string;      // 默认: gpt-3.5-turbo
    maxTokens?: number;  // 默认: 500
    temperature?: number; // 默认: 0.7
  }): Promise<string>

  // 图像生成 (支持 extra_body)
  async generateImage(prompt: string, options?: {
    model?: string;       // 默认: dall-e-3
    size?: string;        // 默认: 1024x1024 (OpenAI 格式)
    quality?: string;     // 默认: standard
    n?: number;           // 默认: 1
    aspectRatio?: string; // Flux 模型使用
    extraBody?: Record<string, unknown>; // extra_body 参数
  }): Promise<string>

  // 内容审核
  async moderateText(content: string): Promise<ModerationResult>
}
```

> **证据来源**: [src/lib/ai/providers/openai.ts](file:///d:/C_Projects/Cover/src/lib/ai/providers/openai.ts)

### 3.3 获取方式

#### 方式 1: 官方 OpenAI 单例（后向兼容）

```typescript
import { getOpenAIProvider } from "@/lib/ai/providers";

const openai = getOpenAIProvider();
const text = await openai.generateText("Hello!");
```

#### 方式 2: 自定义端点（推荐）

```typescript
import { createOpenAICompatibleProvider } from "@/lib/ai/providers";

// 使用老张 API 中转站
const provider = createOpenAICompatibleProvider(
  process.env.LAOZHANG_API_KEY!,
  "https://api.laozhang.ai/v1"
);

// 使用 Flux 模型
const imageUrl = await provider.generateImage("A beautiful sunset", {
  model: "flux-kontext-pro",
  aspectRatio: "16:9",
  extraBody: { prompt_upsampling: true },
});
```

> **新增于 2025-12-22**: `createOpenAICompatibleProvider()` 支持自定义 `baseURL`

---

## 4. 使用场景

### 4.1 文本分析 (TextAnalysisAgent)

使用 GPT 分析用户输入文本，提取关键点、情感、主题。

```typescript
const result = await this.openai.generateText(analysisPrompt, {
  model: "gpt-3.5-turbo",
  maxTokens: 1000,
  temperature: 0.3, // 更确定性的输出
});
```

### 4.2 标题生成 (TitleGenerationAgent)

使用 GPT 为不同平台生成标题候选。

```typescript
const titles = await this.openai.generateText(titlePrompt, {
  model: "gpt-3.5-turbo",
  maxTokens: 500,
  temperature: 0.8, // 更有创意的输出
});
```

### 4.3 图像生成 (ImageGenerationAgent)

使用 DALL-E 3 生成封面图像。

```typescript
const imageUrl = await this.openai.generateImage(imagePrompt, {
  model: "dall-e-3",
  size: "1024x1024",
  quality: "standard",
});
```

### 4.4 内容审核 (ModerationService)

使用 Moderation API 检测违规内容。

```typescript
const result = await this.openai.moderateText(userText);
if (result.flagged) {
  // 拦截请求
}
```

---

## 5. 模型选择

### 5.1 文本模型

| 模型 | 用途 | 成本 |
|------|------|------|
| `gpt-3.5-turbo` | 标准文本生成 | 低 |
| `gpt-4` | 高质量复杂推理 | 高 |
| `gpt-4-turbo` | 平衡质量与成本 | 中 |

### 5.2 图像模型

| 模型 | 用途 | 尺寸选项 |
|------|------|----------|
| `dall-e-3` | 高质量图像 | 1024x1024, 1024x1792, 1792x1024 |
| `dall-e-2` | 标准图像 | 256x256, 512x512, 1024x1024 |

---

## 6. 错误处理

### 6.1 常见错误

| 错误类型 | 原因 | 处理方式 |
|----------|------|----------|
| `401 Unauthorized` | API Key 无效 | 检查 OPENAI_API_KEY |
| `429 Too Many Requests` | 请求过多 | 实现重试逻辑 |
| `400 Bad Request` | 请求参数错误 | 检查 prompt 格式 |
| `500 Server Error` | OpenAI 服务异常 | 重试或降级 |

### 6.2 错误处理模式

```typescript
try {
  const result = await this.openai.generateText(prompt);
  return this.parseResponse(result);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  this.logger.error("OpenAI API failed", { error: errorMessage });
  throw new Error(`Text generation failed: ${errorMessage}`);
}
```

---

## 7. 成本优化

### 7.1 Token 管理

- 限制 `maxTokens` 避免超量消耗
- 压缩 prompt 长度
- 缓存重复请求结果

### 7.2 模型降级

```
优先使用 gpt-3.5-turbo
  │
  └── 复杂任务降级到 gpt-4-turbo
        │
        └── 关键任务使用 gpt-4
```

---

## 8. 验证步骤

### 8.1 环境变量验证

```bash
# 检查环境变量是否配置
echo $env:OPENAI_API_KEY
```

### 8.2 API 连通性测试

```typescript
// 在项目根目录创建测试脚本
const { getOpenAIProvider } = require("./src/lib/ai/providers/openai");

const openai = getOpenAIProvider();
openai.generateText("Say hello").then(console.log).catch(console.error);
```

---

## 证据来源 Evidence

| 信息 | 来源文件 |
|------|----------|
| Provider 实现 | `src/lib/ai/providers/openai.ts` |
| 环境变量 | `.env.local.example` |
| 依赖版本 | `package.json` (openai: ^4.76.0) |

## 相关链接 Related

- [封面生成 API](api-generate.md)
- [Cloudflare R2 集成](cloudflare-r2.md)
- [架构原则](../architecture/principles.md)

---

## Changelog

| 日期 | 变更 |
|------|------|
| 2025-12-22 | 添加 baseURL、aspectRatio、extraBody 支持，新增 createOpenAICompatibleProvider 工厂函数 |
| 2025-12-22 | 初版创建，覆盖 Provider 接口与使用模式 |
