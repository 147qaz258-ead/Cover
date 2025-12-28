# Cover 系统架构原则

> 本文档基于项目实际代码结构和数据流提取，确保与代码库一致。

---

## 1. 分层架构

### 1.1 层次划分

```
┌─────────────────────────────────────────────────────────────────┐
│                        展示层 PRESENTATION                       │
│  src/app/          Next.js 路由与页面                            │
│  src/components/   React 组件 (covers/, forms/, ui/)            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼ HTTP API 调用
┌─────────────────────────────────────────────────────────────────┐
│                        接口层 API LAYER                          │
│  src/app/api/generate/route.ts    POST: 创建任务 / GET: 查询    │
│  src/lib/middleware/              中间件 (限流、内容审核)        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      业务逻辑层 BUSINESS LOGIC                   │
│  src/lib/ai/pipeline/cover-pipeline.ts                          │
│  - CoverGenerationPipeline 类                                   │
│  - execute() / executeWithProgress()                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        代理层 AI AGENTS                          │
│  src/lib/ai/agents/text-analyzer.ts    文本分析代理              │
│  src/lib/ai/agents/title-generator.ts  标题生成代理              │
│  src/lib/ai/agents/image-generator.ts  图像生成代理              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      提供商层 AI PROVIDERS                       │
│  src/lib/ai/providers/openai.ts       OpenAI 适配               │
│  src/lib/ai/providers/gemini.ts       Google Gemini 适配        │
│  src/lib/ai/providers/replicate.ts    Replicate 适配            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     基础设施层 INFRASTRUCTURE                    │
│  src/lib/storage/r2.ts           Cloudflare R2 存储             │
│  src/lib/platforms/specs.ts      平台配置 (10 个平台)           │
│  src/data/templates/index.ts     风格模板 (10 种样式)           │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 调用规则

| 规则 | 说明 |
|------|------|
| **只允许上层调用下层** | 展示层 → API 层 → 业务层 → 代理层 → 提供商层 → 基础设施层 |
| **禁止跨层调用** | 展示层不得直接调用提供商层 |
| **禁止反向调用** | 代理层不得调用业务层 |

---

## 2. 核心数据流

### 2.1 封面生成管道

> 来源: `src/lib/ai/pipeline/cover-pipeline.ts`

```
输入                                                           输出
CoverGenerationRequest                                     CoverGenerationResult[]
     │                                                            ▲
     ▼                                                            │
┌─────────────────────────────────────────────────────────────────┴───────┐
│                     CoverGenerationPipeline.execute()                    │
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌────────┐ │
│  │  Step 1      │    │  Step 2      │    │  Step 3      │    │ Step 4 │ │
│  │  文本分析    │───▶│  标题生成    │───▶│  图像生成    │───▶│ 组装   │ │
│  │  权重: 20%   │    │  权重: 30%   │    │  权重: 45%   │    │  5%    │ │
│  │              │    │              │    │              │    │        │ │
│  │ TextAnalyzer │    │ TitleGen     │    │ ImageGen     │    │ 结果   │ │
│  │ .analyzeText │    │ .generateTitles│  │ .generateImage│   │ 拼装   │ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └────────┘ │
│         │                   │                   │                       │
│         ▼                   ▼                   ▼                       │
│    analysis ───────▶ titlesByPlatform ──▶ imageUrls ──────▶ results    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 数据转换链路

| 阶段 | 输入 | 输出 | 代理 |
|------|------|------|------|
| 文本分析 | `text: string` | `TextAnalysisResult` | `textAnalyzer` |
| 标题生成 | `text` + `analysis` + `platformId` | `GeneratedTitle[]` | `titleGenerator` |
| 图像生成 | `title` + `platform` + `template` | `imageUrl: string` | `imageGenerator` |
| 结果组装 | 所有中间结果 | `CoverGenerationResult[]` | Pipeline 内部 |

---

## 3. 模块职责

### 3.1 Pipeline 层

| 类/函数 | 文件 | 职责 |
|---------|------|------|
| `CoverGenerationPipeline` | `cover-pipeline.ts` | 编排 4 个步骤的执行顺序 |
| `execute()` | 同上 | 同步执行管道 |
| `executeWithProgress()` | 同上 | 带进度回调的执行 |

### 3.2 Agent 层

| 类 | 文件 | 职责 |
|----|------|------|
| `TextAnalysisAgent` | `text-analyzer.ts` | 分析文本，提取关键点/情感/主题 |
| `TitleGenerationAgent` | `title-generator.ts` | 为每个平台生成多个标题候选 |
| `ImageGenerationAgent` | `image-generator.ts` | 生成封面图像并上传到 R2 |

### 3.3 Provider 层

| 类 | 文件 | 外部 API |
|----|------|----------|
| `OpenAIProvider` | `openai.ts` | GPT-4, DALL-E 3, Moderation |
| `GeminiProvider` | `gemini.ts` | Gemini Pro |
| `ReplicateProvider` | `replicate.ts` | Stable Diffusion |

---

## 4. 设计原则

### 4.1 胶水编程原则

来源: `CLAUDE.md`

| 原则 | 实现方式 |
|------|----------|
| **核心算法委托** | AI 任务全部调用 OpenAI/Replicate API |
| **薄适配层** | Provider 类仅封装 SDK 调用，不包含业务逻辑 |
| **立即提取数据** | Agent 调用 Provider 后解析响应并返回核心数据结构 |
| **无状态管道** | Pipeline 不维护复杂状态机，每个步骤独立 |

### 4.2 单一职责

```
Pipeline    →  编排步骤顺序
Agent       →  封装单个 AI 任务的 prompt 构建与响应解析
Provider    →  封装单个外部 API 的调用参数
```

### 4.3 依赖注入模式

```typescript
// Agent 通过工厂函数获取 Provider 单例
private readonly openai = getOpenAIProvider();
private readonly replicate = getReplicateProvider();
```

---

## 5. 技术栈选型

| 层 | 技术 | 选型理由 |
|----|------|----------|
| 框架 | Next.js 14 (App Router) | 服务端渲染 + API 路由一体化 |
| 语言 | TypeScript 5.x | 类型安全，提升可维护性 |
| AI 文本 | OpenAI GPT-4 | 高质量中文理解与生成 |
| AI 图像 | DALL-E 3 / Stable Diffusion | 多样化图像生成能力 |
| 存储 | Cloudflare R2 | S3 兼容，成本低 |
| 校验 | Zod | 运行时类型校验 |
| UI 组件 | Radix UI + Tailwind CSS | 无障碍组件 + 实用优先样式 |
| 画布 | Fabric.js 6.x | 封面编辑器 |

---

## 6. 扩展指南

### 6.1 添加新平台

1. 在 `src/lib/platforms/specs.ts` 的 `PLATFORMS` 数组中添加新配置
2. 更新 `getPlatformsByCategory()` 分类函数（如需要）
3. 在 `ImageGenerationAgent.buildImagePrompt()` 中添加平台特定提示词

### 6.2 添加新风格模板

1. 在 `src/data/templates/index.ts` 的 `STYLE_TEMPLATES` 数组中添加新配置
2. 更新 `getStyleTemplatesByCategory()` 分类函数（如需要）
3. 在 `ImageGenerationAgent.buildImagePrompt()` 中添加风格特定描述

### 6.3 添加新 AI 提供商

1. 在 `src/lib/ai/providers/` 目录创建新 Provider 类文件
2. 实现 `generateText()` 或 `generateImage()` 方法
3. 在 `src/lib/ai/providers/index.ts` 中导出工厂函数
4. 更新 `AI_PROVIDERS` 常量和 `getAIProvider()` 函数
5. 在 Agent 层选择性调用新 Provider

---

*文档生成时间: 2025-12-22*  
*数据来源: 项目源代码结构分析*
