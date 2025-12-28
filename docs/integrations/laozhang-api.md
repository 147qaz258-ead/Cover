# 老张 API 中转站集成文档

> 文档来源: https://docs.laozhang.ai/
> 缓存时间: 2025-12-22

---

## 目的 Purpose

接入老张 API 中转站，获取更优惠的 AI 模型调用价格，支持国内直连。

## 核心优势 Core Benefits

- **国内直连**：无需 VPN，国内网络可直接访问
- **价格优势**：官方价格 8 折优惠
- **OpenAI 兼容**：使用标准 OpenAI SDK 格式，易于集成
- **200+ 模型**：支持 GPT-5、Claude 4.5、Gemini 2.5 等最新模型

---

## 1. 接入配置

### 1.1 Base URL

```
https://api.laozhang.ai/v1
```

### 1.2 环境变量

```bash
LAOZHANG_API_KEY=sk-xxx...
LAOZHANG_BASE_URL=https://api.laozhang.ai/v1
```

### 1.3 OpenAI SDK 配置

```typescript
import { OpenAI } from "openai";

const client = new OpenAI({
  apiKey: process.env.LAOZHANG_API_KEY,
  baseURL: "https://api.laozhang.ai/v1",
});
```

### 1.4 项目集成方式

使用项目内置的工厂函数：

```typescript
import { createOpenAICompatibleProvider } from "@/lib/ai/providers";

const provider = createOpenAICompatibleProvider(
  process.env.LAOZHANG_API_KEY!,
  "https://api.laozhang.ai/v1"
);
```

> **证据来源**: [src/lib/ai/providers/openai.ts](file:///d:/C_Projects/Cover/src/lib/ai/providers/openai.ts)

---

## 2. 图像生成模型

### 2.1 支持的模型列表

| 模型 ID | 描述 | 价格 | 支持尺寸 |
|---------|------|------|----------|
| `gpt-4o-image` | GPT-4o 图像生成，推荐 | $0.01/张 | 1024x1024, 1024x1792, 1792x1024 |
| `gpt-image-1` | OpenAI 官方直转 | 官方价格 | 1024x1024, 1024x1792, 1792x1024 |
| `dall-e-3` | DALL-E 3 经典版 | 官方价格 | 1024x1024, 1024x1792, 1792x1024 |
| `dall-e-2` | DALL-E 2 性价比版 | 官方价格 | 256x256, 512x512, 1024x1024 |
| `flux-kontext-pro` | Flux Pro 专业版 | 比官方便宜12.5% | 灵活宽高比 3:7 到 7:3 |
| `flux-kontext-max` | Flux Max 最高质量 | 比官方便宜12.5% | 灵活宽高比 3:7 到 7:3 |
| `sora_image` | Sora 逆向生图 | $0.01/张 | 2:3, 3:2, 1:1 |

### 2.2 标准接口格式

```
POST https://api.laozhang.ai/v1/images/generations
```

#### 请求示例

```typescript
const response = await client.images.generate({
  model: "gpt-4o-image",
  prompt: "A serene Japanese garden with cherry blossoms",
  n: 1,
  size: "1024x1024",
});

const imageUrl = response.data[0].url;
```

### 2.3 Flux 模型特殊参数

Flux 模型使用 `extra_body` 传递额外参数：

```typescript
const response = await client.images.generate({
  model: "flux-kontext-pro",
  prompt: "Professional product photography",
  extra_body: {
    aspect_ratio: "16:9",    // 支持 3:7 到 7:3
    seed: 42,                // 可重现结果
    safety_tolerance: 2,     // 内容安全级别 0-6
    output_format: "png",    // jpeg 或 png
    prompt_upsampling: true, // 自动增强提示词
  },
});
```

#### Flux 支持的宽高比

- 1:1, 2:3, 3:2, 4:3, 3:4
- 16:9, 9:16, 21:9
- 5:4, 4:5, 16:10
- 3:7, 7:3

### 2.4 重要注意事项

> ⚠️ **URL 有效期**: Flux 生成的图片 URL 仅有效 **10 分钟**，必须立即下载保存！

---

## 3. 文本模型

### 3.1 对话补全 API

```
POST https://api.laozhang.ai/v1/chat/completions
```

### 3.2 推荐模型

| 模型 ID | 描述 | 适用场景 |
|---------|------|----------|
| `gpt-4.1` | GPT-4 最新版 | 复杂推理 |
| `gpt-4o` | GPT-4o 多模态 | 图像理解 |
| `gpt-4o-mini` | GPT-4o Mini 轻量版 | 日常对话 |
| `gpt-3.5-turbo` | GPT-3.5 经典版 | 成本敏感 |
| `claude-sonnet-4-5-20250929` | Claude 4.5 Sonnet | 代码生成 |
| `gemini-2.5-pro` | Gemini 2.5 Pro | 长上下文 |
| `deepseek-v3` | DeepSeek V3 | 性价比高 |

---

## 4. 错误处理

### 4.1 常见错误码

| 错误码 | 原因 | 处理方式 |
|--------|------|----------|
| 401 | API Key 无效 | 检查 LAOZHANG_API_KEY |
| 429 | 请求频率过高 | 实现指数退避重试 |
| 400 | 参数错误 | 检查 model/prompt 格式 |
| 500 | 服务端错误 | 重试或切换到官方 API |

### 4.2 重试策略

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
  throw new Error("Max retries exceeded");
}
```

---

## 5. 与官方 API 对比

| 特性 | 老张 API | 官方 API |
|------|----------|----------|
| 国内访问 | ✅ 直连 | ❌ 需要 VPN |
| 价格 | 8 折 | 原价 |
| 稳定性 | 中 | 高 |
| 模型覆盖 | 200+ | 仅官方 |
| 支付方式 | 支付宝 | 信用卡 |

---

## 证据来源 Evidence

| 信息 | 来源 |
|------|------|
| API 文档 | https://docs.laozhang.ai/ |
| 图像生成 | https://docs.laozhang.ai/api-reference/images |
| Flux 模型 | https://docs.laozhang.ai/api-capabilities/flux-image-generation |
| 模型列表 | https://docs.laozhang.ai/api-capabilities/model-info |

---

## Changelog

| 日期 | 变更 |
|------|------|
| 2025-12-22 | 初版创建，覆盖图像生成和文本模型接入 |
