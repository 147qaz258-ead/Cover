# Google Gemini 图像生成集成文档

> 文档来源: https://ai.google.dev/gemini-api/docs/image-generation
> 缓存时间: 2025-12-22

---

## 目的 Purpose

接入 Google Gemini 图像生成模型，特别是 `gemini-3-pro-image-preview` (Nano Banana Pro)。

## 核心能力 Core Capabilities

- **文字到图像**：从文本描述生成高质量图像
- **图像编辑**：使用文本提示编辑/调整图像
- **多图合成**：使用多张输入图像组合新场景
- **迭代优化**：多轮对话逐步优化图像
- **高保真文字渲染**：生成清晰可读的图像内文字

---

## 1. 模型选择

### 1.1 可用模型

| 模型 ID | 别名 | 分辨率 | 特点 |
|---------|------|--------|------|
| `gemini-2.5-flash-image` | Nano Banana | 1024px | 速度快、低延迟、高并发 |
| `gemini-3-pro-image-preview` | Nano Banana Pro | 1K/2K/4K | 专业级、复杂指令、思维过程 |

### 1.2 模型选择建议

- **日常使用 / 批量生成**: 使用 `gemini-2.5-flash-image`
- **专业封面 / 复杂创意**: 使用 `gemini-3-pro-image-preview`

---

## 2. 环境配置

### 2.1 API Key 获取

1. 访问 [Google AI Studio](https://aistudio.google.com/)
2. 创建 API Key
3. 添加到环境变量

```bash
GOOGLE_AI_API_KEY=your_gemini_api_key_here
```

### 2.2 依赖安装

```bash
npm install @google/genai
```

> ⚠️ 注意：图像生成需要使用新版 `@google/genai` SDK，而非旧版 `@google/generative-ai`

---

## 3. 图像生成 (Text-to-Image)

### 3.1 JavaScript/TypeScript 示例

```typescript
import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

async function generateImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      return buffer; // 返回图像 Buffer
    }
  }
  
  throw new Error("No image generated");
}
```

### 3.2 Gemini 3 Pro Image Preview 特殊能力

```typescript
// 使用 4K 分辨率和自定义宽高比
const response = await ai.models.generateContent({
  model: "gemini-3-pro-image-preview",
  contents: prompt,
  config: {
    responseModalities: ["Image"],
    imageConfig: {
      aspectRatio: "16:9",
      imageSize: "4K", // 支持 1K, 2K, 4K
    },
  },
});
```

---

## 4. Nano Banana Pro (gemini-3-pro-image-preview) 高级特性

### 4.1 多参考图像（最多14张）

可以使用最多 14 张参考图像来生成新图像：

```typescript
const response = await ai.models.generateContent({
  model: "gemini-3-pro-image-preview",
  contents: [
    { text: "Combine these images into a collage" },
    { inlineData: { data: image1Base64, mimeType: "image/jpeg" } },
    { inlineData: { data: image2Base64, mimeType: "image/jpeg" } },
    // ... 最多 14 张
  ],
});
```

### 4.2 Google 搜索实时接地

模型可以使用 Google 搜索验证事实并基于实时数据生成图像（如天气图、股票图表、时事）。

### 4.3 思维过程 (Thinking Mode)

模型使用"思维"过程处理复杂提示，生成临时"思维图像"来优化构图，然后产生最终输出。

---

## 5. 可选配置

### 5.1 输出类型

```typescript
// 仅返回图像（不含文字）
config: {
  responseModalities: ["Image"]
}

// 返回文字和图像（默认）
config: {
  responseModalities: ["Text", "Image"]
}
```

### 5.2 宽高比

```typescript
config: {
  imageConfig: {
    aspectRatio: "16:9" // 支持 1:1, 16:9, 9:16, 4:3, 3:4 等
  }
}
```

### 5.3 图像分辨率 (仅 gemini-3-pro-image-preview)

```typescript
config: {
  imageConfig: {
    imageSize: "2K" // 支持 "1K", "2K", "4K"
  }
}
```

---

## 6. 图像编辑 (Text-and-Image-to-Image)

### 6.1 基本图像编辑

```typescript
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash-image",
  contents: [
    { text: "Change the background to a sunset beach" },
    { inlineData: { data: originalImageBase64, mimeType: "image/jpeg" } },
  ],
});
```

### 6.2 多轮迭代编辑

```typescript
// 第一轮
const response1 = await ai.models.generateContent({
  model: "gemini-2.5-flash-image",
  contents: [
    { text: "Add a rainbow to the sky" },
    { inlineData: { data: image1, mimeType: "image/jpeg" } },
  ],
});

// 第二轮继续编辑
const response2 = await ai.models.generateContent({
  model: "gemini-2.5-flash-image",
  contents: [
    { text: "Now add some birds flying" },
    { inlineData: { data: editedImage1, mimeType: "image/jpeg" } },
  ],
});
```

---

## 7. 最佳实践

### 7.1 提示词优化

```typescript
// 好的提示词模板
const template = `
[Subject]: A professional social media cover image
[Style]: Modern, minimalist, clean design
[Colors]: ${backgroundColor} background, ${textColor} text
[Text]: "${title}"
[Composition]: Centered text with visual balance
[Quality]: High resolution, suitable for ${width}x${height}
`;
```

### 7.2 错误处理

```typescript
try {
  const response = await ai.models.generateContent({ ... });
  // 检查响应是否包含图像
  const imagePart = response.candidates[0]?.content?.parts?.find(
    p => p.inlineData
  );
  if (!imagePart) {
    throw new Error("No image in response");
  }
} catch (error) {
  // 降级到其他模型
  console.error("Gemini generation failed, falling back to DALL-E");
}
```

---

## 8. 限制与注意事项

1. **SynthID 水印**：所有生成的图像都包含 SynthID 数字水印
2. **内容政策**：模型会拒绝生成违反政策的内容
3. **区域限制**：某些地区可能无法使用图像生成功能
4. **API 速率限制**：注意 Google AI API 的速率限制

---

## 9. 与现有架构集成

### 9.1 项目实现

项目已实现 `GeminiImageProvider`：

```typescript
// 文件: src/lib/ai/providers/gemini-image.ts
import { GeminiImageProvider, getGeminiImageProvider } from "@/lib/ai/providers";

// 使用单例
const provider = getGeminiImageProvider();

// 或创建新实例
const provider = new GeminiImageProvider(process.env.GOOGLE_AI_API_KEY!);

// 生成图像
const buffer = await provider.generateImage("A beautiful sunset", {
  model: "gemini-2.5-flash-image",
  aspectRatio: "16:9",
  imageSize: "2K",  // 仅 gemini-3-pro-image-preview 支持
});
```

> **证据来源**: [src/lib/ai/providers/gemini-image.ts](file:///d:/C_Projects/Cover/src/lib/ai/providers/gemini-image.ts)

### 9.2 SDK 迁移

从 `@google/generative-ai` 迁移到 `@google/genai`：

```typescript
// 旧版（仅文本）
import { GoogleGenerativeAI } from "@google/generative-ai";

// 新版（支持图像生成）
import { GoogleGenAI } from "@google/genai";
```

### 9.3 模型配置

模型已在 `src/lib/ai/config/image-models.ts` 中预配置：

- `google/gemini-3-pro-image-preview` - 支持 4K 分辨率
- `google/gemini-2.5-flash-image` - 快速生成

---

## 证据来源 Evidence

| 信息 | 来源 |
|------|------|
| 官方文档 | https://ai.google.dev/gemini-api/docs/image-generation |
| 模型介绍 | https://gemini.google/overview/image-generation/ |
| SDK 参考 | https://ai.google.dev/gemini-api/docs/quickstart |
| 项目实现 | `src/lib/ai/providers/gemini-image.ts` |
| 模型配置 | `src/lib/ai/config/image-models.ts` |

---

## Changelog

| 日期 | 变更 |
|------|------|
| 2025-12-22 | 添加项目实现引用 (`GeminiImageProvider`)，更新架构集成说明 |
| 2025-12-22 | 初版创建，覆盖 gemini-3-pro-image-preview 接入指南 |
