<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

﻿# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Active Technologies

- TypeScript 5.7, Next.js 14 (App Router), React 18
- Fabric.js 6 (canvas operations)
- AI: OpenAI, Google Gemini, Replicate, LangChain
- Storage: AWS S3 SDK (for Cloudflare R2)
- UI: Tailwind CSS, shadcn/ui, Framer Motion

## Project Overview

Cover is an AI-powered cover image generator for Chinese social media platforms (Xiaohongshu, WeChat, Taobao, Douyin). It uses multi-stage AI agent chains to process user text and generate platform-specific, publication-ready cover posters.

## 最高原则
1.  **可读性 > 抽象**：代码的可读性是绝对的最高优先级。除非能显著减少代码重复或降低复杂度，否则不要创建抽象。坚决避免“过度设计”。

2.  **务实使用高级特性**：仅当有明确的性能优势或架构必要性时，**才可以使用**高级模式（如单例模式、装饰器、工厂模式）。

3.  **显式优于隐式**：避免使用隐藏过多逻辑的“魔法”代码。显式定义返回类型和属性。

## Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)

# Build
npm run build            # Production build
npm start               # Start production server

# Code Quality
npm run lint            # ESLint
npm run type-check      # TypeScript check (tsc --noEmit)
```

## Architecture

### AI Generation Pipeline

**CoverCreativeDirector（单次 LLM 调用）**:
```
User Text → CoverCreativeDirector (LLM) → {
            analysis, titles, imagePrompt
         } → ImageGenerator → Image
```

> 旧的 3-LLM 模式（TextAnalyzer + TitleGenerator + 设计师 LLM）已于 2025-12-24 废弃删除。

### Image Generation Flow

```
ModelRegistry → ModelConfig (priority, API key, endpoint)
     ↓
ImageGenerationAgent.generateImage()
     ↓
1. Check Cache (CacheFactory) → Return if hit
     ↓
2. Build Image Prompt (Designer LLM + Style Injection)
     ↓
3. generateWithFallback() → Retry (exponential backoff)
                         → Fallback (fallbackTo model)
     ↓
4. Provider.generateImage() → URL or Buffer
     ↓
5. Optimize Image (WebP, resize) → Upload to Storage
     ↓
6. Cache Result (30 min TTL)
```

### Storage Abstraction

```
STORAGE_MODE (env: "local" | "r2")
     ↓
StorageDriver interface
     ├─ LocalStorageDriver (fs/promises) → .local-storage/
     └─ R2StorageDriver (@aws-sdk/client-s3) → Cloudflare R2
```

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ImageGenerationAgent` | `lib/ai/agents/` | Image generation with retry/fallback, caching |
| `CoverCreativeDirector` | `lib/ai/agents/` | Unified 1-LLM agent for analysis+titles+prompt |
| `ModelRegistry` | `lib/ai/config/` | Returns available models based on API keys |
| `OpenAIProvider` | `lib/ai/providers/` | DALL-E, GPT-4o, Flux (via Laozhang) |
| `GeminiImageProvider` | `lib/ai/providers/` | Gemini 2.5/3 Pro Image |
| `TextPositioningManager` | `lib/canvas/` | Fabric.js text positioning, drag-and-drop |
| `CanvasExporter` | `lib/canvas/` | Multi-format export (PNG/JPG/WebP/SVG) |
| `StorageDriver` | `lib/storage/` | Unified upload/get/delete API |

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Dashboard route group
│   │   ├── generate/             # Main generation page
│   │   └── results/[jobId]/      # Results page
│   ├── api/                      # API Routes
│   │   ├── generate/             # Cover generation endpoints
│   │   ├── models/               # Model list API
│   │   ├── storage/              # Local storage access
│   │   └── visual-styles/        # Visual style templates
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── forms/                    # ModelSelector, PlatformSelector, etc.
│   └── covers/                   # CoverGenerator, InfiniteCanvas, etc.
├── lib/
│   ├── ai/
│   │   ├── config/               # ModelRegistry, ImageModelConfig
│   │   ├── providers/            # AI Provider (OpenAI, Gemini, Replicate)
│   │   ├── agents/               # Business agents
│   │   ├── pipeline/             # CoverPipeline orchestrator
│   │   └── prompts/              # Designer LLM prompts + visual styles
│   ├── storage/                  # StorageDriver (local/R2)
│   ├── canvas/                   # Fabric.js managers
│   ├── platforms/                # Platform specifications
│   └── middleware/               # Analytics, moderation, rate-limit
├── types/                        # TypeScript type definitions
└── hooks/                        # React hooks
```

## Fabric.js v6 Usage

Use ES Module named imports (not default):

```typescript
import { Canvas, IText, FabricObject, FabricImage, Shadow } from "fabric";
```

## Environment Variables

Key variables (see `.env.local.example`):

```bash
# AI Provider API Keys (at least one required)
OPENAI_API_KEY=                    # OpenAI Official
GOOGLE_AI_API_KEY=                 # Google Gemini
REPLICATE_API_TOKEN=               # Replicate
LAOZHANG_API_KEY=                  # Laozhang API relay (recommended)
ZHIPUAI_API_KEY=                   # 智谱 AI (GLM-4 for CoverCreativeDirector)

# LLM Provider Selection (optional, auto-detected by default)
LLM_PROVIDER=zhipu_glm46           # Options: zhipu_glm46, gemini_flash, openai_gpt4o

# Storage Mode
STORAGE_MODE=local                 # "local" (dev) or "r2" (prod)

# Cloudflare R2 (only if STORAGE_MODE=r2)
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_PUBLIC_URL=

# Pipeline Mode (已废弃，现在始终使用 CreativeDirector)
# USE_CREATIVE_DIRECTOR=true
```

## API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/generate` | POST | Main cover generation (async job) |
| `/api/generate/[jobId]` | GET | Job status polling |
| `/api/models` | GET | Available AI models |
| `/api/storage/[...path]` | GET/POST | Local file access |
| `/api/visual-styles` | GET | Visual style templates |

## Code Style Rules (Project Constitution)

This project follows **strict glue development principles**:

1. **No custom core algorithms** - Delegate all AI, storage, canvas operations to mature libraries
2. **No wrapper classes** - Direct library API calls in business orchestrators
3. **Zero-copy integration** - Load libraries via package manager, never copy code locally
4. **Single Source of Truth** - All UI/business decisions based on locally extracted data
5. **Schema validation at entry** - Zod validation at API boundaries
6. **Separate I/O from computation** - Pure functions vs side effects strictly separated
7. **Precise variable names** - No `data`, `obj`, `res` - use business-meaningful names
8. **Transform errors** - Catch and convert to business-semantic errors
9. **No magic values** - Extract to constants/config
10. **Single responsibility** - Glue code functions handle one flow node only
11. **Stateless pipelines** - Prefer pipelines over state machines
12. **Explicit resource lifecycle** - Use try-finally for resources

## Recent Changes

- 2025-12-24: 删除废弃的 TextAnalyzer/TitleGenerator，系统强制使用 CoverCreativeDirector
- 2025-12-24: 创建 API 参考文档 (`docs/api-reference.md`)
- 2025-12-23: Designer Prompt System - LLM-driven prompts with 6 visual style templates
- 2025-12-23: ModelSelector integration - User-selectable image generation models
- 2025-12-22: Fabric.js v6 migration - ES Module imports, removed @types/fabric
