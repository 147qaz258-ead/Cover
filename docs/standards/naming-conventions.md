# Cover 项目命名规范

> 本文档基于项目实际代码提取，确保与代码库一致。

---

## 1. 命名规则速查表

| 类型 | 规则 | 项目示例 |
|------|------|----------|
| **变量/函数** | camelCase | `coverPipeline`, `generateImage`, `analyzeText` |
| **类/接口/类型** | PascalCase | `CoverGenerationPipeline`, `Platform`, `StyleTemplate` |
| **常量数组** | UPPER_SNAKE_CASE | `PLATFORMS`, `STYLE_TEMPLATES`, `AI_PROVIDERS` |
| **文件名** | kebab-case | `cover-pipeline.ts`, `image-generator.ts` |
| **目录名** | kebab-case | `ai/agents/`, `ai/providers/`, `platforms/` |
| **React 组件文件** | kebab-case | `cover-generator.tsx`, `platform-selector.tsx` |
| **CSS 类名** | kebab-case | `cover-card`, `platform-preview` |
| **环境变量** | UPPER_SNAKE_CASE | `OPENAI_API_KEY`, `CLOUDFLARE_R2_BUCKET_NAME` |

---

## 2. 核心类型定义索引

> 来源: `src/types/index.ts`

### 2.1 业务实体类型

| 类型名 | 用途 | 主要字段 |
|--------|------|----------|
| `Platform` | 社交平台配置 | `id`, `name`, `aspectRatio`, `dimensions`, `maxFileSize`, `supportedFormats` |
| `StyleTemplate` | 风格模板配置 | `id`, `name`, `backgroundColor`, `textColor`, `accentColor`, `fontFamily`, `fontSize`, `layout` |
| `CoverGenerationRequest` | 封面生成请求 | `text`, `platforms`, `styleTemplate`, `customizations` |
| `CoverGenerationJob` | 生成任务状态 | `id`, `status`, `request`, `results`, `error`, `progress`, `createdAt`, `updatedAt` |
| `CoverGenerationResult` | 生成结果 | `id`, `platform`, `imageUrl`, `thumbnailUrl`, `title`, `metadata` |

### 2.2 AI 相关类型

| 类型名 | 用途 | 主要字段 |
|--------|------|----------|
| `TextAnalysisResult` | 文本分析结果 | `keyPoints`, `sentiment`, `topics`, `keywords`, `summary` |
| `GeneratedTitle` | 生成的标题 | `text`, `confidence`, `platform` |
| `AIProvider` | AI 提供商配置 | `id`, `name`, `type`, `capabilities` |

### 2.3 通用响应类型

| 类型名 | 用途 | 主要字段 |
|--------|------|----------|
| `APIResponse<T>` | 统一 API 响应 | `success`, `data`, `error`, `meta` |
| `PaginatedResponse<T>` | 分页响应 | `items`, `pagination` |
| `PaginationParams` | 分页参数 | `page`, `limit`, `sort`, `order` |

---

## 3. 核心常量索引

### 3.1 平台常量 `PLATFORMS`

> 来源: `src/lib/platforms/specs.ts`

| 常量 ID | 中文名称 | 尺寸 |
|---------|----------|------|
| `xiaohongshu` | 小红书 | 1080×1080 |
| `xiaohongshu-vertical` | 小红书 (竖版) | 720×1280 |
| `wechat` | 微信公众号 | 900×500 |
| `wechat-banner` | 公众号头图 | 900×383 |
| `taobao` | 淘宝/天猫 | 800×800 |
| `taobao-banner` | 淘宝横版 | 1200×800 |
| `douyin` | 抖音 | 720×1280 |
| `weibo` | 微博 | 1000×562 |
| `bilibili` | B站封面 | 1920×1080 |
| `zhihu` | 知乎 | 738×415 |

### 3.2 风格模板常量 `STYLE_TEMPLATES`

> 来源: `src/data/templates/index.ts`

| 常量 ID | 中文名称 | 背景色 | 文字色 |
|---------|----------|--------|--------|
| `minimal-clean` | 简约清新 | #FFFFFF | #333333 |
| `modern-bold` | 现代醒目 | #000000 | #FFFFFF |
| `elegant-gold` | 轻奢金典 | #2C3E50 | #ECF0F1 |
| `nature-fresh` | 自然清新 | #E8F5E9 | #2E7D32 |
| `tech-blue` | 科技蓝调 | #0F2027 | #FFFFFF |
| `warm-pink` | 温暖粉调 | #FFF0F5 | #D81B60 |
| `vintage-brown` | 复古棕调 | #3E2723 | #D7CCC8 |
| `gradient-purple` | 渐变紫韵 | #6A1B9A | #FFFFFF |
| `business-gray` | 商务灰度 | #37474F | #ECEFF1 |
| `artistic-multi` | 艺术多彩 | #FFFFFF | #212121 |

### 3.3 AI 提供商常量 `AI_PROVIDERS`

> 来源: `src/lib/ai/providers/index.ts`

| 常量 ID | 名称 | 类型 | 能力 |
|---------|------|------|------|
| `openai` | OpenAI | multimodal | text-generation, image-generation, moderation |
| `gemini` | Google Gemini | multimodal | text-generation, image-analysis |
| `replicate` | Replicate | image | image-generation, image-upscaling |

---

## 4. 环境变量命名

> 来源: `.env.local.example`

| 变量名 | 用途 |
|--------|------|
| `OPENAI_API_KEY` | OpenAI API 密钥 |
| `GOOGLE_AI_API_KEY` | Google AI API 密钥 |
| `REPLICATE_API_TOKEN` | Replicate API 令牌 |
| `CLOUDFLARE_R2_ACCOUNT_ID` | Cloudflare R2 账户 ID |
| `CLOUDFLARE_R2_ACCESS_KEY` | Cloudflare R2 访问密钥 |
| `CLOUDFLARE_R2_SECRET_KEY` | Cloudflare R2 密钥 |
| `CLOUDFLARE_R2_BUCKET_NAME` | Cloudflare R2 存储桶名称 |
| `CLOUDFLARE_R2_PUBLIC_URL` | Cloudflare R2 公开 URL |

---

## 5. 函数命名约定

### 5.1 获取函数

| 前缀 | 用途 | 示例 |
|------|------|------|
| `get*` | 同步获取 | `getPlatform(id)`, `getStyleTemplate(id)` |
| `get*Provider` | 获取单例实例 | `getOpenAIProvider()`, `getReplicateProvider()` |
| `get*sByCategory` | 按分类获取列表 | `getPlatformsByCategory()`, `getStyleTemplatesByCategory()` |

### 5.2 业务动作函数

| 前缀 | 用途 | 示例 |
|------|------|------|
| `analyze*` | 分析数据 | `analyzeText()` |
| `generate*` | 生成内容 | `generateTitles()`, `generateImage()` |
| `build*` | 构建对象/字符串 | `buildImagePrompt()`, `buildAnalysisPrompt()` |
| `parse*` | 解析响应 | `parseAnalysisResponse()`, `parseTitlesResponse()` |
| `validate*` | 验证数据 | `validatePlatformDimensions()`, `validateRequest()` |

### 5.3 存储函数

| 前缀 | 用途 | 示例 |
|------|------|------|
| `uploadTo*` | 上传到存储 | `uploadToR2()` |
| `getFrom*` | 从存储获取 | `getFromR2()` |
| `deleteFrom*` | 从存储删除 | `deleteFromR2()` |

---

## 6. 类命名约定

| 后缀 | 用途 | 示例 |
|------|------|------|
| `*Agent` | AI 任务代理 | `TextAnalysisAgent`, `TitleGenerationAgent`, `ImageGenerationAgent` |
| `*Provider` | 外部服务适配 | `OpenAIProvider`, `ReplicateProvider`, `GeminiProvider` |
| `*Pipeline` | 流程编排 | `CoverGenerationPipeline` |
| `*Service` | 业务服务 | `ModerationService` |

---

## 7. 禁止使用的命名

| 类型 | 禁止示例 | 正确示例 |
|------|----------|----------|
| 单字母变量 | `a`, `b`, `x` | `platform`, `template`, `result` |
| 语义模糊名称 | `data`, `obj`, `res` | `analysisResult`, `platformConfig`, `apiResponse` |
| 无意义缩写 | `usr`, `cfg`, `txt` | `user`, `config`, `text` |
| 匈牙利命名法 | `strName`, `arrItems` | `name`, `items` |

### 允许的通用缩写

| 缩写 | 全称 | 使用场景 |
|------|------|----------|
| `id` | identifier | 标识符 |
| `url` | uniform resource locator | 链接地址 |
| `api` | application programming interface | 接口 |
| `env` | environment | 环境变量 |
| `config` | configuration | 配置（常见，可接受） |

---

## 8. 日志与上下文命名

> 来源: `src/lib/utils/logger.ts`

```typescript
// 创建子日志器时的上下文命名
const pipelineLogger = logger.child({ component: "CoverPipeline" });
const agentLogger = logger.child({ agent: "TextAnalysisAgent" });
const requestLogger = createRequestLogger(requestId);
```

| 上下文键 | 用途 | 示例值 |
|----------|------|--------|
| `component` | 组件标识 | `"CoverPipeline"` |
| `agent` | AI 代理标识 | `"TextAnalysisAgent"`, `"ImageGenerator"` |
| `jobId` | 任务 ID | UUID 字符串 |
| `requestId` | 请求 ID | UUID 字符串 |
| `platformId` | 平台 ID | `"xiaohongshu"`, `"wechat"` |
| `templateId` | 模板 ID | `"minimal-clean"`, `"tech-blue"` |

---

*文档生成时间: 2025-12-22*  
*数据来源: 项目源代码静态分析*
